export type AgentStatus = "active" | "inactive";

export type DocumentStatus = "processing" | "ready" | "failed";

export type MessageRole = "customer" | "agent";

export interface Agent {
  id: string;
  name: string;
  welcomeMessage: string;
  language: "en" | "ur";
  voice: string;
  systemInstructions: string;
  status: AgentStatus;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt";
  sizeKb: number;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  customerName: string;
  durationSec: number;
  language: "English" | "Urdu";
  status: "resolved" | "escalated" | "missed";
  startedAt: string;
  messages: ConversationMessage[];
}

export const mockAgent: Agent = {
  id: "agent_001",
  name: "Customer Support Agent",
  welcomeMessage: "Hello! How can I help you today?",
  language: "en",
  voice: "alloy",
  systemInstructions:
    "You are a helpful and professional customer support representative. Answer questions using only the company knowledge base. If you don't know the answer, politely offer to escalate to a human agent.",
  status: "active",
};

export const mockStats = {
  totalConversations: 128,
  questionsAnswered: 1042,
  documentsCount: 4,
  agentStatus: "active" as AgentStatus,
};

export const mockDocuments: KnowledgeDocument[] = [
  {
    id: "doc_001",
    name: "Return Policy.pdf",
    type: "pdf",
    sizeKb: 248,
    status: "ready",
    uploadedAt: "2026-08-20T10:30:00Z",
  },
  {
    id: "doc_002",
    name: "Product Guide.pdf",
    type: "pdf",
    sizeKb: 1840,
    status: "ready",
    uploadedAt: "2026-08-20T11:15:00Z",
  },
  {
    id: "doc_003",
    name: "FAQ.docx",
    type: "docx",
    sizeKb: 96,
    status: "ready",
    uploadedAt: "2026-08-21T09:05:00Z",
  },
  {
    id: "doc_004",
    name: "Shipping Policy.pdf",
    type: "pdf",
    sizeKb: 512,
    status: "ready",
    uploadedAt: "2026-08-22T08:40:00Z",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "1024",
    customerName: "Ahmed Raza",
    durationSec: 134,
    language: "English",
    status: "resolved",
    startedAt: "2026-08-22T14:02:00Z",
    messages: [
      {
        role: "customer",
        content: "What is your return policy?",
        timestamp: "2026-08-22T14:02:10Z",
      },
      {
        role: "agent",
        content:
          "Our return policy allows you to return any unused item within 30 days of delivery for a full refund. Would you like me to email you the detailed return instructions?",
        timestamp: "2026-08-22T14:02:25Z",
      },
      {
        role: "customer",
        content: "Yes please, and how long does the refund take?",
        timestamp: "2026-08-22T14:03:02Z",
      },
      {
        role: "agent",
        content:
          "I have sent the instructions to your registered email. Refunds are processed within 5-7 business days after we receive the returned item.",
        timestamp: "2026-08-22T14:03:18Z",
      },
    ],
  },
  {
    id: "1023",
    customerName: "Sara Khan",
    durationSec: 89,
    language: "Urdu",
    status: "resolved",
    startedAt: "2026-08-22T13:15:00Z",
    messages: [
      {
        role: "customer",
        content: "Mera order kab deliver hoga?",
        timestamp: "2026-08-22T13:15:12Z",
      },
      {
        role: "agent",
        content:
          "Aap ka order ORD-8821 kal tak deliver ho jaye ga. Aap ko tracking link SMS par bhej diya gaya hai.",
        timestamp: "2026-08-22T13:15:28Z",
      },
    ],
  },
  {
    id: "1022",
    customerName: "Bilal Ahmed",
    durationSec: 212,
    language: "English",
    status: "escalated",
    startedAt: "2026-08-22T11:48:00Z",
    messages: [
      {
        role: "customer",
        content: "My payment was deducted twice for the same order.",
        timestamp: "2026-08-22T11:48:15Z",
      },
      {
        role: "agent",
        content:
          "I understand this is concerning. I am escalating this issue to our billing specialist who will contact you within 24 hours regarding the duplicate transaction refund.",
        timestamp: "2026-08-22T11:48:33Z",
      },
    ],
  },
  {
    id: "1021",
    customerName: "Fatima Noor",
    durationSec: 156,
    language: "English",
    status: "resolved",
    startedAt: "2026-08-21T17:30:00Z",
    messages: [
      {
        role: "customer",
        content: "Do you ship internationally?",
        timestamp: "2026-08-21T17:30:10Z",
      },
      {
        role: "agent",
        content:
          "Yes, we ship to over 40 countries. International delivery typically takes 7-14 business days depending on the destination.",
        timestamp: "2026-08-21T17:30:27Z",
      },
      {
        role: "customer",
        content: "What about shipping costs to the UAE?",
        timestamp: "2026-08-21T17:31:40Z",
      },
      {
        role: "agent",
        content:
          "Shipping to the UAE starts at $12.99 for orders under $100, and it is free for orders above $100.",
        timestamp: "2026-08-21T17:31:55Z",
      },
    ],
  },
];

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
