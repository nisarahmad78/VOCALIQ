import {
  Building2,
  Clock,
  History,
  Languages,
  Mic,
  BookOpen,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Mic,
    title: "Voice Conversations",
    description:
      "Customers talk naturally and your AI agent answers instantly through the browser.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base (RAG)",
    description:
      "Upload PDF, DOCX, or TXT files. The agent learns your policies, FAQs, and product details.",
  },
  {
    icon: Languages,
    title: "English & Urdu",
    description:
      "Serve customers in their own language with built-in multilingual support.",
  },
  {
    icon: History,
    title: "Conversation History",
    description:
      "Every call is transcribed and saved so you can review exactly what was discussed.",
  },
  {
    icon: Building2,
    title: "Workspace Ready",
    description:
      "Multi-tenant from day one — each company gets isolated data and its own agents.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Your AI agent never sleeps. Answer customer questions at any hour of the day.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to automate support
        </h2>
        <p className="mt-3 text-muted-foreground">
          From knowledge upload to live voice conversations — one platform.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="border-border/60 bg-card/50 transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <feature.icon className="size-5" />
              </span>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="hidden" />
          </Card>
        ))}
      </div>
    </section>
  );
}
