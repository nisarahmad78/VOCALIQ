export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "VocalIQ",
  tagline: "AI Voice Customer Support",
  description:
    "Build an AI voice agent trained on your company knowledge. Answer customer calls automatically, 24/7.",
  url: "https://localhost:3000",
  links: {
    login: "/login",
    signup: "/signup",
    dashboard: "/dashboard",
    admin: "/admin",
  },
} as const;
