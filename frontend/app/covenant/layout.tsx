import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Semantic Interface Covenant | GenLayer",
  description:
    "A GenLayer trust primitive that lets validators adjudicate semantic API and agent-tool compatibility, quarantine broken integrations, and settle bonded value.",
};

export default function CovenantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
