"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ConversationMessage } from "@/lib/mock-data";
import { transcribeAudio, synthesizeSpeech } from "@/lib/ai-client";

export type CallStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking";

export type VoiceLanguage = "en" | "ur";

export interface CallMessage extends ConversationMessage {
  sources?: string[];
  provider?: string;
}

export interface AgentReply {
  reply: string;
  sources?: string[];
  provider?: string;
}

export type ReplyProvider = (
  text: string,
  history?: Array<{ role: string; content: string }>
) => Promise<AgentReply>;

// ---------- helpers ----------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const GREETINGS: Record<VoiceLanguage, string> = {
  en: "Hello! How can I help you today?",
  ur: "السلام علیکم! فرمائیے، میں آپ کی کیا مدد کر سکتا ہوں؟",
};

const DEFAULT_SILENCE_MS = 2000;  // 2.0s natural pause buffer so agent doesn't interrupt mid-sentence
const MAX_RECORD_MS = 30_000;     // hard max per utterance

const PHANTOM_PHRASES = new Set([
  "thank you",
  "thank you.",
  "thank you very much",
  "thanks",
  "thanks.",
  "you",
  "you.",
  "i'm going to go",
  "i'm going to go.",
  "bye",
  "bye.",
  "bye bye",
  "subtitles by",
  "amara.org",
  "موسیقی",
  "موسیقی۔",
  "[موسیقی]",
  "(موسیقی)",
  "[music]",
  "(music)",
  "music",
]);

// ---------- hook ----------

export function useVoiceCallV2(
  language: VoiceLanguage,
  replyProvider?: ReplyProvider,
  options?: { silenceMs?: number }
) {
  const silenceMs = options?.silenceMs ?? DEFAULT_SILENCE_MS;
  const [supported] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.MediaRecorder) &&
      Boolean(navigator.mediaDevices?.getUserMedia)
  );

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [interimText, setInterimText] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const callActiveRef = useRef(false);
  const statusRef = useRef<CallStatus>("idle");
  const languageRef = useRef(language);
  const replyProviderRef = useRef(replyProvider);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const endCallRef = useRef<() => void>(() => {});
  const messagesRef = useRef<CallMessage[]>([]);
  const isProcessingUtteranceRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { replyProviderRef.current = replyProvider; }, [replyProvider]);
  const silenceMsRef = useRef(silenceMs);
  useEffect(() => {
    silenceMsRef.current = silenceMs;
  }, [silenceMs]);
  useEffect(() => { languageRef.current = language; }, [language]);

  const updateStatus = useCallback((next: CallStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch { /* noop */ }
      activeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const pushMessage = useCallback(
    (
      role: ConversationMessage["role"],
      content: string,
      meta?: Partial<CallMessage>
    ) => {
      const newMsg: CallMessage = {
        role,
        content,
        timestamp: new Date().toISOString(),
        ...meta,
      };
      messagesRef.current = [...messagesRef.current, newMsg];
      setMessages((prev) => [...prev, newMsg]);
    },
    []
  );

  // ---- TTS: play mp3 blob via Audio element ----
  const speakBlob = useCallback((blob: Blob) => {
    return new Promise<void>((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudioRef.current = audio;

      let resolved = false;
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          URL.revokeObjectURL(url);
          activeAudioRef.current = null;
          resolve();
        }
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;
      audio.play().catch(cleanup);
    });
  }, []);

  // ---- TTS: synthesise text using backend edge-tts ----
  const speakText = useCallback(
    async (text: string) => {
      try {
        const blob = await synthesizeSpeech(text, languageRef.current);
        await speakBlob(blob);
      } catch {
        // Fallback to browser SpeechSynthesis
        await new Promise<void>((resolve) => {
          if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            resolve();
            return;
          }
          const utt = new SpeechSynthesisUtterance(text);
          utt.lang = languageRef.current === "ur" ? "ur-PK" : "en-US";
          utt.onend = () => resolve();
          utt.onerror = () => resolve();
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utt);
        });
      }
    },
    [speakBlob]
  );

  // ---- Silence / Adaptive VAD detector ----
  const startSilenceDetector = useCallback(
    (
      stream: MediaStream,
      onSilence: (hasSpoken: boolean) => void,
      onSpeechDetected?: () => void
    ) => {
      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.2;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        let baselineNoise = 3.0;
        let hasSpoken = false;
        let lastSpeechTime = Date.now();
        let consecutiveSpeech = 0;
        let rafId = 0;

        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = data[i] - 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          // Calibrate baseline noise floor during non-speech
          if (!hasSpoken) {
            baselineNoise = baselineNoise * 0.95 + rms * 0.05;
          }

          // Dynamic thresholds based on ambient room sound
          const speechThreshold = Math.max(5.0, baselineNoise + 2.5);
          const silenceThreshold = Math.max(3.5, baselineNoise + 1.2);

          if (rms >= speechThreshold) {
            consecutiveSpeech++;
            if (!hasSpoken && consecutiveSpeech >= 2) {
              hasSpoken = true;
              onSpeechDetected?.();
            }
            // User is actively speaking: continually reset the timer!
            lastSpeechTime = Date.now();
          } else if (rms < silenceThreshold) {
            consecutiveSpeech = 0;
          } else if (hasSpoken) {
            // Soft speech / continuation: don't let timer run out prematurely
            lastSpeechTime = Date.now() - 200;
          }

          // ONLY trigger silence after user has stopped speaking for silenceMsRef
          const currentSilenceLimit = silenceMsRef.current || DEFAULT_SILENCE_MS;
          if (hasSpoken && Date.now() - lastSpeechTime >= currentSilenceLimit) {
            onSilence(true);
            return;
          }

          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
          cancelAnimationFrame(rafId);
          ctx.close().catch(() => {});
          audioCtxRef.current = null;
        };
      } catch {
        return () => {};
      }
    },
    []
  );

  // ---- Process one utterance ----
  const handleUtterance = useCallback(
    async (audioBlob: Blob) => {
      if (!callActiveRef.current || isProcessingUtteranceRef.current) return;
      isProcessingUtteranceRef.current = true;

      try {
        updateStatus("thinking");
        setInterimText("");

        let userText = "";
        try {
          const result = await transcribeAudio(audioBlob, languageRef.current);
          userText = result.text.trim();
        } catch {
          userText = "";
        }

        // Guard against empty or common whisper silence hallucinations (including Urdu "موسیقی")
        const norm = userText.toLowerCase().replace(/^[.\s!?,()[\]{}۔]+|[.\s!?,()[\]{}۔]+$/g, "");
        if (!userText || PHANTOM_PHRASES.has(norm) || PHANTOM_PHRASES.has(userText) || norm.length <= 1) {
          if (callActiveRef.current) updateStatus("listening");
          return;
        }

        const priorHistory = messagesRef.current.slice(-6).map((m) => ({
          role: m.role === "agent" ? "agent" : "customer",
          content: m.content,
        }));

        pushMessage("customer", userText);

        let agentReply: AgentReply = {
          reply: languageRef.current === "ur"
            ? "معاف کیجیے گا، کوئی مسئلہ آ گیا ہے۔ دوبارہ پوچھیے۔"
            : "Sorry, something went wrong. Please try again.",
        };
        try {
          if (replyProviderRef.current) {
            agentReply = await replyProviderRef.current(userText, priorHistory);
          }
        } catch { /* keep fallback */ }

        if (!callActiveRef.current) return;
        pushMessage("agent", agentReply.reply, {
          sources: agentReply.sources,
          provider: agentReply.provider,
        });

        updateStatus("speaking");
        await speakText(agentReply.reply);

        if (callActiveRef.current) updateStatus("listening");
      } finally {
        isProcessingUtteranceRef.current = false;
      }
    },
    [pushMessage, speakText, updateStatus]
  );

  // ---- Record one utterance ----
  const recordUtterance = useCallback(() => {
    if (!callActiveRef.current || statusRef.current !== "listening") return;
    const stream = streamRef.current;
    if (!stream) return;

    const chunks: Blob[] = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      return;
    }
    mediaRecorderRef.current = recorder;

    let utteranceHasSpoken = false;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      mediaRecorderRef.current = null;
      if (!callActiveRef.current) return;

      // If user never spoke (just room silence during listening), do NOT transcribe
      if (!utteranceHasSpoken) {
        if (statusRef.current === "listening") {
          setTimeout(() => {
            if (statusRef.current === "listening" && callActiveRef.current) {
              recordUtteranceRef.current();
            }
          }, 200);
        }
        return;
      }

      const blob = new Blob(chunks, { type: mimeType });
      void handleUtterance(blob);
    };

    // hard timeout: 25s max
    const hardStop = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, MAX_RECORD_MS);

    // silence detector with VAD
    const stopSilence = startSilenceDetector(
      stream,
      (_hasSpoken) => {
        utteranceHasSpoken = _hasSpoken;
        clearTimeout(hardStop);
        if (recorder.state === "recording") recorder.stop();
      },
      () => {
        utteranceHasSpoken = true;
      }
    );

    recorder.addEventListener("stop", () => stopSilence(), { once: true });
    recorder.start(100);
  }, [handleUtterance, startSilenceDetector]);

  // keep recordUtterance stable in a ref for the listening loop
  const recordUtteranceRef = useRef(recordUtterance);
  useEffect(() => { recordUtteranceRef.current = recordUtterance; }, [recordUtterance]);

  // watching status to trigger recording when entering "listening"
  useEffect(() => {
    if (status === "listening" && callActiveRef.current) {
      const id = setTimeout(() => {
        if (statusRef.current === "listening" && callActiveRef.current) {
          recordUtteranceRef.current();
        }
      }, 350); // 350ms breather to prevent agent echo feedback
      return () => clearTimeout(id);
    }
  }, [status]);

  // Barge-in (user interrupts while agent is speaking)
  useEffect(() => {
    if (status === "speaking" && callActiveRef.current && streamRef.current) {
      const stream = streamRef.current;
      let cleanupBargeIn: (() => void) | undefined;

      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtxClass();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        let consecutiveFrames = 0;
        let rafId = 0;
        const BARGE_IN_THRESHOLD = 18;
        const REQUIRED_FRAMES = 5; // ~80-100ms of sustained speech to confirm interruption

        const tick = () => {
          if (statusRef.current !== "speaking" || !callActiveRef.current) return;
          analyser.getByteTimeDomainData(data);
          const rms = Math.sqrt(
            data.reduce((s, v) => s + (v - 128) ** 2, 0) / data.length
          );

          if (rms >= BARGE_IN_THRESHOLD) {
            consecutiveFrames++;
            if (consecutiveFrames >= REQUIRED_FRAMES) {
              // User interrupted the agent -> cut off speech immediately!
              stopSpeaking();
              updateStatus("listening");
              return;
            }
          } else {
            consecutiveFrames = Math.max(0, consecutiveFrames - 1);
          }

          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        cleanupBargeIn = () => {
          cancelAnimationFrame(rafId);
          ctx.close().catch(() => {});
        };
      } catch { /* noop */ }

      return () => {
        cleanupBargeIn?.();
      };
    }
  }, [status, stopSpeaking, updateStatus]);

  // ---- Start call ----
  const startCall = useCallback(async () => {
    if (!supported || callActiveRef.current) return;
    setMessages([]);
    messagesRef.current = [];
    isProcessingUtteranceRef.current = false;
    setDurationSec(0);
    setMicError(null);
    setInterimText("");
    callActiveRef.current = true;

    updateStatus("connecting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch {
      setMicError("Microphone permission denied. Browser settings se mic allow karein.");
      callActiveRef.current = false;
      updateStatus("idle");
      return;
    }
    streamRef.current = stream;

    await sleep(300);
    if (!callActiveRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    const greeting = GREETINGS[languageRef.current];
    pushMessage("agent", greeting, { provider: "system" });
    updateStatus("speaking");
    await speakText(greeting);

    if (!callActiveRef.current) return;
    updateStatus("listening");
  }, [pushMessage, speakText, supported, updateStatus]);

  // ---- End call ----
  const endCall = useCallback(() => {
    callActiveRef.current = false;
    stopSpeaking();

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try { mr.stop(); } catch { /* noop */ }
    }
    mediaRecorderRef.current = null;

    const ctx = audioCtxRef.current;
    if (ctx) { ctx.close().catch(() => {}); audioCtxRef.current = null; }

    const stream = streamRef.current;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); streamRef.current = null; }

    setInterimText("");
    updateStatus("idle");
  }, [stopSpeaking, updateStatus]);

  useEffect(() => { endCallRef.current = endCall; }, [endCall]);

  // cleanup on unmount
  useEffect(() => {
    return () => { endCallRef.current(); };
  }, []);

  // call timer
  const isActive = status !== "idle";
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setDurationSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return {
    supported,
    status,
    isActive,
    messages,
    interimText,
    durationSec,
    micError,
    startCall,
    endCall,
  };
}
