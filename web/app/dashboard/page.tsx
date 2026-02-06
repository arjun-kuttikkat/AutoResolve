"use client";

// Premium, light-mode dashboard for AutoResolve (ElevenLabs-style).
// Tailwind required. Framer Motion + lucide-react required.
// Drop-in for Next.js App Router: app/dashboard/page.tsx (or any route).

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GeistSans, GeistMono } from "geist/font";
import {
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Filter,
  Gauge,
  HelpCircle,
  Inbox,
  KeyRound,
  Link2,
  ListChecks,
  Lock,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Trash2,
  User,
  Wand2,
  X,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const BRAND = {
  name: "AutoResolve",
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

function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${BRAND.b}55, transparent 55%), radial-gradient(circle at 70% 60%, ${BRAND.c}40, transparent 55%), radial-gradient(circle at 50% 50%, ${BRAND.a}35, transparent 55%)`,
      }}
    />
  );
}

function Noise() {
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

function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-xl ring-1 ring-black/10"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.65))",
        boxShadow: "0 10px 30px rgba(0,0,0,.10)",
      }}
    >
      <svg
        width={Math.max(18, Math.round(size * 0.62))}
        height={Math.max(18, Math.round(size * 0.62))}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M12 36c10-18 18-24 52-28-6 34-14 42-32 48-12 4-22-2-20-20Z"
          fill="url(#g)"
        />
        <defs>
          <linearGradient id="g" x1="12" y1="8" x2="64" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor={BRAND.a} />
            <stop offset="0.5" stopColor={BRAND.b} />
            <stop offset="1" stopColor={BRAND.c} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-black/10 backdrop-blur">
      {children}
    </span>
  );
}

function PillDot({ color }: { color: string }) {
  return <span className="h-2 w-2 rounded-full" style={{ background: color }} />;
}

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/70 ring-1 ring-black/10 backdrop-blur",
        "shadow-[0_20px_80px_rgba(0,0,0,.10)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function SoftCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl bg-white/80 ring-1 ring-black/10", className)}>{children}</div>;
}

function PrimaryButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white",
        "shadow-[0_18px_60px_rgba(0,0,0,.12)] transition active:scale-[0.99]",
        className
      )}
      style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold",
        "bg-white/75 text-zinc-900 ring-1 ring-black/10 backdrop-blur",
        "transition hover:bg-white active:scale-[0.99]",
        className
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  children,
  onClick,
  className,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
        "bg-white/70 ring-1 ring-black/10 backdrop-blur",
        "transition hover:bg-white active:scale-[0.98]",
        className
      )}
    >
      {children}
    </button>
  );
}

function SplitBar({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-1 w-full", className)}
      style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
    />
  );
}

type CaseStatus = "Draft" | "Running" | "Awaiting reply" | "Needs approval" | "Resolved" | "Closed";

type CaseItem = {
  id: string;
  merchant: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  mode: "Approval" | "Auto";
  desired: string;
  lastAction: string;
  nextAction: string;
  offer?: string;
  confidence: number; // 0..100
};

function statusColor(s: CaseStatus) {
  switch (s) {
    case "Running":
      return BRAND.b;
    case "Awaiting reply":
      return BRAND.a;
    case "Needs approval":
      return BRAND.c;
    case "Resolved":
      return "#22C55E";
    case "Closed":
      return "#71717A";
    default:
      return "#111827";
  }
}

function modeBadge(mode: "Approval" | "Auto") {
  return mode === "Auto" ? { label: "Auto", dot: BRAND.b } : { label: "Approval", dot: BRAND.a };
}

function kpiTrendColor(kind: "up" | "down" | "flat") {
  if (kind === "up") return "#22C55E";
  if (kind === "down") return BRAND.c;
  return "#71717A";
}

function formatCaseId(id: string) {
  return `#${id}`;
}

function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(GeistMono.className, className)}>{children}</span>;
}

function Sidebar({ active, onNavigate }: { active: string; onNavigate: (k: string) => void }) {
  const nav = [
    { k: "overview", label: "Overview", icon: Inbox },
    { k: "cases", label: "Cases", icon: ListChecks },
    { k: "inbox", label: "Inbox", icon: Mail },
    { k: "automation", label: "Automation", icon: Bot },
    { k: "security", label: "Security", icon: Shield },
    { k: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden h-[calc(100vh-0px)] w-[300px] shrink-0 border-r border-black/5 bg-white/70 backdrop-blur md:block">
      <div className="relative h-full overflow-hidden">
        <Glow className="-top-28 left-[-160px] h-[380px] w-[380px] opacity-40" />
        <Glow className="bottom-[-180px] right-[-180px] h-[460px] w-[460px] opacity-35" />
        <Noise />

        <div className="relative flex h-full flex-col p-5">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-zinc-950">{BRAND.name}</div>
              <div className="text-[11px] text-zinc-600">Autonomous email resolution</div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-white/70 p-4 ring-1 ring-black/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-600">Workspace</div>
              <Chip>
                <PillDot color={BRAND.b} />
                Active
              </Chip>
            </div>
            <div className="mt-3 text-sm font-semibold text-zinc-950">Personal</div>
            <div className="mt-1 text-xs text-zinc-600">Gmail connected • Approval by default</div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="flex items-center justify-between rounded-2xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-black/7"
              >
                <span className="inline-flex items-center gap-2">
                  <KeyRound className="h-4 w-4" style={{ color: BRAND.a }} />
                  API key
                </span>
                <span className={cn("text-zinc-600", GeistMono.className)}>•••• 4F2A</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-between rounded-2xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-black/7"
              >
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4" style={{ color: BRAND.c }} />
                  Billing
                </span>
                <span className="text-zinc-600">Manage</span>
              </button>
            </div>
          </div>

          <nav className="mt-5 space-y-1">
            {nav.map((it) => {
              const Icon = it.icon;
              const isActive = active === it.k;
              return (
                <button
                  key={it.k}
                  type="button"
                  onClick={() => onNavigate(it.k)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold",
                    "transition",
                    isActive
                      ? "bg-white ring-1 ring-black/10 shadow-[0_14px_50px_rgba(0,0,0,.10)]"
                      : "text-zinc-700 hover:bg-white/70"
                  )}
                >
                  <span className="inline-flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-black/10",
                        isActive ? "bg-white" : "bg-white/70"
                      )}
                      style={{
                        backgroundImage: isActive
                          ? `linear-gradient(135deg, ${BRAND.a}10, ${BRAND.b}10, ${BRAND.c}10)`
                          : undefined,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: isActive ? BRAND.a : "#111827" }} />
                    </span>
                    {it.label}
                  </span>

                  <span className="opacity-0 transition group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-black/10">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-600">Need help?</div>
                <HelpCircle className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-950">Resolution playbooks</div>
              <div className="mt-1 text-xs text-zinc-600">
                Templates for refunds, cancellations, and disputes.
              </div>
              <div className="mt-4 flex gap-2">
                <SecondaryButton className="flex-1 px-0 py-2 text-xs">Open</SecondaryButton>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10"
                  title="Export"
                >
                  <Download className="h-4 w-4 text-zinc-700" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-3xl bg-white/70 p-4 ring-1 ring-black/10 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-black/10 bg-white">
                  <User className="h-4 w-4 text-zinc-700" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-zinc-950">You</div>
                  <div className="text-xs text-zinc-600">Owner</div>
                </div>
              </div>
              <IconButton label="Account">
                <ChevronDown className="h-4 w-4 text-zinc-700" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  query,
  setQuery,
  onCreate,
}: {
  query: string;
  setQuery: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative hidden w-[420px] max-w-[46vw] items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-black/10 backdrop-blur md:flex">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cases, merchants, IDs…"
                className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <span className={cn("rounded-xl bg-black/5 px-2 py-1 text-[11px] font-semibold text-zinc-600", GeistMono.className)}>
                ⌘K
              </span>
            </div>

            <div className="md:hidden">
              <Chip>
                <Sparkles className="h-4 w-4" style={{ color: BRAND.b }} />
                Dashboard
              </Chip>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton label="Notifications">
              <Bell className="h-4 w-4 text-zinc-700" />
            </IconButton>
            <IconButton label="Shortcuts">
              <Sparkles className="h-4 w-4" style={{ color: BRAND.b }} />
            </IconButton>
            <PrimaryButton onClick={onCreate} className="hidden sm:inline-flex">
              Create a case
            </PrimaryButton>
            <IconButton label="Create case" onClick={onCreate} className="sm:hidden">
              <Plus className="h-4 w-4" style={{ color: BRAND.a }} />
            </IconButton>
          </div>
        </div>
      </div>
      <SplitBar />
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  trend,
}: {
  title: string;
  value: string;
  hint: string;
  trend: { kind: "up" | "down" | "flat"; label: string };
}) {
  return (
    <SoftCard className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-600">{title}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
            {value}
          </div>
          <div className="mt-2 text-sm text-zinc-600">{hint}</div>
        </div>

        <span
          className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700"
          title={trend.label}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: kpiTrendColor(trend.kind) }} />
          {trend.label}
        </span>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-black/5">
        <motion.div
          className="h-full"
          style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
          initial={{ width: "18%" }}
          animate={{ width: ["18%", "56%", "34%", "72%", "48%", "86%"] }}
          transition={{ duration: 10, ease, repeat: Infinity }}
        />
      </div>
    </SoftCard>
  );
}

function StatusPill({ status }: { status: CaseStatus }) {
  const c = statusColor(status);
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
      <span className="h-2 w-2 rounded-full" style={{ background: c }} />
      {status}
    </span>
  );
}

function Confidence({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full"
          style={{
            width: `${v}%`,
            backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
          }}
        />
      </div>
      <span className={cn("text-xs font-semibold text-zinc-600", GeistMono.className)}>{v}%</span>
    </div>
  );
}

function CasesTable({
  items,
  selectedId,
  onSelect,
}: {
  items: CaseItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-6 py-5">
        <div>
          <div className="text-sm font-semibold text-zinc-950">Cases</div>
          <div className="mt-1 text-xs text-zinc-600">Active workflows and resolved outcomes.</div>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton className="gap-2 px-4 py-2 text-xs">
            <Filter className="h-4 w-4 text-zinc-700" />
            Filters
          </SecondaryButton>
          <IconButton label="More">
            <MoreHorizontal className="h-4 w-4 text-zinc-700" />
          </IconButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="bg-white/60 text-left text-xs font-semibold text-zinc-600">
              <th className="px-6 py-4">Case</th>
              <th className="px-6 py-4">Merchant</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Mode</th>
              <th className="px-6 py-4">Confidence</th>
              <th className="px-6 py-4">Next action</th>
              <th className="px-6 py-4">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const isActive = selectedId === c.id;
              const mb = modeBadge(c.mode);
              return (
                <tr
                  key={c.id}
                  className={cn(
                    "cursor-pointer border-t border-black/5 bg-white/70 transition hover:bg-white",
                    isActive && "bg-white"
                  )}
                  onClick={() => onSelect(c.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-black/10",
                          isActive ? "bg-white" : "bg-white/70"
                        )}
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${BRAND.a}12, ${BRAND.b}12, ${BRAND.c}12)`,
                        }}
                      >
                        <Mail className="h-4 w-4" style={{ color: BRAND.a }} />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-950">
                          <Mono>{formatCaseId(c.id)}</Mono>
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-600">{c.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-zinc-900">{c.merchant}</div>
                    <div className="mt-0.5 text-xs text-zinc-600">{c.desired}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
                      <span className="h-2 w-2 rounded-full" style={{ background: mb.dot }} />
                      {mb.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Confidence value={c.confidence} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-zinc-900">{c.nextAction}</div>
                    <div className="mt-0.5 text-xs text-zinc-600">Last: {c.lastAction}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn("text-sm font-semibold text-zinc-900", GeistMono.className)}>{c.updatedAt}</div>
                    <div className="mt-0.5 text-xs text-zinc-600">Created {c.createdAt}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-black/5 bg-white/70 px-6 py-4">
        <div className="text-xs font-semibold text-zinc-600">Showing {items.length} cases</div>
        <div className="flex items-center gap-2">
          <IconButton label="Prev">
            <ChevronLeft className="h-4 w-4 text-zinc-700" />
          </IconButton>
          <IconButton label="Next">
            <ChevronRight className="h-4 w-4 text-zinc-700" />
          </IconButton>
        </div>
      </div>
    </GlassCard>
  );
}

function TimelineItem({
  icon,
  title,
  meta,
  desc,
  accent,
  pulse,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  desc: string;
  accent: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="relative">
        <div
          className="grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-black/10 bg-white"
          style={{ boxShadow: "0 14px 50px rgba(0,0,0,.08)" }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {pulse ? (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: `0 0 0 0 ${accent}44` }}
            animate={{ boxShadow: [`0 0 0 0 ${accent}22`, `0 0 0 14px ${accent}00`] }}
            transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-950">{title}</div>
          <div className={cn("text-xs font-semibold text-zinc-500", GeistMono.className)}>{meta}</div>
        </div>
        <div className="mt-1 text-sm leading-relaxed text-zinc-600">{desc}</div>
      </div>
    </div>
  );
}

function CaseDrawer({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item?: CaseItem;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-[560px] overflow-hidden bg-white"
            initial={{ x: 560 }}
            animate={{ x: 0 }}
            exit={{ x: 560 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="relative h-full">
              <Glow className="-top-28 right-[-160px] h-[420px] w-[420px] opacity-45" />
              <Glow className="bottom-[-200px] left-[-200px] h-[520px] w-[520px] opacity-40" />
              <Noise />

              <div className="relative flex h-full flex-col">
                <div className="border-b border-black/5 bg-white/70 px-6 py-5 backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/10"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${BRAND.a}12, ${BRAND.b}12, ${BRAND.c}12)`,
                          }}
                        >
                          <Mail className="h-4 w-4" style={{ color: BRAND.a }} />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-zinc-950">
                            Case <Mono>{item ? formatCaseId(item.id) : "—"}</Mono>
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-600">
                            {item ? `${item.merchant} • ${item.category}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {item ? <StatusPill status={item.status} /> : null}
                        {item ? (
                          <Chip>
                            <PillDot color={modeBadge(item.mode).dot} />
                            {item.mode}
                          </Chip>
                        ) : null}
                        <Chip>
                          <Lock className="h-4 w-4" style={{ color: BRAND.a }} />
                          From your inbox
                        </Chip>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <IconButton label="Copy case ID">
                        <Copy className="h-4 w-4 text-zinc-700" />
                      </IconButton>
                      <IconButton label="Close" onClick={onClose}>
                        <X className="h-4 w-4 text-zinc-700" />
                      </IconButton>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto px-6 py-6">
                  <div className="grid gap-4">
                    <GlassCard className="overflow-hidden">
                      <div className="border-b border-black/5 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-zinc-950">Next action</div>
                          <span className={cn("text-xs font-semibold text-zinc-500", GeistMono.className)}>
                            {item?.updatedAt ?? ""}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-zinc-600">
                          {item?.nextAction ?? ""}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-black/10">
                            <div className="text-xs font-semibold text-zinc-600">Confidence</div>
                            <div className="mt-2">
                              <Confidence value={item?.confidence ?? 0} />
                            </div>
                          </div>
                          <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-black/10">
                            <div className="text-xs font-semibold text-zinc-600">Latest offer</div>
                            <div className="mt-2 text-sm font-semibold text-zinc-950">
                              {item?.offer ?? "No offer detected"}
                            </div>
                            <div className="mt-1 text-xs text-zinc-600">Concessions tracked automatically.</div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          <PrimaryButton className="w-full">
                            Approve & send
                          </PrimaryButton>
                          <div className="grid grid-cols-2 gap-2">
                            <SecondaryButton className="w-full gap-2">
                              <Pencil className="h-4 w-4" />
                              Edit draft
                            </SecondaryButton>
                            <SecondaryButton className="w-full gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Open thread
                            </SecondaryButton>
                          </div>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard className="overflow-hidden">
                      <div className="border-b border-black/5 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-zinc-950">Activity</div>
                          <Chip>
                            <Calendar className="h-4 w-4" style={{ color: BRAND.b }} />
                            Timeline
                          </Chip>
                        </div>
                        <div className="mt-2 text-sm text-zinc-600">
                          Every email action is visible and audit-friendly.
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <TimelineItem
                          icon={<Mail className="h-4 w-4" />}
                          title="Initial email sent"
                          meta="09:12"
                          desc="Refund request + evidence attached."
                          accent={BRAND.b}
                        />
                        <TimelineItem
                          icon={<MessageSquare className="h-4 w-4" />}
                          title="Merchant replied"
                          meta="11:03"
                          desc="Partial refund offered (15%)."
                          accent={BRAND.a}
                        />
                        <TimelineItem
                          icon={<Wand2 className="h-4 w-4" />}
                          title="Counter drafted"
                          meta="11:05"
                          desc="Firm, polite, evidence-based request for full refund."
                          accent={BRAND.c}
                          pulse
                        />
                        <TimelineItem
                          icon={<Clock className="h-4 w-4" />}
                          title="Follow-up scheduled"
                          meta="+24h"
                          desc="If no response, the agent follows up and escalates." 
                          accent={BRAND.b}
                        />
                      </div>
                    </GlassCard>

                    <GlassCard className="overflow-hidden">
                      <div className="border-b border-black/5 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-zinc-950">Draft preview</div>
                          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">
                            Approval
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-zinc-600">
                          What will be sent from your inbox.
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-black/10">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-zinc-600">Subject</div>
                            <span className={cn("text-[11px] font-semibold text-zinc-500", GeistMono.className)}>
                              auto-resolve
                            </span>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-zinc-950">
                            Request for full refund — Order <Mono>#18472</Mono>
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-zinc-700">
                            <p>Hi Support Team,</p>
                            <p>
                              I’m following up regarding Order <Mono>#18472</Mono>. The item arrived damaged and I’m requesting a full refund to the original payment method.
                            </p>
                            <p>
                              I’ve attached photos and order details. Please escalate to a supervisor if needed.
                            </p>
                            <p>Thanks,</p>
                            <p>You</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <SecondaryButton className="gap-2 px-0 py-2 text-xs">
                            <Star className="h-4 w-4" />
                            Save
                          </SecondaryButton>
                          <SecondaryButton className="gap-2 px-0 py-2 text-xs">
                            <Link2 className="h-4 w-4" />
                            Attach
                          </SecondaryButton>
                          <SecondaryButton className="gap-2 px-0 py-2 text-xs">
                            <Trash2 className="h-4 w-4" />
                            Discard
                          </SecondaryButton>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </div>

                <div className="border-t border-black/5 bg-white/70 px-6 py-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-zinc-600">Actions</div>
                    <div className="flex items-center gap-2">
                      <SecondaryButton className="gap-2 px-4 py-2 text-xs">
                        <Bot className="h-4 w-4" style={{ color: BRAND.a }} />
                        Switch mode
                      </SecondaryButton>
                      <SecondaryButton className="gap-2 px-4 py-2 text-xs">
                        <Shield className="h-4 w-4" style={{ color: BRAND.b }} />
                        Guardrails
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function CreateCaseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] bg-white ring-1 ring-black/10"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
          >
            <div className="relative">
              <Glow className="-top-28 left-[-180px] h-[420px] w-[420px] opacity-45" />
              <Glow className="-bottom-32 right-[-220px] h-[520px] w-[520px] opacity-40" />
              <Noise />

              <div className="relative border-b border-black/5 bg-white/70 px-6 py-5 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-950">Create a case</div>
                    <div className="mt-1 text-xs text-zinc-600">
                      Provide the details once. The agent handles the email loop.
                    </div>
                  </div>
                  <IconButton label="Close" onClick={onClose}>
                    <X className="h-4 w-4 text-zinc-700" />
                  </IconButton>
                </div>
              </div>

              <div className="relative p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Merchant" placeholder="ACME Store" icon={<Inbox className="h-4 w-4" />} />
                  <Field label="Order / reference" placeholder="#18472" icon={<CircleDot className="h-4 w-4" />} mono />
                  <Field label="Issue" placeholder="Item arrived damaged" icon={<MessageSquare className="h-4 w-4" />} className="md:col-span-2" />
                  <Field label="Desired outcome" placeholder="Full refund" icon={<CheckCircle2 className="h-4 w-4" />} className="md:col-span-2" />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-12">
                  <SoftCard className="md:col-span-7 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-950">Mode</div>
                      <Chip>
                        <PillDot color={BRAND.a} />
                        Approval
                      </Chip>
                    </div>
                    <div className="mt-3 text-sm text-zinc-600">
                      Review drafts before sending. Switch to Auto per case anytime.
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <ModeChip active label="Approval" desc="Review before send" />
                      <ModeChip label="Auto" desc="Hands-off" />
                    </div>
                  </SoftCard>
                  <SoftCard className="md:col-span-5 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-950">Attachments</div>
                      <SecondaryButton className="gap-2 px-4 py-2 text-xs">
                        <Link2 className="h-4 w-4" />
                        Add
                      </SecondaryButton>
                    </div>
                    <div className="mt-3 rounded-3xl bg-zinc-50 p-4 ring-1 ring-black/10">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-black/10 bg-white"
                          style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.a}10, ${BRAND.b}10)` }}
                        >
                          <Download className="h-4 w-4" style={{ color: BRAND.a }} />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-zinc-950">damage_photos.zip</div>
                          <div className="text-xs text-zinc-600">3 images</div>
                        </div>
                      </div>
                    </div>
                  </SoftCard>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-semibold text-zinc-600">
                    <span className="inline-flex items-center gap-2">
                      <Lock className="h-4 w-4" style={{ color: BRAND.a }} />
                      Sends from your inbox • Approval by default
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton>
                      Create case
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  placeholder,
  icon,
  className,
  mono,
}: {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("rounded-3xl bg-white/80 p-4 ring-1 ring-black/10", className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-zinc-600">{label}</div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-black/10 bg-white">
          <span style={{ color: BRAND.b }}>{icon}</span>
        </span>
      </div>
      <input
        placeholder={placeholder}
        className={cn(
          "mt-3 w-full bg-transparent text-sm font-semibold text-zinc-950 outline-none placeholder:text-zinc-400",
          mono && GeistMono.className
        )}
      />
    </div>
  );
}

function ModeChip({ active, label, desc }: { active?: boolean; label: string; desc: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl p-4 ring-1",
        active
          ? "bg-white ring-black/15 shadow-[0_14px_50px_rgba(0,0,0,.10)]"
          : "bg-white/60 ring-black/10"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950">{label}</div>
        {active ? (
          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">Selected</span>
        ) : null}
      </div>
      <div className="mt-2 text-xs text-zinc-600">{desc}</div>
      {active ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full"
            style={{ width: "62%", backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function RightRail() {
  return (
    <div className="hidden w-[360px] shrink-0 xl:block">
      <div className="sticky top-[84px] space-y-4">
        <GlassCard className="overflow-hidden">
          <div className="border-b border-black/5 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-950">Agent health</div>
              <Chip>
                <PillDot color={"#22C55E"} />
                Stable
              </Chip>
            </div>
            <div className="mt-2 text-sm text-zinc-600">Guardrails active. Tone stays professional.</div>
          </div>
          <div className="p-5 space-y-3">
            <MiniRow icon={<Gauge className="h-4 w-4" />} title="Strategy" value="Firm, evidence-based" />
            <MiniRow icon={<Clock className="h-4 w-4" />} title="Follow-ups" value="24h cadence" />
            <MiniRow icon={<Shield className="h-4 w-4" />} title="Policy" value="Respectful escalation" />
            <div className="mt-2 rounded-3xl bg-white/70 p-4 ring-1 ring-black/10">
              <div className="text-xs font-semibold text-zinc-600">Automation</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-950">Approval default</div>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700">On</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
                <motion.div
                  className="h-full"
                  style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "62%", "48%", "86%"] }}
                  transition={{ duration: 7.5, ease, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <div className="border-b border-black/5 px-5 py-4">
            <div className="text-sm font-semibold text-zinc-950">Shortcuts</div>
            <div className="mt-2 text-sm text-zinc-600">Fast actions for daily ops.</div>
          </div>
          <div className="p-5 grid gap-2">
            <Shortcut icon={<Plus className="h-4 w-4" />} label="New case" />
            <Shortcut icon={<Mail className="h-4 w-4" />} label="Open inbox" />
            <Shortcut icon={<Bot className="h-4 w-4" />} label="Automation rules" />
            <Shortcut icon={<Settings className="h-4 w-4" />} label="Settings" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function MiniRow({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white/70 px-4 py-3 ring-1 ring-black/10">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-black/10 bg-white">
          <span style={{ color: BRAND.a }}>{icon}</span>
        </span>
        <div>
          <div className="text-xs font-semibold text-zinc-600">{title}</div>
          <div className="text-sm font-semibold text-zinc-950">{value}</div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </div>
  );
}

function Shortcut({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-between rounded-3xl bg-white/70 px-4 py-3 ring-1 ring-black/10 transition hover:bg-white"
    >
      <span className="inline-flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-black/10 bg-white">
          <span style={{ color: BRAND.b }}>{icon}</span>
        </span>
        <span className="text-sm font-semibold text-zinc-950">{label}</span>
      </span>
      <ExternalLink className="h-4 w-4 text-zinc-400" />
    </button>
  );
}

function EmptyState() {
  return (
    <GlassCard className="p-10">
      <div className="mx-auto max-w-lg text-center">
        <div
          className="mx-auto grid h-14 w-14 place-items-center rounded-3xl ring-1 ring-black/10"
          style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.a}14, ${BRAND.b}14, ${BRAND.c}14)` }}
        >
          <Bot className="h-6 w-6" style={{ color: BRAND.a }} />
        </div>
        <div className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">No cases yet</div>
        <div className="mt-2 text-sm leading-relaxed text-zinc-600">
          Create your first case. The agent will draft, send, follow up, and escalate until resolution.
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <PrimaryButton>Create a case</PrimaryButton>
          <SecondaryButton className="gap-2">
            <Sparkles className="h-4 w-4" style={{ color: BRAND.b }} />
            View demo
          </SecondaryButton>
        </div>
      </div>
    </GlassCard>
  );
}

export default function DashboardPage() {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<string | undefined>("18472");

  const cases: CaseItem[] = useMemo(
    () => [
      {
        id: "18472",
        merchant: "ACME Store",
        category: "Refund • Damaged delivery",
        createdAt: "Feb 03",
        updatedAt: "11:05",
        status: "Needs approval",
        mode: "Approval",
        desired: "Full refund",
        lastAction: "Offer detected: 15%",
        nextAction: "Approve counter email",
        offer: "15% partial refund",
        confidence: 86,
      },
      {
        id: "22910",
        merchant: "Streamify",
        category: "Subscription • Cancellation",
        createdAt: "Jan 28",
        updatedAt: "09:41",
        status: "Awaiting reply",
        mode: "Auto",
        desired: "Cancel + prorated refund",
        lastAction: "Follow-up sent",
        nextAction: "Escalate if no response",
        offer: "No offer",
        confidence: 72,
      },
      {
        id: "31107",
        merchant: "FlyFast",
        category: "Billing • Charge correction",
        createdAt: "Jan 20",
        updatedAt: "Yesterday",
        status: "Running",
        mode: "Approval",
        desired: "Charge reversal",
        lastAction: "Evidence requested",
        nextAction: "Attach statement",
        offer: "Credit voucher offered",
        confidence: 61,
      },
      {
        id: "09744",
        merchant: "ShopNova",
        category: "Refund • Late delivery",
        createdAt: "Jan 14",
        updatedAt: "Jan 16",
        status: "Resolved",
        mode: "Auto",
        desired: "Full refund",
        lastAction: "Refund confirmed",
        nextAction: "Close case",
        offer: "Full refund approved",
        confidence: 94,
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      [c.id, c.merchant, c.category, c.status, c.desired].some((x) => x.toLowerCase().includes(q))
    );
  }, [cases, query]);

  const selectedItem = useMemo(() => filtered.find((c) => c.id === selected) ?? cases[0], [filtered, selected, cases]);

  return (
    <div
      className={cn(
        "min-h-screen w-screen bg-gradient-to-b from-white via-white to-zinc-50 text-zinc-950",
        GeistSans.className,
        "antialiased"
      )}
      style={{ fontFeatureSettings: "'cv02','cv03','cv04','cv11'" }}
    >
      <div className="flex w-screen">
        <Sidebar active={active} onNavigate={setActive} />

        <main className="min-w-0 flex-1">
          <TopBar query={query} setQuery={setQuery} onCreate={() => setCreateOpen(true)} />

          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
            <div className="relative overflow-hidden rounded-[36px] bg-white/70 p-6 ring-1 ring-black/10 backdrop-blur md:p-8">
              <Glow className="-top-24 left-[-200px] h-[520px] w-[520px] opacity-35" />
              <Glow className="-bottom-28 right-[-220px] h-[560px] w-[560px] opacity-30" />
              <Noise />

              <div className="relative flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-xs font-semibold text-zinc-700">
                      <Sparkles className="h-4 w-4" style={{ color: BRAND.b }} />
                      Premium dashboard
                    </div>
                    <div className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
                      Resolution ops, <GradientText>at a glance</GradientText>
                    </div>
                    <div className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
                      Monitor active negotiations, approve drafts, and see next actions — without living in your inbox.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton className="gap-2">
                      <Mail className="h-4 w-4" style={{ color: BRAND.a }} />
                      Open inbox
                    </SecondaryButton>
                    <SecondaryButton className="gap-2">
                      <Shield className="h-4 w-4" style={{ color: BRAND.b }} />
                      Guardrails
                    </SecondaryButton>
                    <PrimaryButton onClick={() => setCreateOpen(true)}>Create a case</PrimaryButton>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-9">
                    <div className="grid gap-4 md:grid-cols-3">
                      <KpiCard
                        title="Active cases"
                        value={`${cases.filter((c) => ["Running", "Awaiting reply", "Needs approval"].includes(c.status)).length}`}
                        hint="Workflows in progress"
                        trend={{ kind: "up", label: "+12%" }}
                      />
                      <KpiCard
                        title="Avg time saved"
                        value="3.8h"
                        hint="Per case (est.)"
                        trend={{ kind: "up", label: "+0.6h" }}
                      />
                      <KpiCard
                        title="Resolved rate"
                        value="71%"
                        hint="Last 30 days"
                        trend={{ kind: "flat", label: "steady" }}
                      />
                    </div>

                    <div className="mt-4">
                      {filtered.length ? (
                        <CasesTable
                          items={filtered}
                          selectedId={selected}
                          onSelect={(id) => {
                            setSelected(id);
                            setDrawerOpen(true);
                          }}
                        />
                      ) : (
                        <EmptyState />
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <RightRail />

                    <div className="xl:hidden">
                      <GlassCard className="overflow-hidden">
                        <div className="border-b border-black/5 px-5 py-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-zinc-950">Agent health</div>
                            <Chip>
                              <PillDot color={"#22C55E"} />
                              Stable
                            </Chip>
                          </div>
                          <div className="mt-2 text-sm text-zinc-600">Guardrails active. Tone stays professional.</div>
                        </div>
                        <div className="p-5 space-y-3">
                          <MiniRow icon={<Gauge className="h-4 w-4" />} title="Strategy" value="Firm, evidence-based" />
                          <MiniRow icon={<Clock className="h-4 w-4" />} title="Follow-ups" value="24h cadence" />
                          <MiniRow icon={<Shield className="h-4 w-4" />} title="Policy" value="Respectful escalation" />
                        </div>
                      </GlassCard>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <SoftCard className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-950">Inbox status</div>
                      <Chip>
                        <PillDot color={BRAND.b} />
                        Connected
                      </Chip>
                    </div>
                    <div className="mt-3 text-sm text-zinc-600">Gmail OAuth active. Sending from your account.</div>
                    <div className="mt-4 flex items-center justify-between rounded-3xl bg-black/5 p-4">
                      <div>
                        <div className="text-xs font-semibold text-zinc-600">Unread threads</div>
                        <div className={cn("mt-1 text-lg font-semibold text-zinc-950", GeistMono.className)}>4</div>
                      </div>
                      <IconButton label="Open inbox">
                        <ExternalLink className="h-4 w-4 text-zinc-700" />
                      </IconButton>
                    </div>
                  </SoftCard>

                  <SoftCard className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-950">Approval queue</div>
                      <Chip>
                        <PillDot color={BRAND.c} />
                        1 pending
                      </Chip>
                    </div>
                    <div className="mt-3 text-sm text-zinc-600">Drafts waiting for your sign-off.</div>
                    <div className="mt-4 flex gap-2">
                      <SecondaryButton className="flex-1 gap-2">
                        <Pencil className="h-4 w-4" />
                        Review
                      </SecondaryButton>
                      <PrimaryButton className="flex-1">Approve all</PrimaryButton>
                    </div>
                  </SoftCard>

                  <SoftCard className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-950">Guardrails</div>
                      <Chip>
                        <PillDot color={BRAND.a} />
                        On
                      </Chip>
                    </div>
                    <div className="mt-3 text-sm text-zinc-600">Professional tone, no harassment, policy references.</div>
                    <div className="mt-4 flex items-center justify-between rounded-3xl bg-black/5 p-4">
                      <div className="text-xs font-semibold text-zinc-700">Escalate responsibly</div>
                      <CheckCircle2 className="h-5 w-5" style={{ color: "#22C55E" }} />
                    </div>
                  </SoftCard>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <CaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} item={selectedItem} />
      <CreateCaseModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
