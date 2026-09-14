"use client";

import Link from "next/link";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Delete,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Radio,
  RotateCcw,
  Save,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useVoiceCallV2 as useVoiceCall, type AgentReply, type CallMessage, type CallStatus } from "@/hooks/use-voice-call-v2";
import { chatWithAgent, listAgents, saveConversation, type Agent } from "@/lib/ai-client";
import { ApiError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDuration } from "@/lib/mock-data";

const statusConfig: Record<CallStatus, { label: string; tone: string }> = {
  idle: { label: "Ready", tone: "text-muted-foreground" },
  connecting: { label: "Connecting…", tone: "text-yellow-500" },
  listening: { label: "Listening…", tone: "text-green-500" },
  thinking: { label: "Thinking…", tone: "text-yellow-500" },
  speaking: { label: "Agent is speaking…", tone: "text-primary" },
};


export default function TestCallsPage() {
  const { activeWorkspace } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "ur">("en");

  // Load available agents for this workspace
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    listAgents(activeWorkspace.id)
      .then((list) => {
        setAgents(list);
        const defaultAgent = list.find((a) => a.is_default) || list[0];
        if (defaultAgent) {
          setSelectedAgentId(defaultAgent.id);
          setLanguage(defaultAgent.language);
        }
      })
      .catch(() => {});
  }, [activeWorkspace?.id]);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    const ag = agents.find((a) => a.id === agentId);
    if (ag) {
      setLanguage(ag.language);
    }
  };

  const [pauseTolerance, setPauseTolerance] = useState<number>(2000); // 2000ms natural speaking pause

  const makeReplyProvider = useCallback(
    (workspaceId: string, currentAgentId: string) =>
      async (
        text: string,
        history?: Array<{ role: string; content: string }>
      ): Promise<AgentReply> => {
        const result = await chatWithAgent(text, workspaceId, language, history, currentAgentId);
        return {
          reply: result.reply,
          sources: result.sources.map((source) => source.document_name),
          provider: result.provider,
        };
      },
    [language]
  );

  const voiceCall = useVoiceCall(
    language,
    activeWorkspace ? makeReplyProvider(activeWorkspace.id, selectedAgentId) : undefined,
    { silenceMs: pauseTolerance }
  );

  const {
    supported,
    status,
    isActive,
    messages,
    interimText,
    durationSec,
    micError,
  } = voiceCall;

  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleSave() {
    if (!activeWorkspace || messages.length === 0) return;
    try {
      const result = await saveConversation({
        workspace_id: activeWorkspace.id,
        language,
        status: "resolved",
        duration_sec: durationSec,
        messages: messages
                    .map((m) => ({ role: m.role, content: m.content })),
      });
      setSavedId(result.id);
      toast.success("Conversation saved to history!", {
        description: "Conversations page par dekh sakte hain.",
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Save failed.";
      toast.error(message);
    }
  }

  async function handleEndCall() {
    voiceCall.endCall();
    if (activeWorkspace && messages.length > 1 && !savedId) {
      try {
        const result = await saveConversation({
          workspace_id: activeWorkspace.id,
          language,
          status: "resolved",
          duration_sec: durationSec,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        setSavedId(result.id);
        toast.success("Call ended & saved to history!", {
          description: "Conversations page par transcript aur duration save ho gayi hai.",
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }
  }

  const currentAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Your Agent</h1>
          <p className="text-sm text-muted-foreground">
            Browser se apne AI agent se live call karein — jawab uske assigned knowledge bases se aayenge.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {agents.length > 0 && (
            <div className="w-72">
              <Select
                value={selectedAgentId}
                onValueChange={handleAgentChange}
                disabled={isActive}
              >
                <SelectTrigger className="h-9 font-medium text-xs [&>span]:truncate" aria-label="Target Agent">
                  <SelectValue placeholder="Select Agent to Test" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((ag) => (
                    <SelectItem key={ag.id} value={ag.id}>
                      {ag.name} {ag.is_default ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="w-32">
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as "en" | "ur")}
              disabled={isActive}
            >
              <SelectTrigger className="h-9" aria-label="Language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ur">Urdu (اردو)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select
              value={String(pauseTolerance)}
              onValueChange={(value) => setPauseTolerance(Number(value))}
              disabled={isActive}
            >
              <SelectTrigger className="h-9 text-xs" aria-label="Pause Tolerance">
                <SelectValue placeholder="Pause Buffer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1500">Fast (1.5s pause)</SelectItem>
                <SelectItem value="2000">Normal (2.0s pause)</SelectItem>
                <SelectItem value="2500">Relaxed (2.5s pause)</SelectItem>
                <SelectItem value="3000">Slow / Deep thinker (3.0s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!supported ? (
        <Alert className="border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500">
          <MicOff className="size-4" />
          <AlertDescription>
            Microphone access ya MediaRecorder support nahi mila. Chrome, Edge ya Firefox use karein.
          </AlertDescription>
        </Alert>
      ) : null}

      {micError ? (
        <Alert variant="destructive">
          <MicOff className="size-4" />
          <AlertDescription>{micError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/50">
          <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-8 p-8">
            <div className="relative flex size-36 items-center justify-center">
              {status === "listening" ? (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                  <span className="absolute inset-3 animate-ping rounded-full bg-green-500/15 [animation-delay:300ms]" />
                </>
              ) : null}
              {status === "speaking" ? (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <span className="absolute inset-3 animate-ping rounded-full bg-primary/15 [animation-delay:300ms]" />
                </>
              ) : null}
              {status === "thinking" ? (
                <span className="absolute inset-0 animate-pulse rounded-full bg-yellow-500/10" />
              ) : null}
              <span
                className={`relative flex size-28 items-center justify-center rounded-full shadow-lg transition-all ${
                  status === "idle"
                    ? "bg-gradient-to-br from-primary to-fuchsia-600 shadow-primary/30"
                    : status === "listening"
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30"
                      : status === "speaking"
                        ? "bg-gradient-to-br from-primary to-fuchsia-600 shadow-primary/30"
                        : "bg-muted shadow-none"
                }`}
              >
                <Mic className="size-12 text-white" />
              </span>
            </div>

            <div className="space-y-1 text-center">
              <p
                className={`font-medium ${statusConfig[status].tone}`}
                aria-live="polite"
              >
                {statusConfig[status].label}
              </p>
              {status === "speaking" ? (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Aap bol kar agent ko darmiyan mein interrupt kar sakte hain
                </p>
              ) : null}
              {status === "listening" && interimText ? (
                <p className="mx-auto max-w-xs text-sm italic text-muted-foreground">
                  &ldquo;{interimText}&rdquo;
                </p>
              ) : null}
              {isActive ? (
                <p className="font-mono text-sm tabular-nums text-muted-foreground">
                  {formatDuration(durationSec)}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {status === "idle" ? (
                <Button
                  size="lg"
                  className="h-12 px-8"
                  disabled={!supported}
                  onClick={() => void voiceCall.startCall()}
                >
                  <PhoneCall />
                  Start Call
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-12 px-8"
                  onClick={handleEndCall}
                >
                  <PhoneOff />
                  End Call
                </Button>
              )}
            </div>

            {messages.length > 0 && !isActive ? (
              savedId ? (
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/conversations/${savedId}`}>
                    <CheckCircle2 className="text-green-500" />
                    Saved — View Conversation
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => void handleSave()}>
                  <Save />
                  Save Conversation
                </Button>
              )
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Live Transcript
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500 font-normal text-[11px]">
                  ✦ Noise Suppression &amp; Echo Cancel
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/15 text-blue-500 font-normal text-[11px]">
                  ⚡ Barge-In Interruption Active
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Real-time conversation yahan appear hogi.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[360px] space-y-3 overflow-y-auto">
            {messages.length === 0 && !interimText ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 text-center">
                <Mic className="size-7 text-muted-foreground" />
                <p className="max-w-[240px] text-sm text-muted-foreground">
                  Call start karein — aap ki baat cheet yahan live likhi
                  jayegi.
                </p>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <MessageBubble key={`${message.timestamp}-${index}`} message={message} />
            ))}
            {status === "listening" && interimText ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-dashed border-border px-4 py-2.5">
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    You
                  </p>
                  <p className="text-sm italic text-muted-foreground">
                    {interimText}…
                  </p>
                </div>
              </div>
            ) : null}
            {status === "thinking" ? (
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-sm bg-primary/70 px-4 py-2.5">
                  <span className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="size-1.5 animate-bounce rounded-full bg-white"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Interactive Virtual Phone Dialer & Telephony Inspector */}
      <Card className="border-primary/30 bg-card/60 shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="size-4 text-primary animate-pulse" />
                Interactive Phone Simulator &amp; Dialer (Zero-Cost Testing)
              </CardTitle>
              <CardDescription>
                Bina kisi paid Twilio number ke, seedha browser se live phone call simulate karein aur poori backend telephony pipeline test karein.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Mock Softphone Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-12">
            {/* Phone Keypad Mock */}
            <div className="md:col-span-5 flex flex-col items-center rounded-2xl border border-border/70 bg-muted/40 p-5 shadow-inner space-y-4">
              <div className="w-full text-center space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Virtual Cellular Dialer
                </span>
                <p className="font-mono text-lg font-bold text-foreground tracking-wider h-8 flex items-center justify-center bg-background/80 rounded-lg border border-border/60">
                  +1 (800) 555-0199
                </p>
                <p className="text-[11px] text-emerald-500 font-medium">
                  {status === "idle" ? "● Ready to Dial" : status === "listening" ? "● On Call — Listening..." : "● On Call — Agent Speaking"}
                </p>
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[220px]">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="flex h-11 items-center justify-center rounded-xl border border-border/50 bg-background/70 font-mono text-sm font-semibold text-foreground/90 transition-all hover:bg-primary/20 hover:text-primary active:scale-95 shadow-sm"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-3 pt-2">
                {status === "idle" ? (
                  <Button
                    size="lg"
                    className="h-12 w-36 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 shadow-lg gap-2"
                    onClick={() => {
                      void voiceCall.startCall();
                      toast.info("Simulating Incoming Call...", {
                        description: "AI Agent ne phone pick kar liya hai!",
                      });
                    }}
                  >
                    <PhoneIncoming className="size-4" />
                    Dial Agent
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-12 w-36 rounded-full shadow-red-500/25 shadow-lg gap-2"
                    onClick={voiceCall.endCall}
                  >
                    <PhoneOff className="size-4" />
                    Hang Up
                  </Button>
                )}
              </div>
            </div>

            {/* Telephony Inspector & Live XML */}
            <div className="md:col-span-7 flex flex-col justify-between rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PhoneForwarded className="size-3.5 text-primary" />
                    Live Telephony Pipeline Inspector
                  </span>
                  <Badge variant="outline" className="text-[10px]">TwiML Protocol</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Jab real customer is number par call karega, Twilio hamare backend se ye live XML instructions receive karega:
                </p>
                <pre className="font-mono text-[11px] text-foreground/90 bg-background/90 p-3 rounded-lg border border-border/60 overflow-x-auto leading-relaxed">
{`<Response>
  <Say voice="Polly.Joanna">
    ${language === "en" ? "Welcome to VocalIQ support. How can I help you?" : "VocalIQ support mein khush-aamdeed. Main kya madad karoon?"}
  </Say>
  <Gather input="speech" action="/telephony/twilio/gather-response">
    <Say voice="Polly.Joanna">Please speak after the tone.</Say>
  </Gather>
</Response>`}
                </pre>
              </div>

              <div className="rounded-lg border border-border/50 bg-background/50 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Telephony Webhook URL:</span>
                  <Badge variant="secondary" className="text-[10px]">POST</Badge>
                </div>
                <p className="font-mono text-[11px] text-primary truncate select-all">
                  {activeWorkspace
                    ? `http://localhost:8000/telephony/twilio/incoming-voice?workspace_id=${activeWorkspace.id}&language=${language}`
                    : "Workspace select karein..."}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Baad mein bas ye URL apne Twilio Console mein paste karein — koi code change karne ki zaroorat nahi.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <p className="text-center text-xs text-muted-foreground">
        Powered by <span className="font-medium text-foreground">faster-whisper</span> STT &amp;{" "}
        <span className="font-medium text-foreground">edge-tts</span> neural voices — local, private, no API key.
      </p>
    </div>
  );
}


function MessageBubble({ message }: { message: CallMessage }) {
  const isCustomer = message.role === "customer";
  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isCustomer
            ? "rounded-bl-sm bg-muted"
            : "rounded-br-sm bg-primary text-primary-foreground"
        }`}
      >
        <p className="mb-0.5 text-xs font-medium opacity-70">
          {isCustomer ? "You" : "AI Agent"}
        </p>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        {!isCustomer && message.sources && message.sources.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.sources.map((source) => (
              <Badge
                key={source}
                variant="outline"
                className="border-white/30 px-1.5 py-0 text-[10px] text-inherit"
              >
                📄 {source}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
