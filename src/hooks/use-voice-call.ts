import { useCallback, useEffect, useRef, useState } from "react";

import type { ConversationMessage } from "@/lib/mock-data";

export type CallStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking";

export type VoiceLanguage = "en" | "ur";

export interface AgentReply {
  reply: string;
  sources?: string[];
  provider?: string;
}

export type ReplyProvider = (text: string) => Promise<AgentReply>;

export interface CallMessage extends ConversationMessage {
  sources?: string[];
  provider?: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const GREETINGS: Record<VoiceLanguage, string> = {
  en: "Hello! How can I help you today?",
  ur: "Assalam-o-Alaikum! Main aap ki kya madad kar sakta hoon?",
};

const FALLBACK_REPLIES: Record<VoiceLanguage, string> = {
  en: "I don't have that information right now. Would you like me to connect you with a human agent?",
  ur: "Maaf kijiye, ye maloomat mere paas abhi mojood nahi. Kya main aap ko kisi human agent se milwa doon?",
};

function getLocalFallbackReply(text: string, language: VoiceLanguage): AgentReply {
  const normalized = text.toLowerCase();
  const rules: Array<{
    keywords: string[];
    en: string;
    ur: string;
  }> = [
    {
      keywords: ["return", "refund", "exchange", "wapas"],
      en: "Our return policy allows returns of unused items within 30 days for a full refund.",
      ur: "Unused cheezein 30 din ke andar wapas kar ke poora refund le sakte hain.",
    },
    {
      keywords: ["shipping", "delivery", "deliver", "order", "tracking"],
      en: "We deliver nationwide within 3 to 5 business days with SMS tracking.",
      ur: "Pooray mulk mein 3 se 5 din mein delivery hoti hai, tracking link SMS par aata hai.",
    },
  ];
  const match = rules.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );
  if (!match) {
    return { reply: FALLBACK_REPLIES[language], provider: "local" };
  }
  return { reply: match[language], provider: "local" };
}

export function useVoiceCall(
  language: VoiceLanguage,
  replyProvider?: ReplyProvider
) {
  const [supported] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  );
  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [interimText, setInterimText] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const callActiveRef = useRef(false);
  const statusRef = useRef<CallStatus>("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const replyProviderRef = useRef<ReplyProvider | undefined>(replyProvider);
  const languageRef = useRef<VoiceLanguage>(language);
  const handleUtteranceRef = useRef<(text: string) => Promise<void>>(
    async () => {}
  );
  const endCallRef = useRef<() => void>(() => {});

  useEffect(() => {
    replyProviderRef.current = replyProvider;
  }, [replyProvider]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const updateStatus = useCallback((next: CallStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const pushMessage = useCallback(
    (role: ConversationMessage["role"], content: string, meta?: Omit<CallMessage, keyof ConversationMessage | "role" | "content">) => {
      setMessages((prev) => [
        ...prev,
        {
          role,
          content,
          timestamp: new Date().toISOString(),
          ...meta,
        },
      ]);
    },
    []
  );

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          resolve();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang =
          languageRef.current === "ur" ? "ur-PK" : "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }),
    []
  );

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onend = null;
    recognition.onresult = null;
    recognition.onerror = null;
    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort();
      } catch {
        // noop
      }
    }
    recognitionRef.current = null;
  }, []);

  const resolveReply = useCallback(
    async (text: string): Promise<AgentReply> => {
      const provider = replyProviderRef.current;
      if (provider) {
        try {
          return await provider(text);
        } catch {
          // API fail ho to local fallback par chalein
        }
      }
      await sleep(400);
      return getLocalFallbackReply(text, languageRef.current);
    },
    []
  );

  const handleUtterance = useCallback(
    async (text: string) => {
      setInterimText("");
      updateStatus("thinking");
      pushMessage("customer", text);
      const result = await resolveReply(text);
      if (!callActiveRef.current) return;
      pushMessage("agent", result.reply, {
        sources: result.sources,
        provider: result.provider,
      });
      updateStatus("speaking");
      await speak(result.reply);
      if (!callActiveRef.current) return;
      updateStatus("listening");
      try {
        recognitionRef.current?.start();
      } catch {
        // already started
      }
    },
    [pushMessage, resolveReply, speak, updateStatus]
  );

  useEffect(() => {
    handleUtteranceRef.current = handleUtterance;
  }, [handleUtterance]);

  const startListening = useCallback(() => {
    if (!callActiveRef.current) return;
    const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!ctor) return;

    stopListening();
    const recognition = new ctor();
    recognition.lang =
      languageRef.current === "ur" ? "ur-PK" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (finalText.trim()) {
        void handleUtteranceRef.current(finalText.trim());
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setMicError(
          "Microphone permission denied. Browser settings se mic allow karein."
        );
        endCallRef.current();
      }
    };

    recognition.onend = () => {
      if (callActiveRef.current && statusRef.current === "listening") {
        setTimeout(() => {
          if (
            callActiveRef.current &&
            statusRef.current === "listening"
          ) {
            try {
              recognition.start();
            } catch {
              // already started
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    updateStatus("listening");
    try {
      recognition.start();
    } catch {
      // already started
    }
  }, [stopListening, updateStatus]);

  const startCall = useCallback(async () => {
    if (!supported || callActiveRef.current) return;
    setMessages([]);
    setDurationSec(0);
    setMicError(null);
    setInterimText("");
    callActiveRef.current = true;

    updateStatus("connecting");
    await sleep(500);
    if (!callActiveRef.current) return;

    const greeting = GREETINGS[languageRef.current];
    pushMessage("agent", greeting, { provider: "system" });
    updateStatus("speaking");
    await speak(greeting);
    if (!callActiveRef.current) return;

    startListening();
  }, [pushMessage, speak, startListening, supported, updateStatus]);

  const endCall = useCallback(() => {
    callActiveRef.current = false;
    stopListening();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setInterimText("");
    updateStatus("idle");
  }, [stopListening, updateStatus]);

  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  const isActive = status !== "idle";

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setDurationSec((sec) => sec + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  useEffect(() => {
    return () => {
      callActiveRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;
        try {
          recognition.abort();
        } catch {
          // noop
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
