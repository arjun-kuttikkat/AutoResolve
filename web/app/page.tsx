"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Mail,
  Bot,
  CheckCircle2,
  Wand2,
  BadgeCheck,
  ChevronDown,
  Lock,
  Gauge,
  MessagesSquare,
  FileText,
} from "lucide-react";

// Premium, light-mode, ElevenLabs-inspired landing page
// Tailwind required. Framer Motion + lucide-react required.
// Single-file drop-in component for Next.js app router: app/page.tsx

const ease = [0.22, 1, 0.36, 1] as const;

const BRAND = {
  name: "AutoResolve",
  // Update these to match the exact logo colors if needed.
  a: "#4F46E5", // indigo
  b: "#06B6D4", // cyan
  c: "#F43F5E", // rose
};

function cn(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
      }}
    >
      {children}
    </span>
  );
}

function Noise() {
  // lightweight noise overlay using CSS gradients (no external assets)
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-soft-light"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(0,0,0,.08), transparent 35%), radial-gradient(circle at 80% 0%, rgba(0,0,0,.05), transparent 40%), radial-gradient(circle at 50% 90%, rgba(0,0,0,.06), transparent 40%)",
      }}
    />
  );
}

function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        className
      )}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${BRAND.b}55, transparent 55%), radial-gradient(circle at 70% 60%, ${BRAND.c}40, transparent 55%), radial-gradient(circle at 50% 50%, ${BRAND.a}35, transparent 55%)`,
      }}
    />
  );
}

function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-6", className)}>
      {children}
    </div>
  );
}

function Button({
  children,
  href,
  variant = "primary",
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition will-change-transform";
  const styles =
    variant === "primary"
      ? "text-white shadow-[0_10px_30px_rgba(0,0,0,.12)] hover:shadow-[0_18px_50px_rgba(0,0,0,.14)] active:scale-[0.98]"
      : variant === "secondary"
        ? "bg-white/80 text-zinc-900 ring-1 ring-black/10 hover:bg-white active:scale-[0.98]"
        : "text-zinc-900 hover:bg-black/5 active:scale-[0.98]";

  const content = (
    <span
      className={cn(base, styles)}
      style={
        variant === "primary"
          ? {
              backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
            }
          : undefined
      }
    >
      {children}
    </span>
  );

  if (href) return <a href={href}>{content}</a>;
  return (
    <button type="button" onClick={onClick}>
      {content}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-800 ring-1 ring-black/10 backdrop-blur">
      <Sparkles className="h-4 w-4" style={{ color: BRAND.b }} />
      {children}
    </span>
  );
}

import { Logo } from "@/components/Logo";

function TopNav() {
  const [open, setOpen] = useState(false);
  const items = [
    { label: "How it works", href: "#how" },
    { label: "Security", href: "#security" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 transition opacity-90 hover:opacity-100">
          <Logo size={36} />
          <span className="text-lg font-semibold tracking-tight text-zinc-950">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <div className="flex items-center gap-8 text-sm font-medium text-zinc-600">
            {items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className="transition hover:text-zinc-950"
              >
                {it.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" href="#demo">
              View demo
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,.12)] transition hover:shadow-[0_18px_50px_rgba(0,0,0,.14)] active:scale-[0.98]"
              style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
            >
              Create a case <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-black/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
        >
          <div className="h-5 w-5">
            <div className="h-0.5 w-5 rounded bg-zinc-950" />
            <div className="mt-1.5 h-0.5 w-5 rounded bg-zinc-950" />
            <div className="mt-1.5 h-0.5 w-5 rounded bg-zinc-950" />
          </div>
        </button>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="border-t border-black/5 bg-white"
          >
            <Container className="py-4">
              <div className="flex flex-col gap-3">
                {items.map((it) => (
                  <a
                    key={it.href}
                    href={it.href}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </a>
                ))}
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" href="#demo">
                    View demo
                  </Button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
                    style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
                  >
                    Create a case <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative w-screen overflow-hidden bg-gradient-to-b from-zinc-50/50 via-white to-white min-h-[calc(100vh-64px)] flex items-center">
      <Glow className="-top-24 left-[-140px] h-[420px] w-[420px] opacity-50" />
      <Glow className="top-[-180px] right-[-160px] h-[520px] w-[520px] opacity-45" />
      <Noise />

      <Container className="relative py-10 md:py-14">
        <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-16">
          <div className="md:col-span-6">
            <Pill>Autonomous refunds & support resolution, over email</Pill>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl md:leading-[1.15] lg:text-6xl">
              Stop chasing support.
              <br />
              <span className="font-semibold">
                <GradientText>Let an agent negotiate</GradientText>
              </span>
              <span> on your behalf.</span>
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 md:text-lg">
              AutoResolve sends the first email, reads replies, follows up, counters offers,
              and escalates until your issue is resolved — directly from your own inbox.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,.12)] transition hover:shadow-[0_18px_50px_rgba(0,0,0,.14)] active:scale-[0.98]"
                style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
              >
                Create a case <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 hover:shadow"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat
                icon={<Clock className="h-4 w-4" />}
                label="Time saved"
                value="Hours per case"
              />
              <Stat
                icon={<MessagesSquare className="h-4 w-4" />}
                label="Follow-ups"
                value="Never missed"
              />
              <Stat
                icon={<Shield className="h-4 w-4" />}
                label="From your inbox"
                value="Authentic email"
              />
            </div>
          </div>

          <div className="md:col-span-6">
            <HeroMock />
          </div>
        </div>

        <div className="mt-14 border-t border-black/5 pb-10 pt-10 md:mt-16">
          <Marquee />
        </div>
      </Container>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/10 backdrop-blur">
      <div className="flex items-center gap-2 text-zinc-700">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-black/10"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.6))",
          }}
        >
          <span style={{ color: BRAND.a }}>{icon}</span>
        </span>
        <div className="text-xs font-semibold">{label}</div>
      </div>
      <div className="mt-3 text-sm font-semibold text-zinc-950">{value}</div>
    </div>
  );
}

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/70 ring-1 ring-black/10 backdrop-blur",
        "shadow-[0_20px_80px_rgba(0,0,0,.12)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function HeroMock() {
  // Animated split: inbox thread + agent decision strip
  return (
    <div className="relative">
      <Glow className="-bottom-12 left-10 h-[260px] w-[260px] opacity-40" />
      <Glow className="-top-8 right-8 h-[240px] w-[240px] opacity-35" />

      <GlassCard className="relative overflow-hidden">
        <div className="grid gap-0 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <Logo size={40} className="shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-zinc-950">Inbox</div>
                  <div className="text-xs text-zinc-600">Support threads</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: BRAND.b }}
                  />
                  Agent active
                </span>
              </div>
            </div>

            <div className="p-5">
              <AnimatedThread />
            </div>
          </div>

          <div className="border-t border-black/5 md:col-span-5 md:border-l md:border-t-0">
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                <Bot className="h-4 w-4" style={{ color: BRAND.a }} />
                Agent decisions
              </div>

              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                The agent classifies replies, tracks concessions, and chooses the next best
                action — follow up, counter, or escalate.
              </p>

              <DecisionStrip />

              <div className="mt-5 grid gap-3">
                <MiniKpi
                  icon={<Gauge className="h-4 w-4" />}
                  title="Strategy"
                  value="Firm, polite, evidence-based"
                />
                <MiniKpi
                  icon={<FileText className="h-4 w-4" />}
                  title="Context"
                  value="Order, policy, prior replies"
                />
                <MiniKpi
                  icon={<Clock className="h-4 w-4" />}
                  title="Follow-up"
                  value="Scheduled if no response"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1"
          style={{
            backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
          }}
        />
      </GlassCard>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SmallCallout
          icon={<Mail className="h-4 w-4" />}
          title="Runs in your email"
          desc="No special integrations required. Works with any company that supports email."
        />
        <SmallCallout
          icon={<Wand2 className="h-4 w-4" />}
          title="Hands-off automation"
          desc="Full automation or approval mode — your choice, per case."
        />
      </div>
    </div>
  );
}

function SmallCallout({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/10 backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-black/10"
          style={{
            backgroundImage: `linear-gradient(135deg, ${BRAND.a}12, ${BRAND.b}10, ${BRAND.c}10)`,
          }}
        >
          <span style={{ color: BRAND.a }}>{icon}</span>
        </span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
    </div>
  );
}

function MiniKpi({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/60 p-3 ring-1 ring-black/10">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
        <span style={{ color: BRAND.b }}>{icon}</span>
        {title}
      </div>
      <div className="mt-1 text-sm font-semibold text-zinc-950">{value}</div>
    </div>
  );
}

function AnimatedThread() {
  const bubbles = useMemo(
    () => [
      {
        who: "you",
        title: "You",
        time: "09:12",
        text: "Hi — I’m requesting a refund for Order #18472. The item arrived damaged, and I’d like a full refund to the original payment method.",
      },
      {
        who: "them",
        title: "Merchant Support",
        time: "11:03",
        text: "We can offer a 15% partial refund. Please confirm if you accept.",
      },
      {
        who: "agent",
        title: "AutoResolve",
        time: "11:05",
        text: "Thanks. Given the damage and policy coverage, we’re requesting a full refund. Photos attached. If needed, please escalate to a supervisor.",
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.15 }}
          className={cn(
            "rounded-2xl p-4 ring-1",
            b.who === "you"
              ? "bg-white ring-black/10"
              : b.who === "them"
                ? "bg-zinc-50 ring-black/10"
                : "bg-white ring-black/10"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-xl ring-1 ring-black/10"
                style={{
                  backgroundImage:
                    b.who === "agent"
                      ? `linear-gradient(135deg, ${BRAND.a}22, ${BRAND.b}22, ${BRAND.c}22)`
                      : "linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.65))",
                }}
              >
                {b.who === "agent" ? (
                  <Bot className="h-4 w-4" style={{ color: BRAND.a }} />
                ) : b.who === "them" ? (
                  <Mail className="h-4 w-4" style={{ color: "#111827" }} />
                ) : (
                  <CheckCircle2 className="h-4 w-4" style={{ color: BRAND.b }} />
                )}
              </span>
              <div className="text-sm font-semibold text-zinc-950">{b.title}</div>
              {b.who === "agent" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                  <BadgeCheck className="h-3 w-3" style={{ color: BRAND.b }} />
                  agent
                </span>
              ) : null}
            </div>
            <div className="text-xs text-zinc-500">{b.time}</div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-zinc-700">{b.text}</p>

          {b.who === "agent" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.75 }}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <Tag>Counter offer</Tag>
              <Tag>Escalate</Tag>
              <Tag>Attach evidence</Tag>
            </motion.div>
          ) : null}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.65 }}
        className="rounded-2xl bg-white/60 p-4 ring-1 ring-black/10"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
          <Clock className="h-4 w-4" style={{ color: BRAND.c }} />
          Next action
        </div>
        <p className="mt-2 text-sm text-zinc-600">
          If no reply within 24 hours, AutoResolve sends a follow-up and escalates.
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
          <motion.div
            className="h-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
            }}
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "72%", "45%", "100%"] }}
            transition={{ duration: 7.5, ease, repeat: Infinity, repeatType: "loop" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-zinc-700">
      {children}
    </span>
  );
}

function DecisionStrip() {
  const items = useMemo(
    () => [
      { title: "Classify reply", desc: "Offer detected: partial refund" },
      { title: "Pick strategy", desc: "Request full refund + evidence" },
      { title: "Escalate", desc: "Ask for supervisor if needed" },
      { title: "Schedule follow-up", desc: "If no response in 24h" },
    ],
    []
  );

  return (
    <div className="mt-4 space-y-2">
      {items.map((it, idx) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.15 + idx * 0.12 }}
          className="rounded-2xl bg-white/60 p-3 ring-1 ring-black/10"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-950">{it.title}</div>
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background:
                  idx % 3 === 0 ? BRAND.a : idx % 3 === 1 ? BRAND.b : BRAND.c,
              }}
            />
          </div>
          <div className="mt-1 text-sm text-zinc-600">{it.desc}</div>
        </motion.div>
      ))}

      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/10">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-950">Mode</div>
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
            Approval
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ModeChip active label="Approval" desc="Review before send" />
          <ModeChip label="Auto" desc="Fully hands-off" />
        </div>
      </div>
    </div>
  );
}

function ModeChip({
  active,
  label,
  desc,
}: {
  active?: boolean;
  label: string;
  desc: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-3 ring-1",
        active
          ? "bg-white ring-black/15 shadow-[0_12px_40px_rgba(0,0,0,.10)]"
          : "bg-white/60 ring-black/10"
      )}
    >
      <div className="text-sm font-semibold text-zinc-950">{label}</div>
      <div className="mt-1 text-xs text-zinc-600">{desc}</div>
      {active ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full"
            style={{
              width: "60%",
              backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Marquee() {
  const items = [
    "Refunds",
    "Cancellations",
    "Billing errors",
    "Damaged deliveries",
    "Subscription disputes",
    "Charge corrections",
    "Escalations",
    "Follow-ups",
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />

      <motion.div
        className="flex w-max gap-3"
        initial={{ x: 0 }}
        animate={{ x: [0, -520] }}
        transition={{ duration: 18, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-black/10"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: i % 3 === 0 ? BRAND.a : i % 3 === 1 ? BRAND.b : BRAND.c }}
            />
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl md:leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-600">{desc}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Connect your email",
      desc: "Securely connect Gmail so emails send from your own account.",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Create a case",
      desc: "Provide merchant, order details, what happened, and the outcome you want.",
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: "Agent runs the negotiation",
      desc: "AutoResolve drafts, sends, reads replies, counters offers, and follows up.",
    },
    {
      icon: <BadgeCheck className="h-5 w-5" />,
      title: "Resolve & close",
      desc: "You approve messages (or enable full auto) until the case is resolved.",
    },
  ];

  return (
    <section id="how" className="w-screen bg-white py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="WORKFLOW"
          title={
            <>
              From complaint to resolution in <GradientText>one flow</GradientText>
            </>
          }
          desc="Create a case once. The agent handles the email loop end-to-end."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.55, ease, delay: i * 0.08 }}
              className="rounded-3xl bg-zinc-50 p-6 ring-1 ring-black/10"
            >
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/10"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${BRAND.a}14, ${BRAND.b}14, ${BRAND.c}14)`,
                }}
              >
                <span style={{ color: BRAND.a }}>{s.icon}</span>
              </div>
              <div className="mt-4 text-sm font-semibold text-zinc-950">{s.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-600">{s.desc}</div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <span
                  className="h-1.5 w-10 rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
                  }}
                />
                Step {i + 1}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-12 md:items-start">
          <div className="md:col-span-6">
            <GlassCard className="overflow-hidden">
              <div className="border-b border-black/5 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-950">Case builder</div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Preview
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  Tell the agent what happened and what outcome you want.
                </p>
              </div>
              <div className="p-6">
                <CaseBuilderMock />
              </div>
            </GlassCard>
          </div>

          <div className="md:col-span-6">
            <GlassCard className="overflow-hidden">
              <div className="border-b border-black/5 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-950">Outcome tracker</div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Live
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  See status, offers, escalations, and next steps at a glance.
                </p>
              </div>
              <div className="p-6">
                <OutcomeMock />
              </div>
            </GlassCard>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/10">
      <div className="text-xs font-semibold text-zinc-600">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-950">{value}</div>
    </div>
  );
}

function CaseBuilderMock() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Merchant" value="ACME Store" />
        <Field label="Order" value="#18472" />
      </div>
      <Field label="Issue" value="Item arrived damaged" />
      <Field label="Desired outcome" value="Full refund to original payment method" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/10">
          <div className="text-xs font-semibold text-zinc-600">Attachments</div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-black/10"
              style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.a}12, ${BRAND.b}12)` }}
            >
              <FileText className="h-4 w-4" style={{ color: BRAND.a }} />
            </span>
            <div>
              <div className="text-sm font-semibold text-zinc-950">damage_photos.zip</div>
              <div className="text-xs text-zinc-500">3 images</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/10">
          <div className="text-xs font-semibold text-zinc-600">Mode</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-950">Approval</div>
              <div className="text-xs text-zinc-500">Review before send</div>
            </div>
            <span
              className="inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold text-white"
              style={{
                backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
              }}
            >
              Selected
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_60px_rgba(0,0,0,.12)] transition active:scale-[0.99]"
          style={{
            backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
          }}
        >
          Create case
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

function OutcomeMock() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi title="Status" value="Negotiating" accent={BRAND.b} />
        <Kpi title="Last reply" value="2h ago" accent={BRAND.a} />
        <Kpi title="Next action" value="Follow-up" accent={BRAND.c} />
      </div>

      <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-black/10">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-950">Offers</div>
          <span className="text-xs font-semibold text-zinc-500">Latest</span>
        </div>

        <div className="mt-4 space-y-3">
          <OfferRow who="Merchant" amount="15% refund" note="Initial offer" dot={"#111827"} />
          <OfferRow who="AutoResolve" amount="Full refund" note="Counter + evidence" dot={BRAND.b} />
        </div>

        <div className="mt-5">
          <div className="text-xs font-semibold text-zinc-600">Concession timeline</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
            <motion.div
              className="h-full"
              style={{
                backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
              }}
              initial={{ width: "18%" }}
              animate={{ width: ["18%", "45%", "34%", "62%", "56%"] }}
              transition={{ duration: 8, ease, repeat: Infinity }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-black/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <Shield className="h-4 w-4" style={{ color: BRAND.a }} />
            Guardrails
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            The agent stays professional and policy-aligned — with your oversight.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag>Professional tone</Tag>
            <Tag>Policy references</Tag>
            <Tag>Escalation paths</Tag>
          </div>
        </div>
        <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-black/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <Clock className="h-4 w-4" style={{ color: BRAND.c }} />
            Persistence
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            AutoResolve follows up on schedule so cases don’t stall.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag>24h follow-ups</Tag>
            <Tag>Supervisor requests</Tag>
            <Tag>Status tracking</Tag>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-black/10">
      <div className="text-xs font-semibold text-zinc-600">{title}</div>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-zinc-950">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        {value}
      </div>
    </div>
  );
}

function OfferRow({
  who,
  amount,
  note,
  dot,
}: {
  who: string;
  amount: string;
  note: string;
  dot: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-black/10">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
        <div>
          <div className="text-sm font-semibold text-zinc-950">{who}</div>
          <div className="text-xs text-zinc-500">{note}</div>
        </div>
      </div>
      <div className="text-sm font-semibold text-zinc-950">{amount}</div>
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: <Bot className="h-5 w-5" />,
      title: "Autonomous state machine",
      desc: "Classifies replies, chooses strategies, and schedules follow-ups automatically.",
    },
    {
      icon: <MessagesSquare className="h-5 w-5" />,
      title: "Conversation memory",
      desc: "Remembers every message and tracks concessions across the negotiation.",
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Works with any company",
      desc: "If they have an email address, AutoResolve can run the workflow.",
    },
    {
      icon: <Wand2 className="h-5 w-5" />,
      title: "Approval or full-auto",
      desc: "Review drafts before sending or let the agent handle it end-to-end.",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Always-on persistence",
      desc: "Never forgets to follow up. Keeps pressure politely and consistently.",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Professional, structured emails",
      desc: "Clear, evidence-backed messages that improve outcomes and reduce back-and-forth.",
    },
  ];

  return (
    <section id="features" className="w-screen bg-zinc-50 py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="FEATURES"
          title={
            <>
              Built for real-world <GradientText>email battles</GradientText>
            </>
          }
          desc="Everything needed to resolve disputes without living in your inbox."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.55, ease, delay: i * 0.06 }}
              className="rounded-3xl bg-white/80 p-6 ring-1 ring-black/10 backdrop-blur"
            >
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-black/10"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${BRAND.a}14, ${BRAND.b}14, ${BRAND.c}14)`,
                }}
              >
                <span style={{ color: BRAND.a }}>{f.icon}</span>
              </div>
              <div className="mt-4 text-sm font-semibold text-zinc-950">{f.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.desc}</p>

              <div className="mt-5 h-1 overflow-hidden rounded-full bg-black/5">
                <motion.div
                  className="h-full"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
                  }}
                  initial={{ width: "22%" }}
                  animate={{ width: ["22%", "68%", "40%", "86%"] }}
                  transition={{ duration: 9, ease, repeat: Infinity }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Security() {
  return (
    <section id="security" className="w-screen bg-white py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="SECURITY"
          title={
            <>
              Your inbox stays <GradientText>yours</GradientText>
            </>
          }
          desc="Designed around secure access patterns and user control."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-12 md:items-stretch">
          <div className="md:col-span-7">
            <GlassCard className="h-full overflow-hidden">
              <div className="border-b border-black/5 px-6 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                  <Lock className="h-4 w-4" style={{ color: BRAND.a }} />
                  Controls & access
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  AutoResolve uses OAuth-based Gmail access and sends email from your account.
                  You can run approval mode for full oversight.
                </p>
              </div>
              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SecurityCard
                    title="Approval mode"
                    desc="Review drafts before anything is sent."
                    icon={<CheckCircle2 className="h-5 w-5" />}
                  />
                  <SecurityCard
                    title="Scoped permissions"
                    desc="Access limited to what’s needed to manage cases."
                    icon={<Shield className="h-5 w-5" />}
                  />
                  <SecurityCard
                    title="Audit-friendly"
                    desc="Every decision maps to a visible email action."
                    icon={<FileText className="h-5 w-5" />}
                  />
                  <SecurityCard
                    title="Revocable access"
                    desc="Disconnect anytime to revoke authorization."
                    icon={<Lock className="h-5 w-5" />}
                  />
                </div>

                <div className="mt-6 rounded-3xl bg-white/70 p-5 ring-1 ring-black/10">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-950">Policy posture</div>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
                      Transparent
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    This product is built to send professional, non-abusive messages and to
                    escalate through legitimate support channels.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Tag>Professional tone</Tag>
                    <Tag>No harassment</Tag>
                    <Tag>Escalate responsibly</Tag>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="md:col-span-5">
            <GlassCard className="h-full overflow-hidden">
              <div className="border-b border-black/5 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-950">Trust checklist</div>
                  <span className="text-xs font-semibold text-zinc-500">Design goals</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  The product experience is built around visibility and control.
                </p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <CheckLine>See every email before it’s sent (optional)</CheckLine>
                  <CheckLine>Clear status + next action at all times</CheckLine>
                  <CheckLine>Case scoped to a single merchant thread</CheckLine>
                  <CheckLine>One-click disconnect</CheckLine>
                </ul>

                <div className="mt-6 rounded-3xl bg-zinc-50 p-5 ring-1 ring-black/10">
                  <div className="text-sm font-semibold text-zinc-950">Why email?</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Email is universal. No special integrations. AutoResolve works wherever a
                    support address exists.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SecurityCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-zinc-50 p-5 ring-1 ring-black/10">
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-black/10"
        style={{
          backgroundImage: `linear-gradient(135deg, ${BRAND.a}14, ${BRAND.b}14, ${BRAND.c}14)`,
        }}
      >
        <span style={{ color: BRAND.a }}>{icon}</span>
      </div>
      <div className="mt-4 text-sm font-semibold text-zinc-950">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</div>
    </div>
  );
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/10">
      <span
        className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl ring-1 ring-black/10"
        style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.a}12, ${BRAND.b}12)` }}
      >
        <CheckCircle2 className="h-4 w-4" style={{ color: BRAND.b }} />
      </span>
      <span className="text-sm font-medium text-zinc-800">{children}</span>
    </li>
  );
}

function Testimonials() {
  const quotes = [
    {
      who: "Ops lead",
      role: "Busy founder",
      text: "I used to write 6–8 emails just to get a fair refund. Now I create a case and the agent does the chasing.",
    },
    {
      who: "Student",
      role: "Subscription-heavy",
      text: "The follow-ups were the hardest part. AutoResolve stays polite but persistent — it got a better outcome than I would.",
    },
    {
      who: "Consultant",
      role: "Always on the move",
      text: "Approval mode is perfect. I can review drafts in seconds, but I’m not stuck babysitting replies.",
    },
  ];

  return (
    <section className="w-screen bg-zinc-50 py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="RESULT"
          title={
            <>
              Built to save time — and win <GradientText>more often</GradientText>
            </>
          }
          desc="Consistency beats exhaustion. The agent never forgets to follow up."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <motion.div
              key={q.who}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.55, ease, delay: i * 0.06 }}
              className="rounded-3xl bg-white/80 p-6 ring-1 ring-black/10 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-950">{q.who}</div>
                <span className="text-xs font-semibold text-zinc-500">{q.role}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-700">“{q.text}”</p>
              <div className="mt-6 h-1 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full"
                  style={{
                    width: `${58 + i * 10}%`,
                    backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Does this work with any company?",
      a: "Yes — if they provide a support email address, AutoResolve can run the negotiation loop through email.",
    },
    {
      q: "Do I have to let it send emails automatically?",
      a: "No. Use approval mode to review drafts before they’re sent. You can also enable full automation per case.",
    },
    {
      q: "What kinds of issues can it handle?",
      a: "Refunds, cancellations, billing disputes, damaged items, and other email-based customer support negotiations.",
    },
    {
      q: "How does it decide what to say next?",
      a: "It classifies replies, tracks state and concessions, and chooses actions like countering offers, requesting escalation, or following up on a schedule.",
    },
  ];

  return (
    <section id="faq" className="w-screen bg-white py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Clear answers. <GradientText>No fluff</GradientText>
            </>
          }
          desc="Everything you need to know before you create your first case."
        />

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <Accordion key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function Accordion({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  return (
    <div className="rounded-3xl bg-zinc-50 ring-1 ring-black/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left"
      >
        <div className="text-sm font-semibold text-zinc-950">{q}</div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-5 w-5 text-zinc-600" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-sm leading-relaxed text-zinc-600">{a}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CTA() {
  return (
    <section id="create" className="relative w-screen overflow-hidden bg-zinc-950 py-16 md:py-24">
      <div
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(255,255,255,.10), transparent 35%), radial-gradient(circle at 80% 20%, rgba(255,255,255,.08), transparent 35%), radial-gradient(circle at 50% 90%, rgba(255,255,255,.06), transparent 40%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 left-[-160px] h-[520px] w-[520px] rounded-full blur-3xl opacity-50"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${BRAND.b}55, transparent 55%), radial-gradient(circle at 70% 60%, ${BRAND.c}40, transparent 60%), radial-gradient(circle at 50% 50%, ${BRAND.a}35, transparent 55%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-48 right-[-180px] h-[560px] w-[560px] rounded-full blur-3xl opacity-45"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${BRAND.a}55, transparent 55%), radial-gradient(circle at 70% 60%, ${BRAND.b}40, transparent 60%), radial-gradient(circle at 50% 50%, ${BRAND.c}35, transparent 55%)`,
        }}
      />

      <Container>
        <div className="grid gap-10 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/15">
              <Sparkles className="h-4 w-4" style={{ color: BRAND.b }} />
              Ready when you are
            </div>
            <h3 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Create a case and let the agent handle the back-and-forth.
            </h3>
            <p className="mt-4 text-pretty text-base leading-relaxed text-white/70">
              You give the details once. AutoResolve runs the workflow until resolution.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_60px_rgba(0,0,0,.35)] transition active:scale-[0.99]"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
                }}
              >
                Create a case
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/15"
              >
                See the workflow
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/65">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                <Shield className="h-4 w-4" style={{ color: BRAND.b }} />
                Works through email
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                <Clock className="h-4 w-4" style={{ color: BRAND.c }} />
                Persistent follow-ups
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                <Bot className="h-4 w-4" style={{ color: BRAND.a }} />
                Approval or auto
              </span>
            </div>
          </div>

          <div className="md:col-span-6">
            <CTADevice />
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-sm text-white/45">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3 transition opacity-90 hover:opacity-100">
              <Logo size={34} className="shrink-0" />
              <div>
                <span className="font-semibold text-white/80">{BRAND.name}</span>
                <span className="block text-xs text-white/45">Autonomous support resolution</span>
              </div>
            </Link>
            <nav className="flex flex-wrap items-center gap-6">
              <a className="transition hover:text-white/70" href="#security">
                Security
              </a>
              <a className="transition hover:text-white/70" href="#features">
                Features
              </a>
              <a className="transition hover:text-white/70" href="#faq">
                FAQ
              </a>
            </nav>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CTADevice() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[40px] opacity-30 blur-2xl"
        style={{
          backgroundImage: `linear-gradient(135deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
        }}
      />
      <div className="relative overflow-hidden rounded-[34px] bg-white/8 ring-1 ring-white/15 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo size={40} className="shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white/90">Case timeline</div>
              <div className="text-xs text-white/50">Live actions</div>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/15">
            In progress
          </span>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-3">
            <ActionRow
              icon={<Mail className="h-4 w-4" />}
              title="Initial email sent"
              meta="09:12"
              accent={BRAND.b}
            />
            <ActionRow
              icon={<MessagesSquare className="h-4 w-4" />}
              title="Merchant replied"
              meta="11:03"
              accent={BRAND.a}
            />
            <ActionRow
              icon={<Wand2 className="h-4 w-4" />}
              title="Counter drafted"
              meta="11:05"
              accent={BRAND.c}
              animated
            />
            <ActionRow
              icon={<Clock className="h-4 w-4" />}
              title="Follow-up scheduled"
              meta="+24h"
              accent={BRAND.b}
            />
          </div>

          <div className="mt-6 rounded-3xl bg-white/8 p-5 ring-1 ring-white/15">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">Draft preview</div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/15">
                Approval
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <div className="h-2 rounded-full bg-white/10" />
              <div className="h-2 w-11/12 rounded-full bg-white/10" />
              <div className="h-2 w-10/12 rounded-full bg-white/10" />
              <div className="h-2 w-9/12 rounded-full bg-white/10" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/15"
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_60px_rgba(0,0,0,.35)] transition active:scale-[0.99]"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
                }}
              >
                Approve & send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  icon,
  title,
  meta,
  accent,
  animated,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  accent: string;
  animated?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white/8 px-4 py-3 ring-1 ring-white/15">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(255,255,255,.10)",
            boxShadow: "0 12px 40px rgba(0,0,0,.30)",
          }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </span>
        <div>
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div className="text-xs text-white/50">{meta}</div>
        </div>
      </div>

      {animated ? (
        <motion.div
          className="h-2 w-12 overflow-hidden rounded-full bg-white/10"
          initial={false}
        >
          <motion.div
            className="h-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
          />
        </motion.div>
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
      )}
    </div>
  );
}

function DemoAnchor() {
  return <div id="demo" className="scroll-mt-24" aria-hidden />;
}

export default function Page() {
  return (
    <div className="min-h-screen w-screen bg-white text-zinc-950">
      <TopNav />
      <Hero />
      <DemoAnchor />
      <HowItWorks />
      <Features />
      <Security />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  );
}
