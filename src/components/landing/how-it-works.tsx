import {
  Bot,
  BookOpen,
  Mic,
  UserPlus,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up & Create Workspace",
    description:
      "Create your account and company workspace in under a minute.",
  },
  {
    icon: BookOpen,
    step: "02",
    title: "Upload Knowledge",
    description:
      "Add your policies, FAQs, and product guides as PDF, DOCX, or TXT.",
  },
  {
    icon: Bot,
    step: "03",
    title: "Configure Your Agent",
    description:
      "Set the name, welcome message, language, and voice of your AI agent.",
  },
  {
    icon: Mic,
    step: "04",
    title: "Start Talking",
    description:
      "Test a live voice conversation in your browser — no phone line needed.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-border/60 bg-card/30"
    >
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            From zero to a working AI support agent in four simple steps.
          </p>
        </div>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.step}
              className="relative rounded-xl border border-border/60 bg-background/50 p-6"
            >
              <span className="text-sm font-mono font-semibold text-primary">
                {step.step}
              </span>
              <span className="mt-3 mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <step.icon className="size-5" />
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
