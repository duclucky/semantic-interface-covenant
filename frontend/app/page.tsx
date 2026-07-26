"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { AccountPanel } from "@/components/AccountPanel";

const COVENANT_ADDRESS = "0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570";
const GUARD_ADDRESS = "0xA58132c068E0406E2d5d43E8b72E2b2361ac057D";
const EXPLORER = "https://explorer-studio.genlayer.com/address";
const REPOSITORY =
  "https://github.com/duclucky/semantic-interface-covenant";

const lifecycle = [
  {
    title: "Lock the promise",
    body: "Provider and integrator accept versioned semantic guarantees and fund GEN bonds.",
  },
  {
    title: "Adjudicate evidence",
    body: "Validators independently fetch allowlisted public sources and decide compatibility.",
  },
  {
    title: "Enforce the verdict",
    body: "Finalized consensus quarantines or restores consumers and settles bonded value.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">
              GenLayer Intelligent Contract
            </p>
            <p className="mt-1 font-semibold">Semantic Interface Covenant</p>
          </div>
          <AccountPanel />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(155,106,246,0.2),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.16),transparent_32%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Full lifecycle finalized on Studionet
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
                Quarantine an interface when its meaning changes—not only when
                it goes offline.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                A reusable covenant for APIs, MCP servers, and agent tools.
                GenLayer validators adjudicate public evidence; finalized
                verdicts control integration state, GEN settlement, and
                subscriber enforcement.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/covenant"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold transition hover:bg-primary/90"
                >
                  Open covenant workbench
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={REPOSITORY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white/30 hover:bg-white/5"
                >
                  View source
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-4 self-center">
              <div className="brand-card p-6">
                <ShieldCheck className="h-7 w-7 text-accent" />
                <p className="mt-5 text-sm text-muted-foreground">
                  Live verdict
                </p>
                <p className="mt-1 text-2xl font-bold">
                  BREAKING · CRITICAL
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Validators found the candidate SDK had replaced the required
                  method dispatch key. The binding and consumer were
                  quarantined, then restored after a validated cure.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="brand-card p-5">
                  <p className="text-2xl font-bold text-accent">1 GEN</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    service credit settled
                  </p>
                </div>
                <div className="brand-card p-5">
                  <p className="text-2xl font-bold text-accent">1.1 GEN</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    finalized withdrawal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {lifecycle.map((item, index) => (
              <article key={item.title} className="brand-card p-6">
                <span className="font-mono text-xs text-accent">
                  0{index + 1}
                </span>
                <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-2">
            <article className="brand-card p-6">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold">Covenant primitive</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Structured per-covenant guarantees, bilateral bindings, bonded
                evidence cases, semantic verdicts, cures, credits, and
                withdrawals.
              </p>
              <a
                href={`${EXPLORER}/${COVENANT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block break-all font-mono text-xs text-accent hover:underline"
              >
                {COVENANT_ADDRESS}
              </a>
            </article>

            <article className="brand-card p-6">
              <div className="flex items-center gap-3">
                <Waypoints className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold">Enforcement consumer</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                `ToolRouterGuard` accepts only finalized covenant messages,
                handles duplicates, and fails closed while the protected
                binding is quarantined.
              </p>
              <a
                href={`${EXPLORER}/${GUARD_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block break-all font-mono text-xs text-accent hover:underline"
              >
                {GUARD_ADDRESS}
              </a>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="brand-card flex flex-col justify-between gap-6 p-7 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-accent">
                <BookOpen className="h-5 w-5" />
                <span className="text-sm font-semibold">Builder interface</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold">
                Pull canonical status or subscribe to finalized changes.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Integrators can call `get_binding_status(binding_id)` or
                implement `on_covenant_status(binding_id, verdict_id,
                new_status)`.
              </p>
            </div>
            <a
              href={`${REPOSITORY}/blob/main/docs/ideas/IDEA-001-SEMANTIC-INTERFACE-COVENANT/INTEGRATION.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
            >
              Read integration guide
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-muted-foreground">
        Semantic Interface Covenant · Studionet chain ID 61999
      </footer>
    </div>
  );
}
