"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Database,
  Eye,
  FileText,
  FolderInput,
  Globe,
  Layers,
  Loader2,
  Lock,
  MoreHorizontal,
  Network,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  assignDocumentKbs,
  attachExistingDocumentsToKb,
  deleteDocument,
  deleteKnowledgeBase,
  detachDocumentFromKb,
  getDocumentContent,
  getKnowledgeBase,
  getKnowledgeBaseDocuments,
  getKnowledgeBases,
  listDocuments,
  moveDocumentToKb,
  updateKnowledgeBase,
  uploadDocument,
  type AiDocument,
  type DocumentContent,
  type KnowledgeBase,
} from "@/lib/ai-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { KnowledgeAiChat } from "@/components/knowledge/knowledge-ai-chat";
import { KnowledgeGraphExplorer } from "@/components/knowledge/knowledge-graph-explorer";

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

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kbId = params.id as string;

  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [allKbs, setAllKbs] = useState<KnowledgeBase[]>([]);
  const [documents, setDocuments] = useState<AiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeSubFilter, setScopeSubFilter] = useState<"all" | "private" | "shared_global">("all");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attach Existing Document Modal
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachCandidates, setAttachCandidates] = useState<AiDocument[]>([]);
  const [selectedAttachDocIds, setSelectedAttachDocIds] = useState<string[]>([]);
  const [attachSearch, setAttachSearch] = useState("");
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [attachingDocs, setAttachingDocs] = useState(false);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentContent | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  // Move Document Modal
  const [movingDoc, setMovingDoc] = useState<AiDocument | null>(null);
  const [targetKbId, setTargetKbId] = useState<string>("");
  const [moving, setMoving] = useState(false);

  // Edit KB Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");
  const [updatingKb, setUpdatingKb] = useState(false);

  // Delete KB Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingKb, setDeletingKb] = useState(false);

  const fetchKbDetails = useCallback(async () => {
    if (!workspaceId || !kbId) return;
    try {
      const [kbData, docsData, allKbsData] = await Promise.all([
        getKnowledgeBase(workspaceId, kbId),
        getKnowledgeBaseDocuments(workspaceId, kbId),
        getKnowledgeBases(workspaceId),
      ]);
      setKb(kbData);
      setDocuments(docsData);
      setAllKbs(allKbsData);
      setEditName(kbData.name);
      setEditDesc(kbData.description);
      setEditColor(kbData.color);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load Knowledge Base");
      router.push("/dashboard/knowledge-bases");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, kbId, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchKbDetails();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchKbDetails]);

  // Polling for processing documents
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing || !workspaceId || !kbId) return;

    const interval = setInterval(async () => {
      try {
        const [docsData, kbData] = await Promise.all([
          getKnowledgeBaseDocuments(workspaceId, kbId),
          getKnowledgeBase(workspaceId, kbId),
        ]);
        setDocuments(docsData);
        setKb(kbData);
      } catch {
        /* silent poll error */
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [documents, workspaceId, kbId]);

  // Document Pools Breakdown
  const privateDocsCount = useMemo(
    () =>
      documents.filter(
        (d) =>
          !d.is_global &&
          (!d.kb_ids || d.kb_ids.length <= 1)
      ).length,
    [documents]
  );
  const sharedDocsCount = useMemo(
    () => documents.filter((d) => !d.is_global && d.kb_ids && d.kb_ids.length > 1).length,
    [documents]
  );
  const globalDocsCount = useMemo(
    () => documents.filter((d) => Boolean(d.is_global)).length,
    [documents]
  );

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

      let matchesSub = true;
      if (scopeSubFilter === "private") {
        matchesSub = !doc.is_global && (!doc.kb_ids || doc.kb_ids.length <= 1);
      } else if (scopeSubFilter === "shared_global") {
        matchesSub = Boolean(doc.is_global) || Boolean(doc.kb_ids && doc.kb_ids.length > 1);
      }

      return matchesSearch && matchesStatus && matchesSub;
    });
  }, [documents, search, statusFilter, scopeSubFilter]);

  // Open Attach Existing Dialog
  async function openAttachDialog() {
    if (!workspaceId) return;
    setIsAttachOpen(true);
    setSelectedAttachDocIds([]);
    setAttachSearch("");
    setLoadingCandidates(true);
    try {
      const allWorkspaceDocs = await listDocuments(workspaceId);
      // Candidates: files not currently assigned to this KB and not global
      const candidates = allWorkspaceDocs.filter((d) => {
        if (d.is_global) return false;
        if (d.kb_id === kbId) return false;
        if (d.kb_ids && d.kb_ids.includes(kbId)) return false;
        return true;
      });
      setAttachCandidates(candidates);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load workspace documents");
    } finally {
      setLoadingCandidates(false);
    }
  }

  function toggleAttachSelection(docId: string) {
    setSelectedAttachDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  }

  async function handleAttachExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !kbId || selectedAttachDocIds.length === 0) return;
    setAttachingDocs(true);
    try {
      await attachExistingDocumentsToKb(workspaceId, kbId, selectedAttachDocIds);
      toast.success(
        `Attached ${selectedAttachDocIds.length} document${
          selectedAttachDocIds.length === 1 ? "" : "s"
        } to "${kb?.name}" with zero re-uploading!`
      );
      setIsAttachOpen(false);
      setSelectedAttachDocIds([]);
      await fetchKbDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach documents");
    } finally {
      setAttachingDocs(false);
    }
  }

  // Safe Detach from this KB
  async function handleDetachDoc(doc: AiDocument) {
    if (!workspaceId || !kbId) return;
    try {
      await detachDocumentFromKb(workspaceId, kbId, doc.id);
      toast.success(`Detached "${doc.name}" from ${kb?.name || "Knowledge Base"}.`);
      await fetchKbDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to detach document");
    }
  }

  // Move Private Document to Workspace Vault
  async function handleMoveToVault(doc: AiDocument) {
    if (!workspaceId) return;
    try {
      await assignDocumentKbs(workspaceId, doc.id, [], false);
      toast.success(`Moved "${doc.name}" to Workspace Vault (safely preserved in reserve).`);
      await fetchKbDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move document to Vault");
    }
  }

  // File Upload Handlers
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !workspaceId || !kbId) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        await uploadDocument(file, workspaceId, kbId);
        toast.success(`Uploaded "${file.name}" to ${kb?.name || "Knowledge Base"}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    fetchKbDetails();
  }

  // Preview Document Handler
  async function handleOpenPreview(doc: AiDocument) {
    if (!workspaceId || !kbId) return;
    setPreviewLoading(true);
    setPreviewDoc(null);
    try {
      const contentData = await getDocumentContent(workspaceId, kbId, doc.id);
      setPreviewDoc(contentData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load document content");
    } finally {
      setPreviewLoading(false);
    }
  }

  // Permanent Delete Document
  async function handleDeleteDoc(docId: string, name: string) {
    try {
      await deleteDocument(docId);
      toast.success(`Permanently deleted "${name}"`);
      fetchKbDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    }
  }

  // Move Document to other KB
  async function handleMoveDoc() {
    if (!movingDoc || !targetKbId || !workspaceId || !kbId) return;
    setMoving(true);
    try {
      await moveDocumentToKb(workspaceId, kbId, movingDoc.id, targetKbId);
      const targetKbName = allKbs.find((k) => k.id === targetKbId)?.name || "target";
      toast.success(`Moved "${movingDoc.name}" to ${targetKbName}`);
      setMovingDoc(null);
      setTargetKbId("");
      fetchKbDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move document");
    } finally {
      setMoving(false);
    }
  }

  // Update KB
  async function handleUpdateKb(e: React.FormEvent) {
    e.preventDefault();
    if (!kb || !editName.trim()) return;
    setUpdatingKb(true);
    try {
      const updated = await updateKnowledgeBase(kb.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        color: editColor,
      });
      setKb(updated);
      setIsEditOpen(false);
      toast.success("Knowledge Base updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update Knowledge Base");
    } finally {
      setUpdatingKb(false);
    }
  }

  // Delete KB
  async function handleDeleteKb() {
    if (!kb || !workspaceId) return;
    setDeletingKb(true);
    try {
      await deleteKnowledgeBase(workspaceId, kb.id);
      toast.success(`Deleted Knowledge Base "${kb.name}"`);
      router.push("/dashboard/knowledge-bases");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete Knowledge Base");
      setDeletingKb(false);
    }
  }

  function copyPreviewText() {
    if (!previewDoc?.content) return;
    navigator.clipboard.writeText(previewDoc.content);
    setCopiedContent(true);
    toast.success("Document content copied to clipboard!");
    setTimeout(() => setCopiedContent(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading knowledge base...</p>
      </div>
    );
  }

  if (!kb) return null;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard/knowledge-bases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{kb.name}</h1>
                <Badge
                  variant="outline"
                  className="text-[11px] font-normal"
                  style={{
                    borderColor: `${kb.color || "#6366f1"}40`,
                    color: kb.color || "#6366f1",
                  }}
                >
                  {documents.length} docs accessible · {kb.chunk_count} chunks
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kb.description || "Knowledge Base domain for indexed documents & voice FAQ automation."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-1.5 text-xs h-9"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit KB
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="gap-1.5 text-xs h-9 text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-[680px] bg-muted/60 p-1">
          <TabsTrigger value="documents" className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Documents &amp; Reader ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="graph" className="gap-2 text-xs">
            <Network className="h-3.5 w-3.5 text-primary" />
            Knowledge Graph &amp; RAG
            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 border-primary/40 text-primary hidden sm:inline-flex">
              Interactive
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ai-faq" className="gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            AI Voice FAQ Assistant
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: DOCUMENTS ────────────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-5 mt-4">
          {/* Summary Metric Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/60 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">Accessible Documents:</span>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
                <Lock className="h-3 w-3" />
                {privateDocsCount} Private to this KB
              </Badge>
              <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 gap-1 text-[11px]">
                <Users className="h-3 w-3" />
                {sharedDocsCount} Shared
              </Badge>
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1 text-[11px]">
                <Globe className="h-3 w-3" />
                {globalDocsCount} Global Policies
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={openAttachDialog}
              className="gap-1.5 text-xs h-8 border-primary/40 text-primary hover:bg-primary/10 shadow-sm"
            >
              <FolderInput className="h-3.5 w-3.5" />
              Attach from Workspace Vault
            </Button>
          </div>

          {/* Upload Dropzone */}
          <Card
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5 scale-[1.005]"
                : "border-border/60 hover:border-border hover:bg-muted/20"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-7 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2 shadow-inner">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}
              </div>
              <p className="text-sm font-semibold">
                {uploading ? "Uploading & Vectorizing..." : `Upload new files directly to "${kb.name}"`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drag and drop PDF, DOCX, TXT, or CSV files here, or browse.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-500/90 font-medium">
                <Sparkles className="h-3 w-3" />
                Instant Local Embedding · Sub-800ms Voice Latency Ready
              </div>
            </CardContent>
          </Card>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents in this KB..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 bg-card/60"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-card/60">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scopeSubFilter} onValueChange={(v) => setScopeSubFilter(v as "all" | "private" | "shared_global")}>
                <SelectTrigger className="w-[160px] bg-card/60">
                  <SelectValue placeholder="Scope Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accessible ({documents.length})</SelectItem>
                  <SelectItem value="private">🔒 Private Only ({privateDocsCount})</SelectItem>
                  <SelectItem value="shared_global">🌐 Shared &amp; Global ({sharedDocsCount + globalDocsCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchKbDetails}
                className="gap-1.5 text-xs h-9"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Documents Table */}
          <Card className="border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Document Name</TableHead>
                  <TableHead>Origin / Scope</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                      {search || statusFilter !== "all" || scopeSubFilter !== "all"
                        ? "No documents matched your active filters."
                        : `No documents in this Knowledge Base yet. Upload files above or attach existing ones from your Workspace Vault.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc) => {
                    const isGlobal = Boolean(doc.is_global);
                    const isShared = !isGlobal && Boolean(doc.kb_ids && doc.kb_ids.length > 1);

                    return (
                      <TableRow key={doc.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="line-clamp-1 text-xs" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </TableCell>

                        {/* Origin Scope Badge */}
                        <TableCell>
                          {isGlobal ? (
                            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1 text-[10px] font-medium">
                              <Globe className="h-3 w-3" />
                              Global Policy
                            </Badge>
                          ) : isShared ? (
                            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 gap-1 text-[10px] font-medium">
                              <Users className="h-3 w-3" />
                              Shared ({doc.kb_ids?.length} KBs)
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[10px] font-medium">
                              <Lock className="h-3 w-3" />
                              Private to this KB
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {doc.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatSize(doc.size_bytes)}
                        </TableCell>
                        <TableCell>
                          {doc.status === "ready" ? (
                            <Badge variant="secondary" className="bg-green-500/15 text-green-500 text-[11px]">
                              Ready
                            </Badge>
                          ) : doc.status === "processing" ? (
                            <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-500 text-[11px] gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Indexing
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-500/15 text-red-500 text-[11px]" title={doc.error ?? ""}>
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {doc.chunk_count}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Reader Preview Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPreview(doc)}
                              className="h-8 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
                              title="Preview parsed document text"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Read</span>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onClick={() => handleOpenPreview(doc)}
                                  className="gap-2 cursor-pointer text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Preview Content
                                </DropdownMenuItem>

                                {/* Safe Detach or Move to Vault */}
                                {isShared ? (
                                  <DropdownMenuItem
                                    onClick={() => handleDetachDoc(doc)}
                                    className="gap-2 cursor-pointer text-xs text-amber-500 focus:text-amber-500"
                                  >
                                    <FolderInput className="h-3.5 w-3.5" />
                                    Detach from this KB
                                  </DropdownMenuItem>
                                ) : !isGlobal ? (
                                  <DropdownMenuItem
                                    onClick={() => handleMoveToVault(doc)}
                                    className="gap-2 cursor-pointer text-xs text-amber-500 focus:text-amber-500"
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                    Move to Workspace Vault
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled className="gap-2 text-xs text-muted-foreground">
                                    <Globe className="h-3.5 w-3.5" />
                                    Global (Manage in Inventory)
                                  </DropdownMenuItem>
                                )}

                                {allKbs.length > 1 && !isGlobal && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setMovingDoc(doc);
                                      const otherKb = allKbs.find((k) => k.id !== kb.id);
                                      setTargetKbId(otherKb?.id || "");
                                    }}
                                    className="gap-2 cursor-pointer text-xs"
                                  >
                                    <Layers className="h-3.5 w-3.5" />
                                    Move to Other KB
                                  </DropdownMenuItem>
                                )}

                                {!isGlobal && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteDoc(doc.id, doc.name)}
                                      className="gap-2 text-red-500 focus:text-red-500 cursor-pointer text-xs"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Permanently Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── TAB 2: KNOWLEDGE GRAPH & RAG INTELLIGENCE ───────────────────── */}
        <TabsContent value="graph" className="mt-4">
          {workspaceId && (
            <KnowledgeGraphExplorer
              workspaceId={workspaceId}
              kbId={kb.id}
              kbName={kb.name}
            />
          )}
        </TabsContent>

        {/* ── TAB 3: AI VOICE & FAQ ASSISTANT ─────────────────────────────── */}
        <TabsContent value="ai-faq" className="mt-4">
          {workspaceId && (
            <KnowledgeAiChat
              workspaceId={workspaceId}
              kbId={kb.id}
              kbName={kb.name}
              onDocumentCreated={fetchKbDetails}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Attach Existing Documents Modal ──────────────────────────────────── */}
      <Dialog open={isAttachOpen} onOpenChange={setIsAttachOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <form onSubmit={handleAttachExisting}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderInput className="h-5 w-5 text-primary" />
                Attach Existing Documents to &quot;{kb.name}&quot;
              </DialogTitle>
              <DialogDescription>
                Select files from your Workspace Vault or other Knowledge Bases. Attached files share existing embeddings with zero re-uploading.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter available documents..."
                  value={attachSearch}
                  onChange={(e) => setAttachSearch(e.target.value)}
                  className="pl-8 text-xs bg-muted/30"
                />
              </div>

              {loadingCandidates ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Finding available documents...</span>
                </div>
              ) : attachCandidates.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  <Archive className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="font-semibold text-foreground">No Available Documents</p>
                  <p className="mt-1">
                    All non-global workspace documents are already attached to this Knowledge Base.
                  </p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {attachCandidates
                    .filter((d) =>
                      !attachSearch.trim() ||
                      d.name.toLowerCase().includes(attachSearch.toLowerCase())
                    )
                    .map((doc) => {
                      const isSelected = selectedAttachDocIds.includes(doc.id);
                      const isVault = (!doc.kb_ids || doc.kb_ids.length === 0) && !doc.kb_id;

                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleAttachSelection(doc.id)}
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
                              <span className="text-xs font-semibold leading-tight text-foreground truncate">
                                {doc.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isVault ? (
                                  <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px] px-1 py-0">
                                    Vault
                                  </Badge>
                                ) : (
                                  <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[9px] px-1 py-0">
                                    Other KB
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {doc.chunk_count} chunks
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span>{formatSize(doc.size_bytes)}</span>
                              <span>•</span>
                              <span>{formatDate(doc.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {selectedAttachDocIds.length > 0 && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-xs text-primary flex items-center justify-between">
                  <span>Selected: <strong>{selectedAttachDocIds.length}</strong> document(s)</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAttachDocIds([])}
                    className="hover:underline text-[11px] cursor-pointer"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAttachOpen(false)}
                disabled={attachingDocs}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={attachingDocs || selectedAttachDocIds.length === 0}
              >
                {attachingDocs ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Attaching...
                  </>
                ) : (
                  `Attach (${selectedAttachDocIds.length}) to KB`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Document Preview / Reader Modal ───────────────────────────────── */}
      <Dialog
        open={!!previewDoc || previewLoading}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 pr-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold leading-tight line-clamp-1">
                    {previewDoc?.name || "Loading Document..."}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {previewDoc
                      ? `${previewDoc.chunk_count} vector chunks · ${formatSize(previewDoc.size_bytes)} · KB: ${kb.name}`
                      : "Retrieving parsed chunks from PostgreSQL vector store..."}
                  </DialogDescription>
                </div>
              </div>

              {previewDoc && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPreviewText}
                  className="gap-1.5 text-xs h-8"
                >
                  {copiedContent ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedContent ? "Copied" : "Copy Text"}
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-2 p-4 rounded-lg border border-border/60 bg-muted/30 font-sans text-sm leading-relaxed whitespace-pre-wrap selection:bg-primary/20">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Reading parsed content...</p>
              </div>
            ) : previewDoc?.content ? (
              previewDoc.content
            ) : (
              <p className="text-xs text-muted-foreground italic">No readable text found for this document.</p>
            )}
          </div>

          <DialogFooter className="mt-2 flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              FastEmbed ONNX Vector Store · Ready for Low-Latency Voice RAG
            </div>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Move Document Modal ───────────────────────────────────────────── */}
      <Dialog open={!!movingDoc} onOpenChange={(open) => !open && setMovingDoc(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="h-5 w-5 text-primary" />
              Move Document
            </DialogTitle>
            <DialogDescription>
              Move <strong>{movingDoc?.name}</strong> to a different Knowledge Base.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <Label>Select Target Knowledge Base</Label>
            <Select value={targetKbId} onValueChange={setTargetKbId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Knowledge Base" />
              </SelectTrigger>
              <SelectContent>
                {allKbs
                  .filter((k) => k.id !== kb.id)
                  .map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: k.color || "#6366f1" }}
                        />
                        {k.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMovingDoc(null)}
              disabled={moving}
            >
              Cancel
            </Button>
            <Button onClick={handleMoveDoc} disabled={moving || !targetKbId}>
              {moving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moving...
                </>
              ) : (
                "Move Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Knowledge Base Modal ───────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <form onSubmit={handleUpdateKb}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Knowledge Base
              </DialogTitle>
              <DialogDescription>
                Update the name and description of this knowledge base.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="kb-edit-name">Name *</Label>
                <Input
                  id="kb-edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="kb-edit-desc">Description</Label>
                <Textarea
                  id="kb-edit-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={updatingKb}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingKb || !editName.trim()}>
                {updatingKb ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete KB Modal ─────────────────────────────────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Knowledge Base?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{kb.name}</strong>? Documents private to this KB will transition safely to the Workspace Vault with zero data loss.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deletingKb}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteKb}
              disabled={deletingKb}
            >
              {deletingKb ? "Deleting..." : "Delete KB"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
