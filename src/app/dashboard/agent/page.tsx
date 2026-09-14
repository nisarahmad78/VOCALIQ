"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Bot,
  Check,
  Globe,
  Layers,
  Loader2,
  Mic,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createAgent,
  deleteAgentApi,
  getKnowledgeBases,
  listAgents,
  setDefaultAgentApi,
  updateAgent,
  type Agent,
  type KnowledgeBase,
} from "@/lib/ai-client";

const voices = [
  { value: "alloy", label: "Alloy — Neutral, balanced" },
  { value: "echo", label: "Echo — Calm, male" },
  { value: "nova", label: "Nova — Warm, female" },
  { value: "shimmer", label: "Shimmer — Soft, friendly" },
];

const voiceSamples: Record<string, string> = {
  alloy: "Hello! I am your AI support agent. How can I help you today?",
  echo: "Hi there! Echo speaking. What can I do for you?",
  nova: "Welcome! I am Nova, your friendly support assistant.",
  shimmer: "Hey! Shimmer here — happy to help with anything you need!",
};

export interface RolePreset {
  id: string;
  label: string;
  badge: string;
  name: string;
  welcome_en: string;
  welcome_ur: string;
  recommendedKb: string;
  instructions: string;
}

export const rolePresets: RolePreset[] = [
  {
    id: "portfolio_hiring",
    label: "Candidate Portfolio & Hiring Representative (Recommended for Resume)",
    badge: "Portfolio & Recruitment",
    name: "Nisar Ahmad — Portfolio Representative",
    welcome_en: "Hello! Thanks for reaching out. I represent Nisar Ahmad's AI engineering portfolio. How can I assist you today?",
    welcome_ur: "السلام علیکم! میں نثار احمد کے AI انجینئرنگ پورٹ فولیو کا باضابطہ نمائندہ ہوں۔ فرمائیے، میں آپ کی کیا مدد کر سکتا ہوں؟",
    recommendedKb: "Resume / CV, Projects, Technical Experience & Skills",
    instructions:
      "IDENTITY & ROLE:\n" +
      "You are the professional voice representative for Nisar Ahmad, an AI Engineer specializing in LLMs, Voice Agents, PyTorch, and RAG architectures.\n" +
      "You speak on his behalf with casual confidence and technical accuracy based on his resume and portfolio documents.\n\n" +
      "CRITICAL BOUNDARIES:\n" +
      "- NEVER claim 'I am a RAG system', 'I am a bot', or 'I am software'. You are an authorized human-like representative.\n" +
      "- If asked about RAG or AI models, explain that Nisar builds and optimizes these systems — never claim to be the pipeline yourself.\n" +
      "- If asked 'How can I hire you?', express enthusiasm and suggest connecting on LinkedIn or email (nisar@gmail.com) to discuss the project/role.\n" +
      "- Keep spoken replies to 1-2 punchy sentences.",
  },
  {
    id: "customer_support",
    label: "Enterprise Customer Support Specialist",
    badge: "Customer Care",
    name: "Customer Support Specialist",
    welcome_en: "Hello! Welcome to customer support. How can I assist you today?",
    welcome_ur: "السلام علیکم! کسٹمر سپورٹ میں خوش آمدید۔ بتائیے آج میں آپ کی کیا مدد کر سکتا ہوں؟",
    recommendedKb: "Company FAQs, Return/Refund Policies, Product Guides",
    instructions:
      "IDENTITY & ROLE:\n" +
      "You are a warm, capable, and dedicated customer support specialist for the company.\n" +
      "Your goal is to resolve customer inquiries quickly and courteously using only the company knowledge base.\n\n" +
      "CRITICAL BOUNDARIES:\n" +
      "- Never label yourself as an AI, bot, or automated system.\n" +
      "- Answer questions with natural human empathy. If an answer is not in the knowledge base, politely offer to connect them to a senior team member.\n" +
      "- Keep spoken replies to 1-2 clear, conversational sentences.",
  },
  {
    id: "it_helpdesk",
    label: "Technical Support & IT Helpdesk Engineer",
    badge: "IT & Technical",
    name: "IT Technical Helpdesk",
    welcome_en: "Hello! Technical support desk speaking. What issue are you experiencing today?",
    welcome_ur: "السلام علیکم! آئی ٹی سپورٹ ڈیسک حاضر ہے۔ بتائیے سسٹم میں کیا مسئلہ آ رہا ہے؟",
    recommendedKb: "IT Troubleshooting Guides, Hardware Manuals, Software Configs",
    instructions:
      "IDENTITY & ROLE:\n" +
      "You are a Level-1 Technical Support Engineer helping users troubleshoot hardware, network, and software issues.\n\n" +
      "CRITICAL BOUNDARIES:\n" +
      "- Walk users patiently through step-by-step resolution.\n" +
      "- Stick strictly to verified IT documentation.\n" +
      "- Keep spoken replies under 2 sentences.",
  },
  {
    id: "inbound_sales",
    label: "Inbound Sales & Product Consultant",
    badge: "Sales & Growth",
    name: "Senior Solutions Consultant",
    welcome_en: "Hello! Thanks for your interest in our solutions. What business goals are you looking to achieve?",
    welcome_ur: "السلام علیکم! ہماری سروسز میں دلچسپی لینے کا شکریہ۔ فرمائیے آپ کس نوعیت کے پراجیکٹ یا بزنس پر کام کرنا چاہتے ہیں؟",
    recommendedKb: "Product Pricing, Case Studies, Feature Matrices",
    instructions:
      "IDENTITY & ROLE:\n" +
      "You are an energetic and consultative sales representative.\n\n" +
      "CRITICAL BOUNDARIES:\n" +
      "- Focus on understanding caller needs and explaining business value.\n" +
      "- Recommend enterprise plans and offer to schedule a comprehensive discovery demo.\n" +
      "- Keep answers concise, persuasive, and conversational.",
  },
  {
    id: "clinic_receptionist",
    label: "Medical Clinic Appointment Receptionist",
    badge: "Front Desk & Healthcare",
    name: "Clinic Front Desk Coordinator",
    welcome_en: "Hello! Welcome to our clinic. Would you like to schedule an appointment or check our consulting hours?",
    welcome_ur: "السلام علیکم! کلینک میں خوش آمدید۔ کیا آپ اپائنٹمنٹ بک کروانا چاہتے ہیں یا کلینک کے اوقات معلوم کرنا چاہتے ہیں؟",
    recommendedKb: "Doctor Schedules, Clinic Services, Location & Fees",
    instructions:
      "IDENTITY & ROLE:\n" +
      "You are the courteous front-desk receptionist for a medical clinic.\n\n" +
      "CRITICAL BOUNDARIES:\n" +
      "- You help patients check doctor timings, book or reschedule appointments, and find clinic directions.\n" +
      "- NEVER give medical prescriptions or medical advice; strictly direct medical diagnoses to an in-person consultation with the doctor.\n" +
      "- Keep voice replies gentle, polite, and under 2 sentences.",
  },
];

export default function AgentPage() {
  const { activeWorkspace } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State (used for both Create and Edit)
  const [formData, setFormData] = useState({
    name: rolePresets[0].name,
    welcome_message: rolePresets[0].welcome_en,
    language: "en" as "en" | "ur",
    voice: "alloy",
    system_instructions: rolePresets[0].instructions,
    is_active: true,
    is_default: false,
    kb_ids: [] as string[],
  });

  const [selectedRoleId, setSelectedRoleId] = useState<string>("portfolio_hiring");
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load KBs
  const loadKbs = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    try {
      const data = await getKnowledgeBases(activeWorkspace.id);
      setKnowledgeBases(data);
    } catch {
      // fallback
    }
  }, [activeWorkspace?.id]);

  // Load Agents
  const loadAgents = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    try {
      const list = await listAgents(activeWorkspace.id);
      setAgents(list);
    } catch {
      toast.error("Agents load nahi ho sake.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    void loadKbs();
    void loadAgents();
  }, [loadKbs, loadAgents]);

  // Open Create Mode
  const openCreateMode = () => {
    const defaultPreset = rolePresets[0];
    setSelectedRoleId(defaultPreset.id);
    setFormData({
      name: "",
      welcome_message: defaultPreset.welcome_en,
      language: "en",
      voice: "alloy",
      system_instructions: defaultPreset.instructions,
      is_active: true,
      is_default: agents.length === 0,
      kb_ids: [],
    });
    setViewMode("create");
  };

  // Open Edit Mode for specific agent
  const openEditMode = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setFormData({
      name: agent.name,
      welcome_message: agent.welcome_message,
      language: agent.language,
      voice: agent.voice,
      system_instructions: agent.system_instructions,
      is_active: agent.is_active,
      is_default: agent.is_default,
      kb_ids: agent.kb_ids || [],
    });
    const matched = rolePresets.find(
      (r) => r.name === agent.name || r.instructions.trim() === (agent.system_instructions || "").trim()
    );
    if (matched) {
      setSelectedRoleId(matched.id);
    }
    setViewMode("edit");
  };

  const applyRolePreset = (roleId: string) => {
    const preset = rolePresets.find((r) => r.id === roleId);
    if (!preset) return;
    setSelectedRoleId(roleId);
    setFormData((prev) => ({
      ...prev,
      name: prev.name ? prev.name : preset.name,
      welcome_message: prev.language === "ur" ? preset.welcome_ur : preset.welcome_en,
      system_instructions: preset.instructions,
    }));
    toast.success(`Role preset applied: ${preset.name}`, {
      description: `Recommended Knowledge Base: ${preset.recommendedKb}`,
    });
  };

  function toggleKb(kbId: string) {
    setFormData((prev) => {
      const current = prev.kb_ids || [];
      const exists = current.includes(kbId);
      const updated = exists
        ? current.filter((id) => id !== kbId)
        : [...current, kbId];
      return { ...prev, kb_ids: updated };
    });
  }

  // Handle Save (Create or Update)
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWorkspace?.id) return;
    setSaving(true);

    try {
      if (viewMode === "create") {
        const created = await createAgent({
          workspace_id: activeWorkspace.id,
          name: formData.name.trim() || rolePresets.find((r) => r.id === selectedRoleId)?.name || "New AI Agent",
          welcome_message: formData.welcome_message,
          language: formData.language,
          voice: formData.voice,
          system_instructions: formData.system_instructions,
          is_active: formData.is_active,
          is_default: formData.is_default || agents.length === 0,
          kb_ids: formData.kb_ids,
        });

        toast.success("Agent created successfully!", {
          description: `"${created.name}" is now ready to take calls.`,
        });
        await loadAgents();
        setViewMode("list");
      } else if (viewMode === "edit" && selectedAgentId) {
        const updated = await updateAgent(selectedAgentId, {
          name: formData.name,
          welcome_message: formData.welcome_message,
          language: formData.language,
          voice: formData.voice,
          system_instructions: formData.system_instructions,
          is_active: formData.is_active,
          is_default: formData.is_default,
          kb_ids: formData.kb_ids,
        });

        toast.success("Agent updated!", {
          description: `"${updated.name}" settings saved to database.`,
        });
        await loadAgents();
        setViewMode("list");
      }
    } catch {
      toast.error("Operation failed", {
        description: "Agent save nahi ho saka. Dobara try karein.",
      });
    } finally {
      setSaving(false);
    }
  }

  // Handle Set Default
  const handleSetDefault = async (agent: Agent) => {
    try {
      await setDefaultAgentApi(agent.id);
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === agent.id,
        }))
      );
      toast.success(`"${agent.name}" is now the primary workspace agent.`);
    } catch {
      toast.error("Could not set as default.");
    }
  };

  // Handle Delete Agent
  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    setDeleting(true);
    try {
      await deleteAgentApi(agentToDelete.id);
      toast.success(`Agent "${agentToDelete.name}" deleted.`);
      setAgentToDelete(null);
      await loadAgents();
      if (viewMode === "edit" && selectedAgentId === agentToDelete.id) {
        setViewMode("list");
      }
    } catch {
      toast.error("Failed to delete agent.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ────────────────── VIEW 1: AGENTS LIST ────────────────── */}
      {viewMode === "list" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Voice Agents</h1>
              <p className="text-sm text-muted-foreground">
                Apne تمام AI Agents yahan manage karein. Har agent ka alag role, voice, zuban aur assigned Knowledge Bases hotay hain.
              </p>
            </div>
            <Button onClick={openCreateMode} className="gap-2 shadow-sm">
              <Plus className="size-4" />
              Create New Agent
            </Button>
          </div>

          {agents.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-card/40 p-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Bot className="size-6" />
              </div>
              <h3 className="text-lg font-semibold">Koi Agent Create Nahi Howa</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
                Apna pehla AI Voice Agent create karein aur usay specific Knowledge Bases assign karein taake wo live calls le sakay.
              </p>
              <Button onClick={openCreateMode} className="gap-2">
                <Plus className="size-4" />
                Create First Agent
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => {
                return (
                  <Card
                    key={agent.id}
                    className="relative border border-border/70 bg-card/60 transition-all duration-200 hover:border-primary/50 hover:bg-card hover:shadow-md flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Bot className="size-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                              {agent.name}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge
                                variant={agent.is_active ? "default" : "secondary"}
                                className={`text-[10px] px-1.5 py-0 h-4 ${
                                  agent.is_active
                                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {agent.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase">
                                {agent.language}
                              </Badge>
                              {agent.is_default && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-500 border-amber-500/20 flex items-center gap-0.5">
                                  <Star className="size-2.5 fill-amber-500" /> Default
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 -mr-2 -mt-1 text-muted-foreground">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditMode(agent)}>
                              <Pencil className="size-3.5 mr-2" /> Edit Agent
                            </DropdownMenuItem>
                            {!agent.is_default && (
                              <DropdownMenuItem onClick={() => void handleSetDefault(agent)}>
                                <Star className="size-3.5 mr-2 text-amber-500" /> Make Default Agent
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href="/dashboard/test-calls">
                                <Mic className="size-3.5 mr-2 text-primary" /> Test Call with Agent
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={agents.length <= 1}
                              className="text-destructive focus:text-destructive"
                              onClick={() => setAgentToDelete(agent)}
                            >
                              <Trash2 className="size-3.5 mr-2" /> Delete Agent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-3">
                      <p className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/30 p-2 rounded border border-border/40">
                        &ldquo;{agent.welcome_message}&rdquo;
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Layers className="size-3.5 text-primary" />
                          {(agent.kb_ids || []).length} KBs Assigned
                        </span>
                        <span className="capitalize">{agent.voice} Voice</span>
                      </div>
                    </CardContent>

                    <CardFooter className="border-t border-border/40 pt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditMode(agent)}
                        className="flex-1 text-xs gap-1.5"
                      >
                        <Pencil className="size-3" /> Edit Settings
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="text-xs gap-1"
                      >
                        <Link href="/dashboard/test-calls">
                          <Mic className="size-3 text-primary" /> Call
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── VIEW 2: CREATE / EDIT AGENT FORM ────────────────── */}
      {(viewMode === "create" || viewMode === "edit") && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-1 text-xs -ml-2"
              >
                <ArrowLeft className="size-4" />
                Back to All Agents
              </Button>
              <div className="h-4 w-px bg-border/80" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {viewMode === "create" ? "Create New AI Voice Agent" : `Edit Agent: ${formData.name}`}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {viewMode === "create"
                    ? "Naya agent add karein aur uske liye specific role aur Knowledge Bases muqarrar karein."
                    : "Is agent ki personality, voice, role boundaries aur assigned knowledge bases update karein."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode("list")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {viewMode === "create" ? "Create Agent" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </div>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="size-5 text-primary" />
                  Agent Identity & Role Setup
                </CardTitle>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5">
                  <Switch
                    id="agent-status-toggle"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="agent-status-toggle" className="text-xs font-normal cursor-pointer">
                    {formData.is_active ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
              <CardDescription>
                Role preset select karein taake agent ka identity context khud ba khud populate ho jaye.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Role Template Selector */}
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-primary flex items-center gap-1.5">
                      <Bot className="size-4" />
                      Role & Identity Preset
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Pre-defined enterprise role select karein taake agent ka role pukhta ho aur wo bluff na maare.
                    </p>
                  </div>
                  {selectedRoleId && (
                    <Badge variant="secondary" className="text-xs font-medium border-primary/20 bg-background/80">
                      {rolePresets.find((r) => r.id === selectedRoleId)?.badge || "Custom"}
                    </Badge>
                  )}
                </div>

                <Select
                  value={selectedRoleId}
                  onValueChange={(val) => applyRolePreset(val)}
                >
                  <SelectTrigger id="agent-role-preset" className="bg-background w-full">
                    <SelectValue placeholder="Select an enterprise role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolePresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedRoleId && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/70 p-2.5 rounded-md border border-border/60">
                    <BookOpen className="size-3.5 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground">Recommended Knowledge Base:</strong>{" "}
                      {rolePresets.find((r) => r.id === selectedRoleId)?.recommendedKb}
                    </span>
                  </div>
                )}
              </div>

              {/* Agent Name & Language */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Agent Name</Label>
                  <Input
                    id="agent-name"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="e.g. Sales Consultant, Portfolio Rep, Support Lead"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-language">Primary Spoken Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => {
                      const newLang = value as "en" | "ur";
                      const currentPreset = rolePresets.find((r) => r.id === selectedRoleId);
                      setFormData((prev) => ({
                        ...prev,
                        language: newLang,
                        welcome_message: currentPreset
                          ? (newLang === "ur" ? currentPreset.welcome_ur : currentPreset.welcome_en)
                          : prev.welcome_message,
                      }));
                    }}
                  >
                    <SelectTrigger id="agent-language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ur">Urdu (اردو / پاکستانی لہجہ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Welcome Message & Voice */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agent-welcome">Welcome Message (Greeting)</Label>
                  <Input
                    id="agent-welcome"
                    value={formData.welcome_message}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        welcome_message: event.target.value,
                      }))
                    }
                    placeholder="Call shuru hotay hi agent jo pehla jumla bolega..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-voice">Voice Pitch & Tone</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.voice}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, voice: value }))
                      }
                    >
                      <SelectTrigger id="agent-voice" className="w-full">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Play voice sample"
                      onClick={() => {
                        if (typeof window === "undefined") return;
                        const utterance = new SpeechSynthesisUtterance(
                          voiceSamples[formData.voice] ?? voiceSamples.alloy
                        );
                        utterance.lang =
                          formData.language === "ur" ? "ur-PK" : "en-US";
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                      }}
                    >
                      <Volume2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Assigned Knowledge Bases for THIS specific agent */}
              <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Assigned Knowledge Bases for this Agent
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select karein ke yeh agent kin Knowledge Bases ka data use karega. Agar koi select na karein toh tamam workspace documents use honge.
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary gap-1"
                  >
                    <Link href="/dashboard/knowledge-bases">
                      <Plus className="h-3 w-3" />
                      New KB
                    </Link>
                  </Button>
                </div>

                {knowledgeBases.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/80 p-3 text-center text-xs text-muted-foreground">
                    No named Knowledge Bases created yet.{" "}
                    <Link
                      href="/dashboard/knowledge-bases"
                      className="text-primary font-medium underline underline-offset-2"
                    >
                      Create Knowledge Bases
                    </Link>{" "}
                    to categorize documents.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {knowledgeBases.map((kb) => {
                      const isSelected = (formData.kb_ids || []).includes(kb.id);
                      return (
                        <button
                          key={kb.id}
                          type="button"
                          onClick={() => toggleKb(kb.id)}
                          className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border/60 hover:border-border hover:bg-muted/40"
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: kb.color || "#6366f1" }}
                              />
                              <span className="text-xs font-semibold leading-tight line-clamp-1">
                                {kb.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {kb.document_count || 0} docs · {kb.chunk_count || 0} chunks
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* System Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent-instructions">System Instructions & Role Boundaries</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Role template se automatically populate hota hai
                  </span>
                </div>
                <Textarea
                  id="agent-instructions"
                  rows={6}
                  value={formData.system_instructions}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      system_instructions: event.target.value,
                    }))
                  }
                  placeholder="You are the authorized professional voice representative..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Agent ko batayein ke wo kaun hai aur us ka boundary kya hai. Yeh instructions agent ko bluff marne se rokti hain.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode("list")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {viewMode === "create" ? "Create Agent" : "Save Changes"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Delete Agent Modal */}
      <Dialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Delete AI Agent?
            </DialogTitle>
            <DialogDescription>
              Aap waqai <strong>{agentToDelete?.name}</strong> ko delete karna chahte hain? Yeh action revert nahi ho sakta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setAgentToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAgent}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhooks link in Settings */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <span>Need live API function calling or external webhooks?</span>
        <Link
          href="/dashboard/settings"
          className="text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          Configure Webhook Tools in Settings &rarr;
        </Link>
      </div>
    </div>
  );
}
