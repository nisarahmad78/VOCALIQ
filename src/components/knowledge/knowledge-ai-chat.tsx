"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  FileCheck,
  Loader2,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import {
  createRawTextDocument,
  generateFaqFromPrompt,
  type FaqItem,
  type GenerateFaqResult,
} from "@/lib/ai-client";

interface KnowledgeAiChatProps {
  workspaceId: string;
  kbId?: string;
  kbName?: string;
  onDocumentCreated: () => void;
}

interface SessionHistory {
  id: string;
  title: string;
  faqs: FaqItem[];
  prompt: string;
  savedAt: string;
  language: "en" | "ur";
}

const QUICK_PROMPTS = [
  {
    title: "🕒 Office Timings",
    prompt:
      "Humara office Monday to Saturday subah 9 baje se shaam 7 baje tak open hota hai, aur Sunday ko complete off hota hai.",
  },
  {
    title: "🔄 Return & Refund",
    prompt:
      "Customers 14 days ke andar product return kar sakte hain agar item undamaged aur original packaging me ho. Refund 3-5 business days me process hota hai.",
  },
  {
    title: "🚚 Shipping & Delivery",
    prompt:
      "Delivery charges nationwide Rs. 200 hain. Orders 2 se 4 business days me deliver hote hain. Rs. 3000 se upar orders par free delivery hai.",
  },
  {
    title: "💳 Payment Methods",
    prompt:
      "Hum Cash on Delivery (COD), JazzCash, EasyPaisa aur Visa/Mastercard debit/credit cards accept karte hain.",
  },
  {
    title: "📦 Warranty",
    prompt:
      "Tamam products par 1 saal ki manufacturer warranty hai. Manufacturing defect ki soorat mein free replacement milti hai.",
  },
  {
    title: "📞 Customer Support",
    prompt:
      "Hamari customer support team 24/7 available hai. WhatsApp: 0300-1234567, Email: support@company.com par contact kar sakte hain.",
  },
];

const STORAGE_KEY = "vocaliq_faq_draft";
const HISTORY_KEY = "vocaliq_faq_history";
const MAX_CHARS = 5000;
const WARN_CHARS = 4000;

// ── Skeleton loading card ──────────────────────────────────────────────────
function FaqSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-border/60 bg-background/80 p-3 space-y-2 animate-pulse"
        >
          <div className="h-4 bg-muted/80 rounded-md w-3/4" />
          <div className="h-3 bg-muted/60 rounded-md w-full" />
          <div className="h-3 bg-muted/60 rounded-md w-5/6" />
        </div>
      ))}
    </div>
  );
}

// ── Animated Mic Waveform ──────────────────────────────────────────────────
function MicWaveform() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block w-0.5 rounded-full bg-red-500"
          style={{
            animation: `micWave 0.8s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
            height: `${8 + (i % 3) * 6}px`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes micWave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Collapsible FAQ Card ───────────────────────────────────────────────────
function FaqCard({
  faq,
  index,
  onChange,
  onRemove,
}: {
  faq: FaqItem;
  index: number;
  onChange: (field: "question" | "answer", val: string) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border/70 bg-background/90 shadow-sm overflow-hidden group transition-all">
      {/* Card header — always visible */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Drag hint */}
          <span className="text-muted-foreground/40 text-xs font-mono select-none hidden group-hover:inline">
            ⠿
          </span>
          <span className="text-xs font-bold text-primary shrink-0">Q{index + 1}</span>
          <span className="text-xs font-medium text-foreground truncate">
            {faq.question || "New Question?"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/40">
          <div className="pt-2">
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              Question
            </label>
            <Input
              value={faq.question}
              onChange={(e) => onChange("question", e.target.value)}
              placeholder="Customer ka sawal?"
              className="mt-1 h-8 text-xs font-medium bg-background/60"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              Answer
            </label>
            <Textarea
              value={faq.answer}
              onChange={(e) => onChange("answer", e.target.value)}
              placeholder="Helpful jawab..."
              className="mt-1 min-h-[60px] resize-none text-xs bg-background/60 p-2"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function KnowledgeAiChat({
  workspaceId,
  kbId,
  kbName,
  onDocumentCreated,
}: KnowledgeAiChatProps) {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<"en" | "ur">("ur");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimText, setInterimText] = useState("");

  // Generated FAQ state
  const [generatedResult, setGeneratedResult] = useState<GenerateFaqResult | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedFaqs, setEditedFaqs] = useState<FaqItem[]>([]);

  // Post-save success state
  const [savedDoc, setSavedDoc] = useState<{ name: string; chunks: number } | null>(null);

  // Session history (LocalStorage)
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Restore toast shown?
  const [draftRestoreShown, setDraftRestoreShown] = useState(false);

  const recognitionRef = useRef<any>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // ── LocalStorage: restore draft on mount ───────────────────────────────
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft && !draftRestoreShown) {
        const draft = JSON.parse(savedDraft);
        if (draft.prompt && draft.prompt.length > 10) {
          setDraftRestoreShown(true);
          toast.info("Aapka pehla draft mila!", {
            description: "Kya draft restore karna chahenge?",
            action: {
              label: "Restore",
              onClick: () => {
                setPrompt(draft.prompt ?? "");
                setLanguage(draft.language ?? "ur");
              },
            },
            duration: 6000,
          });
        }
      }

      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save draft on prompt change ──────────────────────────────────
  useEffect(() => {
    if (!prompt) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ prompt, language }));
      } catch {
        // ignore storage quota
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [prompt, language]);

  // ── Speech recognition setup ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "ur" ? "ur-PK" : "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        setPrompt((prev) =>
          prev ? `${prev.trim()} ${final.trim()}` : final.trim()
        );
        setInterimText("");
      } else if (interim) {
        setInterimText(interim);
      }
    };

    recognition.onerror = (err: any) => {
      setIsListening(false);
      setInterimText("");
      if (err.error === "not-allowed") {
        toast.error("Microphone permission denied. Browser settings check karein.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch { /* ignore */ }
    };
  }, [language]);

  // ── Char/word stats ───────────────────────────────────────────────────
  const charCount = prompt.length;
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const charPct = Math.min(100, (charCount / MAX_CHARS) * 100);
  const isNearLimit = charCount >= WARN_CHARS;
  const isAtLimit = charCount >= MAX_CHARS;
  const isReadyToGenerate = wordCount >= 10 && !isAtLimit;

  // ── Toggle mic ────────────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (!speechSupported || !recognitionRef.current) {
      toast.error("Voice input supported nahi hai. Chrome ya Edge use karein.");
      return;
    }
    if (isListening) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === "ur" ? "ur-PK" : "en-US";
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Mic ON! Ab bol sakte hain...", { duration: 2000 });
      } catch (e) {
        console.error("Speech recognition start failed:", e);
        setIsListening(false);
      }
    }
  }, [isListening, language, speechSupported]);

  // ── Generate FAQs ─────────────────────────────────────────────────────
  const handleGenerate = useCallback(
    async (textToUse?: string) => {
      const text = (textToUse ?? prompt).trim();
      if (!text) {
        toast.error("Pehle kuch likhen ya mic se bolein.");
        return;
      }
      if (isListening && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        setIsListening(false);
      }

      setSavedDoc(null);
      setIsGenerating(true);
      try {
        const result = await generateFaqFromPrompt(workspaceId, text, language);
        setGeneratedResult(result);
        setEditedTitle(result.title);
        setEditedFaqs(result.faqs);

        // Scroll to results
        setTimeout(() => {
          resultSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);

        toast.success(`${result.faqs.length} FAQs generate ho gaye!`);
      } catch (err: any) {
        toast.error(err.message || "FAQ generation failed. Dobara koshish karein.");
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, language, isListening, workspaceId]
  );

  // ── Add / remove / change FAQ items ──────────────────────────────────
  const handleAddFaqItem = () => {
    setEditedFaqs((prev) => [...prev, { question: "", answer: "" }]);
  };

  const handleRemoveFaqItem = (index: number) => {
    setEditedFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    setEditedFaqs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // ── Save to Knowledge Base ────────────────────────────────────────────
  const handleSaveToKnowledge = async () => {
    if (!editedTitle.trim()) {
      toast.error("Document ka title hona zaroori hai.");
      return;
    }
    const validFaqs = editedFaqs.filter((f) => f.question.trim() && f.answer.trim());
    if (validFaqs.length === 0) {
      toast.error("Kam az kam ek mukammal Q&A hona chahiye.");
      return;
    }

    // Build markdown content
    let markdown = `# ${editedTitle.trim()}\n\n`;
    if (generatedResult?.summary) {
      markdown += `*${generatedResult.summary}*\n\n---\n\n`;
    }
    validFaqs.forEach((faq) => {
      markdown += `### Q: ${faq.question.trim()}\n${faq.answer.trim()}\n\n`;
    });

    setIsSaving(true);
    try {
      const doc = await createRawTextDocument(workspaceId, editedTitle.trim(), markdown, kbId);

      // Save to session history
      const session: SessionHistory = {
        id: doc.id,
        title: doc.name,
        faqs: validFaqs,
        prompt,
        savedAt: new Date().toISOString(),
        language,
      };
      const newHistory = [session, ...history].slice(0, 5);
      setHistory(newHistory);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        localStorage.removeItem(STORAGE_KEY); // clear draft
      } catch { /* ignore */ }

      setSavedDoc({ name: doc.name, chunks: doc.chunk_count });
      onDocumentCreated();
    } catch (err: any) {
      toast.error(err.message || "Document save karne mein error aaya.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset after save ──────────────────────────────────────────────────
  const handleAddAnother = () => {
    setSavedDoc(null);
    setGeneratedResult(null);
    setPrompt("");
    setEditedFaqs([]);
    setEditedTitle("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewKB = () => {
    setSavedDoc(null);
    setGeneratedResult(null);
    setPrompt("");
    setEditedFaqs([]);
    setEditedTitle("");
    document
      .getElementById("documents-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Restore from history ──────────────────────────────────────────────
  const handleRestoreSession = (session: SessionHistory) => {
    setEditedTitle(session.title.replace(/\.txt$/, ""));
    setEditedFaqs(session.faqs);
    setPrompt(session.prompt);
    setLanguage(session.language);
    setGeneratedResult({
      title: session.title,
      summary: "",
      faqs: session.faqs,
      raw_markdown: "",
      provider: "history:restored",
    });
    setShowHistory(false);
    toast.success("Session restore ho gayi!");
  };

  // ── POST-SAVE SUCCESS STATE ────────────────────────────────────────────
  if (savedDoc) {
    return (
      <Card className="border-green-500/30 bg-gradient-to-br from-green-950/40 via-card/80 to-card/60 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center gap-5 py-12 text-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 border-2 border-green-500/30">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[10px] font-bold">
              ✓
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-400">Knowledge Base Mein Add Ho Gaya!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">"{savedDoc.name}"</span> — {savedDoc.chunks} chunks ready for AI agent.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleAddAnother}
              className="gap-2 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50"
            >
              <Plus className="h-4 w-4" />
              Naya FAQ Add Karein
            </Button>
            <Button
              onClick={handleViewKB}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowDown className="h-4 w-4" />
              Knowledge Base Dekhein
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <Card className="border-border/60 bg-gradient-to-br from-card/95 via-card/80 to-card/50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                <Bot className="h-5 w-5 text-primary" />
                {isListening && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base leading-tight">
                  AI Knowledge & Voice FAQ Assistant
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary bg-primary/5 text-[10px] font-normal h-5"
                  >
                    ✨ Voice Enabled
                  </Badge>
                  {kbName && (
                    <Badge
                      variant="outline"
                      className="border-indigo-500/40 text-indigo-400 bg-indigo-500/10 text-[10px] font-medium h-5"
                    >
                      📁 {kbName}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Bol kar ya likh kar company info dein → AI smart FAQs banayega → 1-click Knowledge Base mein add
                </CardDescription>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              {/* History button */}
              {history.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory((v) => !v)}
                  className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Clock className="h-3.5 w-3.5" />
                  History ({history.length})
                </Button>
              )}

              {/* Language toggle */}
              <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setLanguage("ur")}
                  className={`rounded px-2.5 py-1 font-medium transition-all ${
                    language === "ur"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  اردو
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded px-2.5 py-1 font-medium transition-all ${
                    language === "en"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ── History Panel ── */}
          {showHistory && history.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Recent Sessions (click to restore):
              </p>
              {history.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => handleRestoreSession(session)}
                  className="w-full flex items-center justify-between rounded-md border border-border/50 bg-background/60 px-3 py-2 text-left hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {session.title.replace(/\.txt$/, "")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {session.faqs.length} FAQs ·{" "}
                      {new Date(session.savedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}

          {/* ── Quick prompts ── */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Quick Examples (ek click se generate karein):
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleGenerate(qp.prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-background/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {qp.title}
                </button>
              ))}
            </div>
          </div>

          {/* ── Input textarea ── */}
          <div
            className={`rounded-xl border bg-background/80 shadow-inner transition-all focus-within:ring-2 focus-within:ring-primary/40 ${
              isAtLimit
                ? "border-red-500/60"
                : isNearLimit
                ? "border-yellow-500/60"
                : "border-border/80"
            }`}
          >
            <Textarea
              value={prompt}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setPrompt(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={
                language === "ur"
                  ? "Yahan likhein ya mic dabayein aur bolein: 'Humari return policy 14 din ki hai...'"
                  : "Type or speak: 'Our support team is available 24/7 on WhatsApp...'"
              }
              className="min-h-[90px] resize-none border-0 bg-transparent p-3 text-sm focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground/50"
            />

            {/* Interim speech preview */}
            {interimText && (
              <div className="mx-3 mb-2 flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-1.5 text-xs text-primary/70 italic">
                <MicWaveform />
                <span className="truncate">{interimText}…</span>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 gap-2">
              <div className="flex items-center gap-3">
                {/* Mic button */}
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleListening}
                  className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicWaveform />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-primary" />
                      <span className="hidden sm:inline">Bol Kar Batayein</span>
                      <span className="sm:hidden">Mic</span>
                    </>
                  )}
                </Button>

                {/* Char counter */}
                <span
                  className={`text-[11px] font-mono tabular-nums transition-colors ${
                    isAtLimit
                      ? "text-red-500"
                      : isNearLimit
                      ? "text-yellow-500"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {wordCount}w · {charCount}/{MAX_CHARS}
                </span>
              </div>

              {/* Generate button — pulses when ready */}
              <Button
                type="button"
                size="sm"
                disabled={isGenerating || !prompt.trim() || isAtLimit}
                onClick={() => handleGenerate()}
                className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                  isReadyToGenerate && !isGenerating
                    ? "animate-pulse shadow-md shadow-primary/20"
                    : ""
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate FAQs</span>
                  </>
                )}
              </Button>
            </div>

            {/* Char limit progress bar */}
            {charCount > 100 && (
              <div className="px-3 pb-2">
                <div className="h-0.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isAtLimit
                        ? "bg-red-500"
                        : isNearLimit
                        ? "bg-yellow-500"
                        : "bg-primary/40"
                    }`}
                    style={{ width: `${charPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-yellow-600 flex items-center gap-1.5">
              ⚠️ Bahut lamba input — simplify karo better FAQs ke liye ({MAX_CHARS - charCount} chars bache hain).
            </p>
          )}

          {/* ── Skeleton / Generation Loading State ── */}
          {isGenerating && (
            <div ref={resultSectionRef} className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 pb-1">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-primary">AI FAQs generate kar raha hai…</span>
              </div>
              <FaqSkeleton />
            </div>
          )}

          {/* ── Generated FAQ Preview ── */}
          {generatedResult && !isGenerating && (
            <div
              ref={resultSectionRef}
              className="rounded-xl border border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-4 space-y-4"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">FAQ Preview</span>
                  <Badge variant="secondary" className="text-xs bg-primary/15 text-primary h-5">
                    {editedFaqs.filter(f => f.question && f.answer).length} Q&A
                  </Badge>
                  {generatedResult.provider && (
                    <Badge variant="outline" className="text-[10px] h-5 font-normal text-muted-foreground">
                      via {generatedResult.provider.split(":")[0]}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || isSaving}
                    className="h-7 text-xs gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveToKnowledge}
                    disabled={isSaving}
                    className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Add to Knowledge Base
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Edit2 className="h-3 w-3" /> Document Title
                </label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="e.g. Return & Refund Policy FAQ"
                  className="h-9 text-sm font-semibold bg-background/80 border-border/60"
                />
              </div>

              {/* FAQ Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Q&A Items — click to expand/collapse, edit freely:
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddFaqItem}
                    className="h-7 text-xs text-primary hover:text-primary gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Q&A
                  </Button>
                </div>

                {editedFaqs.map((faq, index) => (
                  <FaqCard
                    key={index}
                    faq={faq}
                    index={index}
                    onChange={(field, val) => handleFaqChange(index, field, val)}
                    onRemove={() => handleRemoveFaqItem(index)}
                  />
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="pt-1 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveToKnowledge}
                  disabled={isSaving}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving & Embedding…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Add to Knowledge Base Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
