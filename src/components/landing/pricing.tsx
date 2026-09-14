import Link from "next/link";
import { Check } from "lucide-react";

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
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for trying out the MVP.",
    features: [
      "1 workspace",
      "1 AI agent",
      "5 knowledge documents",
      "Browser voice testing",
      "Conversation history",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: true,
    badge: null as string | null,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing businesses. Coming soon.",
    features: [
      "Everything in Starter",
      "Unlimited agents",
      "Phone call support",
      "Human handoff",
      "Priority support",
    ],
    cta: "Join Waitlist",
    href: "#",
    highlighted: false,
    badge: "Coming Soon",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams with advanced needs.",
    features: [
      "Custom integrations",
      "SLA & dedicated support",
      "Advanced analytics",
      "SSO & roles",
      "On-prem option",
    ],
    cta: "Contact Sales",
    href: "#",
    highlighted: false,
    badge: null,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-3 text-muted-foreground">
          Start free today. Paid plans are on the roadmap.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col border-border/60 bg-card/50",
              plan.highlighted && "border-primary/50 shadow-lg shadow-primary/10"
            )}
          >
            {plan.badge ? (
              <Badge
                variant="secondary"
                className="absolute -top-2.5 left-4 text-xs"
              >
                {plan.badge}
              </Badge>
            ) : null}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-3">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
