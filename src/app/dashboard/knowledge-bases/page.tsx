"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Database,
  ExternalLink,
  Eye,
  FileText,
  FolderInput,
  FolderPlus,
  Globe,
  Layers,
  Loader2,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  assignDocumentKbs,
  createKnowledgeBase,
  deleteDocument,
  deleteKnowledgeBase,
  getDocumentContent,
  getKnowledgeBases,
  listDocuments,
  updateKnowledgeBase,
  type AiDocument,
  type KnowledgeBase,
} from "@/lib/ai-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const KB_PALETTE = [
  { name: "Indigo", value: "#6366f1", class: "bg-indigo-500 text-white" },
  { name: "Emerald", value: "#10b981", class: "bg-emerald-500 text-white" },
  { name: "Amber", value: "#f59e0b", class: "bg-amber-500 text-white" },
  { name: "Rose", value: "#f43f5e", class: "bg-rose-500 text-white" },
  { name: "Violet", value: "#8b5cf6", class: "bg-violet-500 text-white" },
  { name: "Cyan", value: "#06b6d4", class: "bg-cyan-500 text-white" },
  { name: "Sky", value: "#0284c7", class: "bg-sky-500 text-white" },
  { name: "Orange", value: "#f97316", class: "bg-orange-500 text-white" },
];

function formatSize(sizeBytes: number) {
  const kb = sizeBytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  if (kb >= 1) return `${Math.round(kb)} KB`;
  return `${sizeBytes} B`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function KnowledgeBasesPage() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  const [activeTab, setActiveTab] = useState<"kbs" | "inventory">("kbs");
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [allDocuments, setAllDocuments] = useState<AiDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for KBs
  const [kbSearch, setKbSearch] = useState("");

  // Search & Filter state for Master Document Inventory
  const [docSearch, setDocSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [kbFilter, setKbFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Create KB Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createColor, setCreateColor] = useState(KB_PALETTE[0].value);
  const [creating, setCreating] = useState(false);

  // Edit KB Modal
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState(KB_PALETTE[0].value);
  const [updating, setUpdating] = useState(false);

  // Delete KB Modal
  const [deletingKb, setDeletingKb] = useState<KnowledgeBase | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Interactive Scope & Visibility Modal
  const [scopingDoc, setScopingDoc] = useState<AiDocument | null>(null);
  const [isGlobalScope, setIsGlobalScope] = useState<boolean>(false);
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);
  const [savingScope, setSavingScope] = useState(false);

  // Permanent Delete Document Modal
  const [deletingDoc, setDeletingDoc] = useState<AiDocument | null>(null);
  const [deletingDocLoading, setDeletingDocLoading] = useState(false);

  // Document Chunk Preview Modal
  const [previewDoc, setPreviewDoc] = useState<AiDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [kbs, docs] = await Promise.all([
        getKnowledgeBases(workspaceId),
        listDocuments(workspaceId).catch(() => []),
      ]);
      setKnowledgeBases(kbs);
      setAllDocuments(docs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load Knowledge Bases & Documents");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Derived Document Pools
  const globalDocs = useMemo(() => allDocuments.filter((d) => d.is_global), [allDocuments]);
  const vaultDocs = useMemo(
    () =>
      allDocuments.filter(
        (d) =>
          !d.is_global &&
          (!d.kb_id || d.kb_id === "") &&
          (!d.kb_ids || d.kb_ids.length === 0)
      ),
    [allDocuments]
  );
  const sharedDocs = useMemo(
    () => allDocuments.filter((d) => !d.is_global && d.kb_ids && d.kb_ids.length >= 2),
    [allDocuments]
  );
  const privateDocs = useMemo(
    () =>
      allDocuments.filter(
        (d) =>
          !d.is_global &&
          ((d.kb_ids && d.kb_ids.length === 1) ||
            (d.kb_id && (!d.kb_ids || d.kb_ids.length === 0)))
      ),
    [allDocuments]
  );

  // Filtered Knowledge Bases
  const filteredKbs = useMemo(() => {
    if (!kbSearch.trim()) return knowledgeBases;
    const q = kbSearch.toLowerCase();
    return knowledgeBases.filter(
      (kb) =>
        kb.name.toLowerCase().includes(q) ||
        kb.description.toLowerCase().includes(q)
    );
  }, [knowledgeBases, kbSearch]);

  // Filtered Master Document Inventory
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      // Search filter
      if (docSearch.trim()) {
        const q = docSearch.toLowerCase();
        if (!doc.name.toLowerCase().includes(q)) return false;
      }

      // Scope filter
      if (scopeFilter === "global" && !doc.is_global) return false;
      if (
        scopeFilter === "shared" &&
        (doc.is_global || !doc.kb_ids || doc.kb_ids.length < 2)
      )
        return false;
      if (
        scopeFilter === "private" &&
        (doc.is_global ||
          (doc.kb_ids && doc.kb_ids.length > 1) ||
          ((!doc.kb_ids || doc.kb_ids.length === 0) && !doc.kb_id))
      )
        return false;
      if (
        scopeFilter === "vault" &&
        (doc.is_global ||
          (doc.kb_ids && doc.kb_ids.length > 0) ||
          Boolean(doc.kb_id))
      )
        return false;

      // KB filter
      if (kbFilter !== "all") {
        if (kbFilter === "vault") {
          if (
            doc.is_global ||
            (doc.kb_ids && doc.kb_ids.length > 0) ||
            Boolean(doc.kb_id)
          )
            return false;
        } else {
          // Check if doc is global OR assigned to this KB
          const inKb =
            doc.is_global ||
            doc.kb_id === kbFilter ||
            (doc.kb_ids && doc.kb_ids.includes(kbFilter));
          if (!inKb) return false;
        }
      }

      // Type filter
      if (typeFilter !== "all") {
        const ext = doc.type.toLowerCase();
        if (typeFilter === "pdf" && ext !== "pdf") return false;
        if (typeFilter === "docx" && ext !== "docx" && ext !== "doc") return false;
        if (typeFilter === "txt" && ext !== "txt" && ext !== "md") return false;
        if (typeFilter === "table" && !["csv", "xlsx", "xls"].includes(ext)) return false;
      }

      return true;
    });
  }, [allDocuments, docSearch, scopeFilter, kbFilter, typeFilter]);

  const totalChunks = useMemo(
    () => allDocuments.reduce((acc, d) => acc + (d.chunk_count || 0), 0),
    [allDocuments]
  );

  // Map KB ID to KnowledgeBase object for fast lookup
  const kbMap = useMemo(() => {
    const map = new Map<string, KnowledgeBase>();
    for (const kb of knowledgeBases) {
      map.set(kb.id, kb);
    }
    return map;
  }, [knowledgeBases]);

  // Scope Modal Handler
  function openScopeModal(doc: AiDocument) {
    setScopingDoc(doc);
    setIsGlobalScope(Boolean(doc.is_global));
    const existing =
      doc.kb_ids && doc.kb_ids.length > 0
        ? doc.kb_ids
        : doc.kb_id
        ? [doc.kb_id]
        : [];
    setSelectedKbIds(existing);
  }

  function toggleKbSelection(kbId: string) {
    setSelectedKbIds((prev) =>
      prev.includes(kbId) ? prev.filter((id) => id !== kbId) : [...prev, kbId]
    );
  }

  function selectAllKbs() {
    setSelectedKbIds(knowledgeBases.map((k) => k.id));
  }

  function clearAllKbs() {
    setSelectedKbIds([]);
  }

  async function handleSaveScope(e: React.FormEvent) {
    e.preventDefault();
    if (!scopingDoc || !workspaceId) return;
    setSavingScope(true);
    try {
      await assignDocumentKbs(
        workspaceId,
        scopingDoc.id,
        selectedKbIds,
        isGlobalScope
      );

      let feedbackMsg = `Scope updated for "${scopingDoc.name}": `;
      if (isGlobalScope) {
        feedbackMsg += "Document is now Workspace Global (Active in all KBs).";
      } else if (selectedKbIds.length === 0) {
        feedbackMsg += "Moved to Workspace Vault (Safely preserved in reserve).";
      } else if (selectedKbIds.length === 1) {
        const kbName = kbMap.get(selectedKbIds[0])?.name || "selected Knowledge Base";
        feedbackMsg += `Document is now Private to "${kbName}".`;
      } else {
        feedbackMsg += `Document is now Shared across ${selectedKbIds.length} Knowledge Bases.`;
      }

      toast.success(feedbackMsg);
      setScopingDoc(null);
      setSelectedKbIds([]);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update document scope");
    } finally {
      setSavingScope(false);
    }
  }

  async function handlePreviewChunks(doc: AiDocument) {
    if (!workspaceId) return;
    setPreviewDoc(doc);
    setPreviewContent("");
    setPreviewLoading(true);
    try {
      const primaryKbId = doc.kb_id || (doc.kb_ids && doc.kb_ids[0]) || "general";
      const res = await getDocumentContent(workspaceId, primaryKbId, doc.id);
      setPreviewContent(res.content || "(No content extracted)");
    } catch {
      setPreviewContent("Content preview is loading or not directly cached.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handlePermanentDeleteDoc() {
    if (!deletingDoc || !workspaceId) return;
    setDeletingDocLoading(true);
    try {
      await deleteDocument(deletingDoc.id);
      toast.success(`Document "${deletingDoc.name}" permanently deleted.`);
      setDeletingDoc(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingDocLoading(false);
    }
  }

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!workspaceId) {
      toast.error("No active workspace found. Please select or create a workspace first.");
      return;
    }
    if (!createName.trim()) {
      toast.error("Please enter a Knowledge Base name.");
      return;
    }
    setCreating(true);
    try {
      const newKb = await createKnowledgeBase({
        workspace_id: workspaceId,
        name: createName.trim(),
        description: createDesc.trim(),
        color: createColor,
      });
      toast.success(`Knowledge Base "${newKb.name}" created successfully!`);
      setCreateName("");
      setCreateDesc("");
      setCreateColor(KB_PALETTE[0].value);
      setIsCreateOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create Knowledge Base");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingKb || !workspaceId) return;
    if (!editName.trim()) {
      toast.error("Please enter a Knowledge Base name.");
      return;
    }
    setUpdating(true);
    try {
      const updated = await updateKnowledgeBase(editingKb.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        color: editColor,
      });
      toast.success(`Knowledge Base "${updated.name}" updated!`);
      setEditingKb(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update Knowledge Base");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!deletingKb || !workspaceId) return;
    setDeleting(true);
    try {
      await deleteKnowledgeBase(workspaceId, deletingKb.id);
      toast.success(`Knowledge Base "${deletingKb.name}" deleted.`);
      setDeletingKb(null);
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete Knowledge Base");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Knowledge &amp; Document Pool</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product-specific knowledge bases, company-wide global policies, and the unified workspace document inventory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 shadow-sm bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Knowledge Base
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Knowledge Bases
            </CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledgeBases.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Modular product &amp; domain silos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Master Document Inventory
            </CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allDocuments.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Unique workspace documents
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              🌐 Global Policies
            </CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{globalDocs.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Shared company-wide across all KBs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              📦 Workspace Vault
            </CardTitle>
            <Archive className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{vaultDocs.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Safely preserved in reserve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Vault Notice Banner */}
      {vaultDocs.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {vaultDocs.length} Document{vaultDocs.length > 1 ? "s" : ""} in Workspace Vault
                </h4>
                <p className="text-xs text-muted-foreground">
                  These documents are safely stored with zero data loss, ready to be attached to any Knowledge Base or made Global anytime.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 text-xs gap-1.5 shrink-0"
              onClick={() => {
                setActiveTab("inventory");
                setScopeFilter("vault");
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              View Vault in Inventory
            </Button>
          </div>
        </div>
      )}

      {/* Top-Level Tabs: Product KBs vs Master Inventory */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "kbs" | "inventory")}
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="kbs" className="gap-2 text-xs sm:text-sm">
              <Layers className="h-4 w-4" />
              Product Knowledge Bases
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {knowledgeBases.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              Master Document Inventory
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {allDocuments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>{totalChunks} Zero-Cost Chunks (ONNX FastEmbed)</span>
          </div>
        </div>

        {/* ── TAB 1: Product Knowledge Bases Grid ─────────────────────────────── */}
        <TabsContent value="kbs" className="space-y-6 mt-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge bases..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="pl-8 bg-card/60"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Showing {filteredKbs.length} of {knowledgeBases.length} Knowledge Bases
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading knowledge bases...</p>
            </div>
          ) : filteredKbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/70 bg-card/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <FolderPlus className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold">No Knowledge Bases Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1 mb-5">
                {kbSearch
                  ? "No knowledge bases match your search criteria."
                  : "Create modular knowledge bases for shipping policies, product catalogs, customer service FAQs, or sales campaigns."}
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Knowledge Base
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredKbs.map((kb) => (
                <Card
                  key={kb.id}
                  className="group relative flex flex-col justify-between border-border/60 bg-gradient-to-b from-card to-card/60 transition-all duration-200 hover:shadow-md hover:border-primary/30"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
                          style={{
                            backgroundColor: `${kb.color || "#6366f1"}20`,
                            borderColor: `${kb.color || "#6366f1"}40`,
                            borderWidth: 1,
                            color: kb.color || "#6366f1",
                          }}
                        >
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                            {kb.name}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(kb.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/knowledge-bases/${kb.id}`}
                              className="gap-2 cursor-pointer"
                            >
                              <BookOpen className="h-4 w-4" />
                              Open Knowledge Base
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingKb(kb);
                              setEditName(kb.name);
                              setEditDesc(kb.description);
                              setEditColor(kb.color);
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingKb(kb)}
                            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[32px]">
                      {kb.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-3 pt-0">
                    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span>{kb.document_count || 0}</span>
                        <span className="text-muted-foreground font-normal">
                          accessible docs
                        </span>
                      </div>
                      <span className="text-border">•</span>
                      <div className="flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{kb.chunk_count || 0} chunks</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 border-t border-border/40 mt-auto flex items-center justify-between">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-xs hover:text-primary group-hover:bg-muted/50 mt-3"
                    >
                      <Link href={`/dashboard/knowledge-bases/${kb.id}`}>
                        <span>Manage Documents &amp; AI FAQs</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: Master Document Inventory ───────────────────────────────── */}
        <TabsContent value="inventory" className="space-y-4 mt-0">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/60">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all workspace documents..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="pl-8 bg-background/80"
                />
              </div>

              {/* Scope Filter */}
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-background/80">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes ({allDocuments.length})</SelectItem>
                  <SelectItem value="global">🌐 Global Public ({globalDocs.length})</SelectItem>
                  <SelectItem value="shared">👥 Shared ({sharedDocs.length})</SelectItem>
                  <SelectItem value="private">🔒 Private ({privateDocs.length})</SelectItem>
                  <SelectItem value="vault">📦 Vault ({vaultDocs.length})</SelectItem>
                </SelectContent>
              </Select>

              {/* KB Filter */}
              <Select value={kbFilter} onValueChange={setKbFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-background/80">
                  <SelectValue placeholder="Knowledge Base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Knowledge Bases</SelectItem>
                  {knowledgeBases.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="vault">📦 Unassigned (Vault)</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-36 bg-background/80">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                  <SelectItem value="txt">TXT / Markdown</SelectItem>
                  <SelectItem value="table">Excel / CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground shrink-0 text-right">
              Showing <strong className="text-foreground">{filteredDocuments.length}</strong> of {allDocuments.length} documents
            </div>
          </div>

          {/* Master Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/70 bg-card/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold">No Documents Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                {docSearch || scopeFilter !== "all" || kbFilter !== "all" || typeFilter !== "all"
                  ? "No documents match your active filters. Try clearing your filters."
                  : "No documents have been uploaded to this workspace yet."}
              </p>
              {(docSearch || scopeFilter !== "all" || kbFilter !== "all" || typeFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setDocSearch("");
                    setScopeFilter("all");
                    setKbFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Document Name</TableHead>
                    <TableHead className="font-semibold text-xs">Scope Status</TableHead>
                    <TableHead className="font-semibold text-xs">Assigned Knowledge Bases</TableHead>
                    <TableHead className="font-semibold text-xs">Size &amp; Chunks</TableHead>
                    <TableHead className="font-semibold text-xs">Uploaded Date</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const isGlobal = Boolean(doc.is_global);
                    const assignedKbs = (doc.kb_ids || []).map((id) => kbMap.get(id)).filter(Boolean) as KnowledgeBase[];
                    if (assignedKbs.length === 0 && doc.kb_id && kbMap.has(doc.kb_id)) {
                      assignedKbs.push(kbMap.get(doc.kb_id)!);
                    }

                    return (
                      <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                        {/* Name & Format */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-xs text-foreground truncate max-w-xs sm:max-w-sm">
                                {doc.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0">
                                  {doc.type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  ID: {doc.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Scope Status */}
                        <TableCell>
                          {isGlobal ? (
                            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1 text-[10px] font-medium">
                              <Globe className="h-3 w-3" />
                              Global Public
                            </Badge>
                          ) : assignedKbs.length >= 2 ? (
                            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 gap-1 text-[10px] font-medium">
                              <Users className="h-3 w-3" />
                              Shared ({assignedKbs.length} KBs)
                            </Badge>
                          ) : assignedKbs.length === 1 ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[10px] font-medium">
                              <Lock className="h-3 w-3" />
                              Private
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1 text-[10px] font-medium">
                              <Archive className="h-3 w-3" />
                              Workspace Vault
                            </Badge>
                          )}
                        </TableCell>

                        {/* Assigned Knowledge Bases */}
                        <TableCell>
                          {isGlobal ? (
                            <span className="text-xs text-blue-400 font-medium flex items-center gap-1.5">
                              <Globe className="h-3 w-3" />
                              Accessible by all products
                            </span>
                          ) : assignedKbs.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {assignedKbs.map((kb) => (
                                <Link
                                  key={kb.id}
                                  href={`/dashboard/knowledge-bases/${kb.id}`}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-colors"
                                >
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: kb.color || "#6366f1" }}
                                  />
                                  <span>{kb.name}</span>
                                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Unassigned (In reserve)
                            </span>
                          )}
                        </TableCell>

                        {/* Size & Chunks */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <div>{formatSize(doc.size_bytes)}</div>
                          <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
                            {doc.chunk_count} chunks
                          </div>
                        </TableCell>

                        {/* Uploaded Date */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(doc.created_at)}
                        </TableCell>

                        {/* Actions Toolbar */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-border/80 hover:border-primary/40"
                              onClick={() => openScopeModal(doc)}
                            >
                              <FolderInput className="h-3.5 w-3.5 text-primary" />
                              Manage Scope
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => handlePreviewChunks(doc)}
                                  className="gap-2 cursor-pointer text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Preview Chunks
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletingDoc(doc)}
                                  className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Permanently Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Interactive Scope & Visibility Modal ─────────────────────────────── */}
      <Dialog open={!!scopingDoc} onOpenChange={(open) => !open && setScopingDoc(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <form onSubmit={handleSaveScope}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderInput className="h-5 w-5 text-primary" />
                Manage Document Scope &amp; Visibility
              </DialogTitle>
              <DialogDescription>
                Control which Knowledge Bases and AI Voice Agents can reference{" "}
                <strong className="text-foreground font-semibold">{scopingDoc?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-3">
              {/* Option A: Global Toggle Card */}
              <div
                onClick={() => setIsGlobalScope((prev) => !prev)}
                className={`flex items-start justify-between gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                  isGlobalScope
                    ? "border-blue-500/60 bg-blue-500/10 shadow-sm"
                    : "border-border/60 bg-card/60 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      isGlobalScope
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        🌐 Workspace Global / Public Policy
                      </span>
                      {isGlobalScope && (
                        <Badge className="bg-blue-500 text-white text-[9px] px-1.5 py-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Make this document public across your entire workspace. All current and future Knowledge Bases and Voice Agents will automatically include this knowledge (e.g. Return Policies, Operating Hours, SLA).
                    </p>
                  </div>
                </div>

                <Switch
                  checked={isGlobalScope}
                  onCheckedChange={setIsGlobalScope}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Option B: Specific Knowledge Bases Checklist (only if not global) */}
              {!isGlobalScope && (
                <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-3.5">
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      Select Knowledge Bases:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllKbs}
                        className="text-primary hover:underline text-xs font-medium cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-border">|</span>
                      <button
                        type="button"
                        onClick={clearAllKbs}
                        className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {knowledgeBases.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                      <p className="mb-2">No Knowledge Bases created yet.</p>
                      <p>If saved with 0 KBs, this document will remain safely preserved in your Workspace Vault.</p>
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {knowledgeBases.map((kb) => {
                        const isSelected = selectedKbIds.includes(kb.id);
                        return (
                          <div
                            key={kb.id}
                            onClick={() => toggleKbSelection(kb.id)}
                            className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/60 bg-card/60 hover:bg-muted/40"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground/30 bg-background"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: kb.color || "#6366f1" }}
                                  />
                                  <span className="text-xs font-semibold leading-tight text-foreground truncate">
                                    {kb.name}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                                  {kb.document_count || 0} docs
                                </Badge>
                              </div>
                              {kb.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {kb.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Sensory Live Feedback Alert */}
              <div className="transition-all">
                {isGlobalScope ? (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-400 flex items-start gap-2.5">
                    <Globe className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                    <div>
                      <strong className="font-semibold text-foreground">🌐 Global Scope Active:</strong> This document will be accessible across all products and AI voice agents during customer calls. Chunks are shared with zero extra vector cost.
                    </div>
                  </div>
                ) : selectedKbIds.length === 0 ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500 flex items-start gap-2.5">
                    <Archive className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <strong className="font-semibold text-foreground">📦 Workspace Vault:</strong> This document will be preserved safely in your workspace reserve. All chunks and embeddings remain 100% intact, but no live voice agent will query it until attached to a Knowledge Base.
                    </div>
                  </div>
                ) : selectedKbIds.length === 1 ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-start gap-2.5">
                    <Lock className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                    <div>
                      <strong className="font-semibold text-foreground">🔒 Private Single-KB Scope:</strong> This document will be strictly quarantined to{" "}
                      <strong className="text-foreground">
                        &quot;{kbMap.get(selectedKbIds[0])?.name || "selected KB"}&quot;
                      </strong>. No other product&apos;s agent can access its data during live calls.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-400 flex items-start gap-2.5">
                    <Users className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
                    <div>
                      <strong className="font-semibold text-foreground">👥 Shared Multi-KB Scope:</strong> This document will be accessible to{" "}
                      <strong className="text-foreground">{selectedKbIds.length} Knowledge Bases</strong>. Both products will query the same document chunks with zero duplicate storage.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setScopingDoc(null)}
                disabled={savingScope}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingScope}>
                {savingScope ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Scope...
                  </>
                ) : (
                  "Save Scope Settings"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Document Chunk Preview Modal ─────────────────────────────────────── */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Document Preview &amp; Extracted Chunks
            </DialogTitle>
            <DialogDescription>
              {previewDoc?.name} ({previewDoc?.chunk_count} chunks · {previewDoc?.type.toUpperCase()})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3 rounded-lg border border-border/60 bg-muted/20 font-mono text-xs text-foreground whitespace-pre-wrap">
            {previewLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading preview...</span>
              </div>
            ) : (
              previewContent
            )}
          </div>

          <DialogFooter className="mt-3">
            <Button type="button" variant="outline" onClick={() => setPreviewDoc(null)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Permanent Delete Document Modal ──────────────────────────────────── */}
      <Dialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Permanently Delete Document?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">{deletingDoc?.name}</strong>?
              This will erase all {deletingDoc?.chunk_count} vector embeddings and permanently remove it from all Knowledge Bases and Voice Agents. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingDoc(null)}
              disabled={deletingDocLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handlePermanentDeleteDoc}
              disabled={deletingDocLoading}
            >
              {deletingDocLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Permanently Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Knowledge Base Modal ──────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-primary" />
                Create New Knowledge Base
              </DialogTitle>
              <DialogDescription>
                Create a dedicated domain for documents (e.g. &quot;Product A Support&quot;, &quot;Billing &amp; Refunds&quot;, &quot;Technical Specs&quot;).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="kb-name">Knowledge Base Name *</Label>
                <Input
                  id="kb-name"
                  placeholder="e.g. Product A - Voice Agent"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="kb-desc">Description (Optional)</Label>
                <Textarea
                  id="kb-desc"
                  placeholder="Briefly describe what information this knowledge base contains..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label>Theme Color</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {KB_PALETTE.map((pal) => (
                    <button
                      key={pal.value}
                      type="button"
                      onClick={() => setCreateColor(pal.value)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        createColor === pal.value
                          ? "ring-2 ring-primary ring-offset-2 scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: pal.value }}
                      title={pal.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !createName.trim()}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Knowledge Base"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Knowledge Base Modal ────────────────────────────────────────── */}
      <Dialog open={!!editingKb} onOpenChange={(open) => !open && setEditingKb(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Knowledge Base
              </DialogTitle>
              <DialogDescription>
                Update the name, description, or color of this knowledge base.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label>Theme Color</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {KB_PALETTE.map((pal) => (
                    <button
                      key={pal.value}
                      type="button"
                      onClick={() => setEditColor(pal.value)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        editColor === pal.value
                          ? "ring-2 ring-primary ring-offset-2 scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: pal.value }}
                      title={pal.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingKb(null)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating || !editName.trim()}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Knowledge Base Modal ──────────────────────────────────────── */}
      <Dialog open={!!deletingKb} onOpenChange={(open) => !open && setDeletingKb(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Knowledge Base?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground font-semibold">{deletingKb?.name}</strong>?
              Documents specifically private to this Knowledge Base will transition safely to the Workspace Vault so zero files or vector chunks are lost.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingKb(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Knowledge Base"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
