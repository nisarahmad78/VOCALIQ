import { httpFetch } from "./http";

const BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000";

export interface AiDocument {
  id: string;
  workspace_id: string;
  kb_id?: string | null;
  kb_ids?: string[];
  is_global?: boolean;
  name: string;
  type: string;
  size_bytes: number;
  chunk_count: number;
  status: "processing" | "ready" | "failed";
  error: string | null;
  created_at: string;
}

export interface AiSource {
  document_name: string;
  score: number;
}

export interface AiChatResult {
  reply: string;
  sources: AiSource[];
  language: "en" | "ur";
  provider: string;
}

export function uploadDocument(
  file: File,
  workspaceId: string,
  kbId?: string
): Promise<AiDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("workspace_id", workspaceId);
  if (kbId) {
    form.append("kb_id", kbId);
  }
  return httpFetch<AiDocument>(BASE_URL, "/documents/upload", {
    method: "POST",
    form,
  });
}

export function listDocuments(workspaceId: string): Promise<AiDocument[]> {
  return httpFetch<AiDocument[]>(
    BASE_URL,
    `/documents?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function deleteDocument(documentId: string): Promise<{ message: string }> {
  return httpFetch<{ message: string }>(
    BASE_URL,
    `/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" }
  );
}

export function reprocessDocument(
  documentId: string,
  file: File
): Promise<AiDocument> {
  const form = new FormData();
  form.append("file", file);
  return httpFetch<AiDocument>(
    BASE_URL,
    `/documents/${encodeURIComponent(documentId)}/reprocess`,
    { method: "POST", form }
  );
}

export async function transcribeAudio(
  blob: Blob,
  language: "en" | "ur"
): Promise<{ text: string; language: string }> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  form.append("language", language);
  return httpFetch<{ text: string; language: string }>(BASE_URL, "/stt", {
    method: "POST",
    form,
  });
}

export async function synthesizeSpeech(
  text: string,
  language: "en" | "ur"
): Promise<Blob> {
  const { getAccessToken } = await import("./auth-tokens");
  const token = getAccessToken();
  const res = await fetch(
    `${BASE_URL}/api/v1/tts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, language }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? "TTS failed");
  }
  return res.blob();
}

export function chatWithAgent(
  message: string,
  workspaceId: string,
  language: "en" | "ur",
  history?: Array<{ role: string; content: string }>,
  agentId?: string
): Promise<AiChatResult> {
  return httpFetch<AiChatResult>(BASE_URL, "/chat", {
    method: "POST",
    json: {
      message,
      workspace_id: workspaceId,
      language,
      ...(history && history.length > 0 ? { history } : {}),
      ...(agentId ? { agent_id: agentId } : {}),
    },
  });
}


export interface SaveMessage {
  role: string;
  content: string;
}

export interface AiConversationSummary {
  id: string;
  language: string;
  status: string;
  duration_sec: number;
  rating: number | null;
  created_at: string;
  message_count: number;
  first_question: string | null;
}

export interface AiConversationDetail extends AiConversationSummary {
  channel: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
  }>;
}

export function saveConversation(payload: {
  workspace_id: string;
  language: string;
  status?: string;
  duration_sec: number;
  messages: SaveMessage[];
}): Promise<{ id: string; message_count: number }> {
  return httpFetch(BASE_URL, "/conversations", {
    method: "POST",
    json: payload,
  });
}

export function listConversations(
  workspaceId: string
): Promise<AiConversationSummary[]> {
  return httpFetch(BASE_URL,
    `/conversations?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function getConversation(
  conversationId: string
): Promise<AiConversationDetail> {
  return httpFetch(BASE_URL,
    `/conversations/${encodeURIComponent(conversationId)}`
  );
}

export function deleteConversationApi(
  conversationId: string
): Promise<{ message: string }> {
  return httpFetch(BASE_URL,
    `/conversations/${encodeURIComponent(conversationId)}`,
    { method: "DELETE" }
  );
}

export function rateConversation(
  conversationId: string,
  rating: 1 | -1
): Promise<{ message: string }> {
  return httpFetch(BASE_URL,
    `/conversations/${encodeURIComponent(conversationId)}/feedback`,
    { method: "POST", json: { rating } }
  );
}

export interface WorkspaceSummary {
  totalConversations: number;
  totalDurationSec: number;
  questionsAnswered: number;
  documentsCount: number;
  storageBytes: number;
}

export function getWorkspaceSummary(
  workspaceId: string
): Promise<WorkspaceSummary> {
  return httpFetch(BASE_URL,
    `/stats/summary?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

// ── Multi-Agent Platform API ──────────────────────────────────────────────────

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  welcome_message: string;
  language: "en" | "ur";
  voice: string;
  system_instructions: string;
  is_active: boolean;
  is_default: boolean;
  kb_ids: string[];
  created_at: string;
  updated_at: string;
}

export function listAgents(workspaceId: string): Promise<Agent[]> {
  return httpFetch<Agent[]>(
    BASE_URL,
    `/agents?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function createAgent(
  payload: Omit<Agent, "id" | "created_at" | "updated_at">
): Promise<Agent> {
  return httpFetch<Agent>(BASE_URL, "/agents", {
    method: "POST",
    json: payload,
  });
}

export function updateAgent(
  agentId: string,
  payload: Partial<Omit<Agent, "id" | "workspace_id" | "created_at" | "updated_at">>
): Promise<Agent> {
  return httpFetch<Agent>(BASE_URL, `/agents/${encodeURIComponent(agentId)}`, {
    method: "PUT",
    json: payload,
  });
}

export function deleteAgentApi(agentId: string): Promise<void> {
  return httpFetch<void>(BASE_URL, `/agents/${encodeURIComponent(agentId)}`, {
    method: "DELETE",
  });
}

export function setDefaultAgentApi(agentId: string): Promise<Agent> {
  return httpFetch<Agent>(BASE_URL, `/agents/${encodeURIComponent(agentId)}/set-default`, {
    method: "POST",
  });
}

// ── Agent Config (Legacy Compatibility) ───────────────────────────────────────

export interface AgentConfig {
  id?: string;
  workspace_id: string;
  name: string;
  welcome_message: string;
  language: "en" | "ur";
  voice: string;
  system_instructions: string;
  is_active: boolean;
  is_default?: boolean;
  kb_ids?: string[];
  updated_at: string;
}

export function getAgentConfig(workspaceId: string): Promise<AgentConfig> {
  return httpFetch<AgentConfig>(
    BASE_URL,
    `/agent/config?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function saveAgentConfig(
  config: Omit<AgentConfig, "updated_at">
): Promise<AgentConfig> {
  return httpFetch<AgentConfig>(BASE_URL, "/agent/config", {
    method: "PUT",
    json: config,
  });
}

// ── AI FAQ & Raw Text Documents ───────────────────────────────────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

export interface GenerateFaqResult {
  title: string;
  summary: string;
  faqs: FaqItem[];
  raw_markdown: string;
  provider: string;
}

export function generateFaqFromPrompt(
  workspaceId: string,
  prompt: string,
  language: "en" | "ur" = "en",
  kbId?: string
): Promise<GenerateFaqResult> {
  return httpFetch<GenerateFaqResult>(BASE_URL, "/documents/generate-faq", {
    method: "POST",
    json: { workspace_id: workspaceId, prompt, language, ...(kbId ? { kb_id: kbId } : {}) },
  });
}

export function createRawTextDocument(
  workspaceId: string,
  title: string,
  content: string,
  kbId?: string
): Promise<AiDocument> {
  return httpFetch<AiDocument>(BASE_URL, "/documents/raw-text", {
    method: "POST",
    json: { workspace_id: workspaceId, title, content, ...(kbId ? { kb_id: kbId } : {}) },
  });
}

// ── Knowledge Bases ──────────────────────────────────────────────────────────

export interface KnowledgeBase {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  color: string;
  document_count: number;
  chunk_count: number;
  created_at: string;
}

export interface CreateKnowledgeBaseInput {
  workspace_id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateKnowledgeBaseInput {
  name?: string;
  description?: string;
  color?: string;
}

export interface DocumentContent {
  document_id: string;
  name: string;
  type: string;
  chunk_count: number;
  content: string;
  size_bytes: number;
}

export function getKnowledgeBases(workspaceId: string): Promise<KnowledgeBase[]> {
  return httpFetch<KnowledgeBase[]>(
    BASE_URL,
    `/knowledge-bases?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function getKnowledgeBase(
  workspaceId: string,
  kbId: string
): Promise<KnowledgeBase> {
  return httpFetch<KnowledgeBase>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function createKnowledgeBase(
  data: CreateKnowledgeBaseInput
): Promise<KnowledgeBase> {
  return httpFetch<KnowledgeBase>(BASE_URL, "/knowledge-bases", {
    method: "POST",
    json: data,
  });
}

export function updateKnowledgeBase(
  kbId: string,
  data: UpdateKnowledgeBaseInput
): Promise<KnowledgeBase> {
  return httpFetch<KnowledgeBase>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}`,
    {
      method: "PATCH",
      json: data,
    }
  );
}

export function deleteKnowledgeBase(
  workspaceId: string,
  kbId: string
): Promise<void> {
  return httpFetch<void>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}?workspace_id=${encodeURIComponent(workspaceId)}`,
    {
      method: "DELETE",
    }
  );
}

export function getKnowledgeBaseDocuments(
  workspaceId: string,
  kbId: string
): Promise<AiDocument[]> {
  return httpFetch<AiDocument[]>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}/documents?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function getDocumentContent(
  workspaceId: string,
  kbId: string,
  docId: string
): Promise<DocumentContent> {
  return httpFetch<DocumentContent>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}/documents/${encodeURIComponent(docId)}/content?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}

export function moveDocumentToKb(
  workspaceId: string,
  sourceKbId: string,
  docId: string,
  targetKbId: string
): Promise<AiDocument> {
  return httpFetch<AiDocument>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(sourceKbId)}/documents/${encodeURIComponent(docId)}/move?workspace_id=${encodeURIComponent(workspaceId)}&target_kb_id=${encodeURIComponent(targetKbId)}`,
    {
      method: "PATCH",
    }
  );
}

export function assignDocumentKbs(
  workspaceId: string,
  docId: string,
  kbIds: string[],
  isGlobal: boolean = false
): Promise<AiDocument> {
  return httpFetch<AiDocument>(
    BASE_URL,
    `/documents/${encodeURIComponent(docId)}/assign-kbs`,
    {
      method: "PATCH",
      json: {
        workspace_id: workspaceId,
        kb_ids: kbIds,
        is_global: isGlobal,
      },
    }
  );
}

export function attachExistingDocumentsToKb(
  workspaceId: string,
  kbId: string,
  documentIds: string[]
): Promise<{ status: string; attached_count: number }> {
  return httpFetch<{ status: string; attached_count: number }>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}/attach-existing`,
    {
      method: "POST",
      json: {
        workspace_id: workspaceId,
        document_ids: documentIds,
      },
    }
  );
}

export function detachDocumentFromKb(
  workspaceId: string,
  kbId: string,
  documentId: string
): Promise<{ status: string; message: string }> {
  return httpFetch<{ status: string; message: string }>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}/detach-document`,
    {
      method: "POST",
      json: {
        workspace_id: workspaceId,
        document_id: documentId,
      },
    }
  );
}

export interface GraphNode {
  id: string;
  type: "kb" | "document" | "chunk" | "entity";
  label: string;
  sublabel?: string;
  document_id?: string | null;
  document_name?: string | null;
  chunk_index?: number | null;
  content?: string;
  size_bytes: number;
  metrics: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "contains" | "narrative" | "semantic_bridge" | "entity_link";
  weight: number;
  label?: string;
}

export interface GraphMetrics {
  health_score: number;
  hierarchy_depth: number;
  total_nodes: number;
  total_edges: number;
  cross_doc_bridges: number;
  orphan_chunks: number;
  voice_traversal_ms: number;
  hallucination_shield_pct: number;
  synthesis_capability: string;
}

export interface KnowledgeBaseGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: GraphMetrics;
}

export function getKnowledgeBaseGraph(
  workspaceId: string,
  kbId: string
): Promise<KnowledgeBaseGraphResponse> {
  return httpFetch<KnowledgeBaseGraphResponse>(
    BASE_URL,
    `/knowledge-bases/${encodeURIComponent(kbId)}/graph?workspace_id=${encodeURIComponent(workspaceId)}`
  );
}