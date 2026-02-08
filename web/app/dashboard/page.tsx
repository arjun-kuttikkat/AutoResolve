"use client";

// Premium, light-mode dashboard for AutoResolve (ElevenLabs-style).
// Tailwind required. Framer Motion + lucide-react required.
// Drop-in for Next.js App Router: app/dashboard/page.tsx (or any route).

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GeistSans, GeistMono } from "geist/font";
import {
  getGmailAuthUrl,
  getAuthStatus,
  getThreads,
  getReplies,
  approveReply,
  rejectReply,
  syncEmails,
  getUserMode,
  setUserMode,
  disconnectGmail,
  generateReplyForThread,
  getGuardrails,
  setGuardrails,
  getCases,
  getNotifications,
  createNotification,
  type NotificationPayload,
  type Case,
} from "@/lib/api";
import { Logo } from "@/components/Logo";
import { ReplySettingsDrawer } from "@/components/inbox/ReplySettingsDrawer";
import { ThreadDetailView } from "@/components/inbox/ThreadDetailView";
import { CaseList } from "@/components/inbox/CaseList";
import { PotentialCaseList, type PotentialCaseItem } from "@/components/inbox/PotentialCaseList";
import { CreateCaseModal } from "@/components/inbox/CreateCaseModal";
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
  TestTube,
} from "lucide-react";

// --- DEMO DATA ---
const DEMO_THREADS = [
  {
    id: "demo-1",
    threadId: "demo-thread-1",
    subject: "Re: Refund request for damaged item",
    status: "pending",
    updatedAt: new Date(),
    from: "Support (Acme)",
    preview: "Hi, we are reviewing your request. Please send a photo...",
    extraction: {
      suggestedContext: "Suggested outcome: Full Refund",
      merchant: "ACME Store",
      orderRef: "#18472",
      issue: "Item arrived damaged, requesting refund",
      outcome: "Full refund to original payment method",
    },
    caseId: null,
    metrics: { sent: 2, received: 1, total: 3 },
  },
  {
    id: "demo-2",
    threadId: "demo-thread-2",
    subject: "Order #998877 update: Item defect reported",
    status: "pending",
    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
    from: "Nike Orders",
    preview: "We received your report about the stitching defect...",
    extraction: {
      merchant: "Nike",
      orderRef: "#998877",
      issue: "Stitching defect on sneakers",
      outcome: "Exchange or store credit",
      suggestedContext: "I prefer an exchange for the same size.",
    },
    caseId: null,
    metrics: { sent: 1, received: 1, total: 2 },
  },
  {
    id: "demo-3",
    threadId: "demo-thread-3",
    subject: "Receipt for Premium Individual (Possible Duplicate)",
    status: "replied",
    updatedAt: new Date(Date.now() - 172800000), // 2 days ago
    from: "Spotify",
    preview: "Here is your receipt for the month. Total: $11.99...",
    extraction: {
      merchant: "Spotify",
      orderRef: "N/A",
      issue: "Possible duplicate charge",
      outcome: "Clarification or refund",
      suggestedContext: "Check if this is a duplicate charge.",
    },
    caseId: null,
    metrics: { sent: 0, received: 1, total: 1 },
  },
];

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

function Sidebar({
  active,
  onNavigate,
  userId,
  connected,
  userMode,
  onConnectGmail,
  onModeChange,
  onEnterDemo,
  isDemo,
}: {
  active: string;
  onNavigate: (k: string) => void;
  userId?: string | null;
  connected?: boolean;
  userMode?: "auto" | "approval";
  onConnectGmail?: () => void;
  onModeChange?: (mode: "auto" | "approval") => void;
  onEnterDemo?: () => void;
  isDemo?: boolean;
}) {
  const nav = [
    { k: "overview", label: "Overview", icon: Gauge },
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
            <Logo size={34} />
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
            <div className="mt-1 text-xs text-zinc-600">
              {connected
                ? `Gmail connected • ${userMode === "auto" ? "Auto" : "Approval"} mode`
                : "Connect Gmail to start"}
            </div>

            {connected && onModeChange ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onModeChange("approval")}
                  className={cn(
                    "flex-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition",
                    userMode === "approval"
                      ? "bg-white ring-1 ring-black/10 text-zinc-950"
                      : "bg-black/5 text-zinc-600 hover:bg-black/10"
                  )}
                >
                  Approval
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("auto")}
                  className={cn(
                    "flex-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition",
                    userMode === "auto"
                      ? "bg-white ring-1 ring-black/10 text-zinc-950"
                      : "bg-black/5 text-zinc-600 hover:bg-black/10"
                  )}
                >
                  Auto
                </button>
              </div>
            ) : null}

            {!connected && !isDemo && onConnectGmail ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onConnectGmail}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b})` }}
                >
                  <Mail className="h-4 w-4" />
                  Connect Gmail
                </button>
              </div>
            ) : null}

            {!connected && !isDemo && onEnterDemo ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={onEnterDemo}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                >
                  <TestTube className="h-4 w-4" />
                  Try Demo Mode
                </button>
              </div>
            ) : null}

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
  notifications = [],
  notificationsOpen,
  setNotificationsOpen,
  onClearNotifications,
  onNotificationClick,
  bellPulse,
}: {
  query: string;
  setQuery: (v: string) => void;
  notifications?: NotificationPayload[];
  notificationsOpen?: boolean;
  setNotificationsOpen?: (open: boolean) => void;
  onClearNotifications?: () => void;
  onNotificationClick?: (n: NotificationPayload) => void;
  bellPulse?: boolean;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative flex w-full max-w-md items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-black/10 backdrop-blur">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inbox…"
                className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen?.(!notificationsOpen)}
              className={cn(
                "group relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/10 hover:bg-white transition",
                bellPulse && "animate-pulse ring-indigo-500 ring-2"
              )}
            >
              <Bell className={cn("h-5 w-5 text-zinc-600 transition", bellPulse && "text-indigo-600")} />
              {notifications.length > 0 && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-14 z-50 w-80 origin-top-right overflow-hidden rounded-3xl bg-white shadow-[0_20px_40px_-5px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 bg-zinc-50/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearNotifications?.();
                        }}
                        className="text-xs font-semibold text-zinc-400 hover:text-zinc-600"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <div className="rounded-full bg-zinc-50 p-3 mb-2">
                          <Bell className="h-5 w-5 text-zinc-300" />
                        </div>
                        <p className="text-sm font-medium text-zinc-900">All caught up</p>
                        <p className="text-xs text-zinc-500">No new notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-50">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => onNotificationClick?.(n)}
                            className="w-full px-4 py-3 text-left transition hover:bg-zinc-50 flex gap-3 group"
                          >
                            <div className="mt-1 flex-shrink-0">
                              {n.type === "autonomous_reply" || n.type === "reply_sent" ? (
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              ) : n.type === "support_detected" ? (
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <Bot className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                  <Settings className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 transition">{n.title}</p>
                              <p className="text-xs text-zinc-500 line-clamp-2">{n.message || n.subject}</p>
                              <p className="mt-1 text-[10px] text-zinc-400">{new Date(n.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <SplitBar />
    </div>
  );
}


const USER_ID_KEY = "autoresolve_user_id";
const SEEN_SENT_THREADS_KEY_PREFIX = "autoresolve_seen_sent_";
const AGGRESSIVE_POLLING_KEY = "autoresolve_aggressive_polling";
const POLL_AGGRESSIVE_MS = 5000;
const POLL_NORMAL_MS = 30000;
const AUTO_SEND_COUNTDOWN_SEC = 10;

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState("inbox");
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const [apiThreads, setApiThreads] = useState<Array<{ id: string; threadId: string; subject: string | null; status: string | null; caseId: string | null; metrics?: { sent: number; received: number; total: number }; updatedAt: Date | null }>>([]);
  const [apiReplies, setApiReplies] = useState<Array<{ id: string; generatedContent: string; status: string; confidenceScore: number | null }>>([]);
  const [userMode, setUserModeState] = useState<"auto" | "approval">("approval");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Case Management State
  const [activeCaseTab, setActiveCaseTab] = useState<"potential" | "active">("potential");
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  const [disconnecting, setDisconnecting] = useState(false);
  const [visibleThreadCount, setVisibleThreadCount] = useState(10);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");

  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyModalThreadId, setReplyModalThreadId] = useState<string | null>(null);
  const [replyModalPhase, setReplyModalPhase] = useState<"generating" | "sent" | "draft" | "takeover" | "sending" | "error">("generating");
  const [replyModalDraft, setReplyModalDraft] = useState("");
  const [replyModalReplyId, setReplyModalReplyId] = useState("");
  const [replyModalSubject, setReplyModalSubject] = useState<string | null>(null);
  const [replyModalEditedContent, setReplyModalEditedContent] = useState("");
  const [replyModalError, setReplyModalError] = useState<string | null>(null);
  const replyAbortRef = useRef<AbortController | null>(null);
  const previousThreadIdsRef = useRef<Set<string>>(new Set());
  const seenRepliedThreadIdsRef = useRef<Set<string>>(new Set());
  const [seenRepliedThreadIds, setSeenRepliedThreadIds] = useState<Set<string>>(new Set());

  const [aggressivePolling, setAggressivePolling] = useState(false);
  const [replyCountdownSec, setReplyCountdownSec] = useState<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [guardrailsTrigger, setGuardrailsTrigger] = useState("");
  const [guardrailsReply, setGuardrailsReply] = useState("");
  const [guardrailsSaving, setGuardrailsSaving] = useState(false);

  const [guardrailsLoaded, setGuardrailsLoaded] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);
  const prevNotificationCountRef = useRef(0);

  // Create Case Modal State
  const [createCaseModalOpen, setCreateCaseModalOpen] = useState(false);
  const [createCaseThreadId, setCreateCaseThreadId] = useState<string | null>(null);

  // Tracking for notifications
  const threadTimestampsRef = useRef<Map<string, number>>(new Map());
  const initialLoadCompleteRef = useRef(false);

  // New Workflow State
  const [threadDetailId, setThreadDetailId] = useState<string | null>(null);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState<{ tone: string; context: string; images: string[] } | null>(null);

  useEffect(() => {
    const uid = searchParams.get("userId");
    const conn = searchParams.get("connected") === "1";
    const err = searchParams.get("error");
    if (uid) {
      setUserId(uid);
      try {
        localStorage.setItem(USER_ID_KEY, uid);
      } catch {
        //
      }
      if (conn) setConnected(true);
    } else {
      try {
        const stored = localStorage.getItem(USER_ID_KEY);
        if (stored) setUserId(stored);
      } catch {
        //
      }
    }
    const hint = searchParams.get("hint");
    if (err === "google_not_configured") setErrorBanner("Backend Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env");
    else if (err === "database_unreachable") {
      setErrorBanner(
        "Database unreachable (ENOTFOUND). Use the connection pooler URL: Supabase Dashboard → Project Settings → Database → Connection string → URI → copy the Session or Transaction pooler URI (host aws-0-REGION.pooler.supabase.com). Set that as DATABASE_URL in backend/.env. Or try another network (e.g. phone hotspot)."
      );
    } else if (err === "oauth_failed") {
      setErrorBanner(
        hint === "redirect_uri_mismatch"
          ? "Gmail connection failed: redirect URI mismatch. In backend/.env set GOOGLE_REDIRECT_URI to exactly what’s in Google Cloud Console → Credentials → your OAuth client → Authorized redirect URIs (e.g. http://localhost:3001/api/auth/gmail/callback)."
          : "Gmail connection failed. Try again. Check the backend terminal for the error."
      );
    } else if (err === "missing_code") setErrorBanner("OAuth callback missing code. Try connecting again.");
  }, [searchParams]);

  useEffect(() => {
    if (!userId) return;
    getAuthStatus(userId)
      .then((r) => setConnected(r.connected))
      .catch(() => setConnected(false));
    getUserMode(userId)
      .then((r) => setUserModeState(r.mode))
      .catch(() => { });
  }, [userId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AGGRESSIVE_POLLING_KEY);
      setAggressivePolling(raw === "1");
    } catch {
      //
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(SEEN_SENT_THREADS_KEY_PREFIX + userId);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) {
          const set = new Set(arr);
          seenRepliedThreadIdsRef.current = set;
          setSeenRepliedThreadIds(set);
        }
      }
    } catch {
      //
    }
  }, [userId]);

  const markThreadSentSeen = (threadId: string) => {
    setSeenRepliedThreadIds((prev) => {
      const next = new Set(prev).add(threadId);
      seenRepliedThreadIdsRef.current = next;
      try {
        if (userId) localStorage.setItem(SEEN_SENT_THREADS_KEY_PREFIX + userId, JSON.stringify([...next]));
      } catch {
        //
      }
      return next;
    });
  };

  useEffect(() => {
    if ((!userId || !connected) && !demoMode) return;
    const pollMs = aggressivePolling ? POLL_AGGRESSIVE_MS : POLL_NORMAL_MS;

    const fetchData = () => {
      if (demoMode) {
        // Demo Mode Simulation
        setApiThreads(DEMO_THREADS);
        return;
      }

      if (aggressivePolling) {
        syncEmails(userId!).catch(() => { }).finally(() => {
          getThreads(userId!)
            .then((r) => {
              const threads = r.threads;
              const timestampMap = threadTimestampsRef.current;

              // Detect new threads (Potential Case) or updates (New Reply)
              // Only notify if potential cases/replies arrive AFTER the initial load.

              threads.forEach((t) => {
                const lastUpdate = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
                const prevUpdate = timestampMap.get(t.threadId);

                if (!prevUpdate) {
                  // New Thread Found
                  timestampMap.set(t.threadId, lastUpdate);
                  if (initialLoadCompleteRef.current) {
                    addNotification({
                      type: "support_detected",
                      title: "New Potential Case",
                      message: t.subject ?? "New email requiring attention",
                      subject: t.subject ?? "No Subject",
                      threadId: t.threadId
                    });
                  }
                } else if (lastUpdate > prevUpdate) {
                  // Thread Updated (New Reply)
                  timestampMap.set(t.threadId, lastUpdate);
                  // Check if it's from a user/merchant (not us)
                  if (t.status === 'pending' || t.status === 'human_needed') {
                    addNotification({
                      type: "human_intervention",
                      title: t.caseId ? "New Reply on Case" : "New Reply on Potential Case",
                      message: t.subject ?? "New message received",
                      subject: t.subject ?? "No Subject",
                      threadId: t.threadId
                    });
                  }
                }
              });

              initialLoadCompleteRef.current = true;
              setApiThreads(threads);

              // Check for sent replies logic (keep existing checks if needed, but remove auto-modal)
              const replied = threads.filter((t) => t.status === "replied");
              const seen = seenRepliedThreadIdsRef.current;
              const newReplied = replied.find((t) => !seen.has(t.threadId));
              if (newReplied) {
                markThreadSentSeen(newReplied.threadId);
                // Notify instead of modal
                addNotification({
                  type: "reply_sent",
                  title: "Reply Sent",
                  message: "A reply was successfully sent.",
                  subject: newReplied.subject ?? "Reply Sent",
                  threadId: newReplied.threadId
                });
              }
            })
            .catch(() => { });
          getReplies(userId!).then((r) => setApiReplies(r.replies)).catch(() => { });
          getCases(userId!).then((r) => setActiveCases(r.cases)).catch(() => { });
        });
      } else {
        getThreads(userId!)
          .then((r) => {
            const threads = r.threads;
            const timestampMap = threadTimestampsRef.current;

            threads.forEach((t) => {
              const lastUpdate = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
              const prevUpdate = timestampMap.get(t.threadId);

              if (!prevUpdate) {
                // New Thread Found
                timestampMap.set(t.threadId, lastUpdate);
                if (initialLoadCompleteRef.current) {
                  addNotification({
                    type: "support_detected",
                    title: "New Potential Case",
                    message: t.subject ?? "New email requiring attention",
                    subject: t.subject ?? "No Subject",
                    threadId: t.threadId
                  });
                }
              } else if (lastUpdate > prevUpdate) {
                // Thread Updated (New Reply)
                timestampMap.set(t.threadId, lastUpdate);
                if (t.status === 'pending' || t.status === 'human_needed') {
                  addNotification({
                    type: "human_intervention",
                    title: t.caseId ? "New Reply on Case" : "New Reply on Potential Case",
                    message: t.subject ?? "New message received",
                    subject: t.subject ?? "No Subject",
                    threadId: t.threadId
                  });
                }
              }
            });

            initialLoadCompleteRef.current = true;
            setApiThreads(threads);
            const seen = seenRepliedThreadIdsRef.current;
            const newReplied = threads.find((t) => t.status === "replied" && !seen.has(t.threadId));
            if (newReplied) {
              markThreadSentSeen(newReplied.threadId);
              addNotification({
                type: "reply_sent",
                title: "Reply Sent",
                message: "A reply was successfully sent.",
                subject: newReplied.subject ?? "Reply Sent",
                threadId: newReplied.threadId
              });
            }
          })
          .catch(() => { });
        getCases(userId!).then((r) => setActiveCases(r.cases)).catch(() => { });
      }
    };

    fetchData();
    const t = setInterval(fetchData, pollMs);
    return () => clearInterval(t);
  }, [userId, connected, aggressivePolling, demoMode]);

  useEffect(() => {
    if (replyCountdownSec == null || replyCountdownSec <= 0 || countdownIntervalRef.current) return;
    countdownIntervalRef.current = setInterval(() => {
      setReplyCountdownSec((s) => {
        if (s == null || s <= 0) return null;
        if (s <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { };
  }, [replyCountdownSec]);

  useEffect(() => {
    if (replyCountdownSec === 0 && replyModalPhase === "draft" && userMode === "auto" && userId && replyModalReplyId) {
      setReplyModalPhase("sending");
      setReplyCountdownSec(null);
      approveReply(userId, replyModalReplyId)
        .then(() => {
          setReplyModalPhase("sent");
          markThreadSentSeen(replyModalThreadId!);
          getReplies(userId!).then((r) => setApiReplies(r.replies)).catch(() => { });
        })
        .catch((e) => {
          setReplyModalPhase("draft");
          setReplyModalError(e instanceof Error ? e.message : String(e));
        });
    }
  }, [replyCountdownSec, replyModalPhase, userMode, userId, replyModalReplyId, replyModalThreadId]);

  useEffect(() => {
    if (active === "guardrails" && userId && !guardrailsLoaded) {
      getGuardrails(userId)
        .then((r) => {
          setGuardrailsTrigger(r.triggerDescription ?? "");
          setGuardrailsReply(r.replyInstructions ?? "");
          setGuardrailsLoaded(true);
        })
        .catch(() => setGuardrailsLoaded(true));
    }
  }, [active, userId, guardrailsLoaded]);

  const handleConnectGmail = () => {
    const url = getGmailAuthUrl(userId ?? undefined);
    window.location.href = url;
  };

  const refetchNotifications = () => {
    if (!userId) return;
    getNotifications(userId)
      .then((r) => {
        setNotifications(r.notifications);
        if (r.notifications.length > prevNotificationCountRef.current) {
          setBellPulse(true);
          setTimeout(() => setBellPulse(false), 800);
        }
        prevNotificationCountRef.current = r.notifications.length;
      })
      .catch(() => { });
  };

  useEffect(() => {
    if (!userId || !connected) return;
    refetchNotifications();
    // Poll for notifications
    const t = setInterval(refetchNotifications, 10000);
    return () => clearInterval(t);
  }, [userId, connected]);

  const handleSyncInbox = async () => {
    if (!userId) return;
    setSyncing(true);
    setErrorBanner(null);
    setSyncModalOpen(true);
    setSyncStatus("syncing");
    setSyncMessage("Syncing inbox… pulling emails from Gmail.");
    try {
      const result = await syncEmails(userId);
      let { threads } = await getThreads(userId);
      setApiThreads(threads);
      setVisibleThreadCount(10);
      const { replies } = await getReplies(userId);
      setApiReplies(replies);
      // Worker processes messages in background; refetch after a short delay so threads can appear
      if (threads.length === 0) {
        setSyncMessage("Sync complete. Processing emails…");
        await new Promise((r) => setTimeout(r, 3000));
        const refetch = await getThreads(userId);
        threads = refetch.threads;
        setApiThreads(threads);
      }
      setSyncStatus("success");
      setSyncMessage(result?.message ?? `Sync complete. ${threads.length} thread${threads.length === 1 ? "" : "s"} loaded.`);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Sync failed.";
      setSyncStatus("error");
      setSyncMessage(msg);
      setErrorBanner(msg);
    } finally {
      setSyncing(false);
    }
  };

  const openReplyModalWithSent = (threadId: string, subject: string | null) => {
    setReplyModalOpen(true);
    setReplyModalThreadId(threadId);
    setReplyModalPhase("sent");
    setReplyModalSubject(subject);
    setReplyModalError(null);
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalEditedContent("");
    setReplyCountdownSec(null);
    markThreadSentSeen(threadId);
  };

  const handleManualGenerate = async (threadId: string, config: { tone: string; context: string; images: string[]; mode?: "approval" | "auto" }) => {
    if (!userId && !demoMode) return;

    // Close other views
    setSettingsDrawerOpen(false);
    setThreadDetailId(null);

    // If Auto mode, we might want to skip the draft review modal or set a flag
    // For now, we'll just pass it to the backend or use it to determine behavior
    const isAuto = config.mode === "auto";

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    replyAbortRef.current?.abort();
    replyAbortRef.current = new AbortController();
    const signal = replyAbortRef.current.signal;

    setReplyModalOpen(true);
    setReplyModalThreadId(threadId);
    setReplyModalPhase("generating"); // Will show spinner
    setReplyModalError(null);
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalSubject(null);
    setReplyModalEditedContent("");
    setReplyCountdownSec(null); // No auto-send in manual mode

    try {
      let result;
      if (demoMode) {
        // Simulate API call for demo
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = {
          sent: false,
          draft: `Subject: Re: ${DEMO_THREADS.find((t) => t.threadId === threadId)?.subject ?? "Support Request"}\n\nHi there,\n\nThank you for reaching out. Based on your request for a ${config.context || "resolution"}, we have processed it accordingly.\n\nBest regards,\nAutoResolve Team`,
          replyId: "demo-reply-1",
          subject: "Re: Support Request",
          threadId: threadId,
        };
      } else {
        result = await generateReplyForThread(userId!, threadId, {
          signal,
          tone: config.tone,
          userContext: config.context,
          imageContext: config.images,
          takeOver: isAuto,
        });
      }

      if (result.sent) {
        setReplyModalPhase("sent");
        markThreadSentSeen(threadId);
      } else {
        setReplyModalPhase("draft");
        setReplyModalDraft(result.draft);
        setReplyModalReplyId(result.replyId);
        setReplyModalSubject(result.subject);
      }
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setReplyModalPhase("error");
      setReplyModalError(e instanceof Error ? e.message : String(e));
    }
  };

  const openReplyModalForNewEmail = (threadId: string) => {
    if (!userId) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    replyAbortRef.current?.abort();
    replyAbortRef.current = new AbortController();
    const signal = replyAbortRef.current.signal;
    setReplyModalOpen(true);
    setReplyModalThreadId(threadId);
    setReplyModalPhase("generating");
    setReplyModalError(null);
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalSubject(null);
    setReplyModalEditedContent("");
    setReplyCountdownSec(AUTO_SEND_COUNTDOWN_SEC);
    generateReplyForThread(userId, threadId, { signal })
      .then((result) => {
        if (result.sent) {
          setReplyModalPhase("sent");
          setReplyCountdownSec(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          markThreadSentSeen(threadId);
        } else {
          setReplyModalPhase("draft");
          setReplyModalDraft(result.draft);
          setReplyModalReplyId(result.replyId);
          setReplyModalSubject(result.subject);
        }
      })
      .catch((e) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setReplyModalPhase("error");
        setReplyModalError(e instanceof Error ? e.message : String(e));
        setReplyCountdownSec(null);
      });
  };

  const openReplyModal = (threadId: string) => {
    if (!userId) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    replyAbortRef.current?.abort();
    replyAbortRef.current = new AbortController();
    const signal = replyAbortRef.current.signal;
    setReplyModalOpen(true);
    setReplyModalThreadId(threadId);
    setReplyModalPhase("generating");
    setReplyModalError(null);
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalSubject(null);
    setReplyModalEditedContent("");
    setReplyCountdownSec(AUTO_SEND_COUNTDOWN_SEC);
    generateReplyForThread(userId, threadId, { signal })
      .then((result) => {
        if (result.sent) {
          setReplyModalPhase("sent");
          setReplyCountdownSec(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          markThreadSentSeen(threadId);
        } else {
          setReplyModalPhase("draft");
          setReplyModalDraft(result.draft);
          setReplyModalReplyId(result.replyId);
          setReplyModalSubject(result.subject);
        }
      })
      .catch((e) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setReplyModalPhase("error");
        setReplyModalError(e instanceof Error ? e.message : String(e));
        setReplyCountdownSec(null);
      });
  };

  const handleTakeOverDuringGenerate = () => {
    if (!userId || !replyModalThreadId) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setReplyCountdownSec(null);
    replyAbortRef.current?.abort();
    setReplyModalPhase("generating");
    setReplyModalError(null);
    generateReplyForThread(userId, replyModalThreadId, { takeOver: true })
      .then((result) => {
        if (result.sent) return;
        setReplyModalPhase("draft");
        setReplyModalDraft(result.draft);
        setReplyModalReplyId(result.replyId);
        setReplyModalSubject(result.subject);
      })
      .catch((e) => {
        setReplyModalPhase("error");
        setReplyModalError(e instanceof Error ? e.message : String(e));
      });
  };

  const closeReplyModal = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setReplyCountdownSec(null);
    setReplyModalOpen(false);
    setReplyModalThreadId(null);
    setReplyModalPhase("generating");
    setReplyModalError(null);
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalEditedContent("");
  };

  const handleTakeOver = () => {
    setReplyModalPhase("takeover");
    setReplyModalEditedContent(replyModalDraft);
  };

  const handleSendEditedReply = async () => {
    if (!userId || !replyModalReplyId) return;
    setReplyModalPhase("sending");
    setReplyModalError(null);
    try {
      await approveReply(userId, replyModalReplyId, replyModalEditedContent);
      setReplyModalPhase("sent");
      getReplies(userId).then((r) => setApiReplies(r.replies)).catch(() => { });
    } catch (e) {
      setReplyModalPhase("takeover");
      setReplyModalError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSaveGuardrails = async () => {
    if (!userId) return;
    setGuardrailsSaving(true);
    try {
      await setGuardrails(userId, {
        triggerDescription: guardrailsTrigger,
        replyInstructions: guardrailsReply,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setGuardrailsSaving(false);
    }
  };

  const addNotification = (n: Omit<NotificationPayload, "id" | "timestamp">) => {
    if (!userId) return;
    createNotification(userId, n)
      .then((item) => {
        setNotifications((prev) => [item, ...prev]);
        setBellPulse(true);
        setTimeout(() => setBellPulse(false), 800);
      })
      .catch(() => { });
  };

  const openThreadForHumanIntervention = (threadId: string, reason?: string | null) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setReplyCountdownSec(null);
    setReplyModalOpen(true);
    setReplyModalThreadId(threadId);
    // "takeover" allows the user to manually edit/send.
    // We don't have "human_input" phase or extra context states in this MVP version.
    setReplyModalPhase("takeover");
    setReplyModalError(reason ?? "Human intervention needed."); // Show reason as error/message
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalSubject(null);
    setReplyModalEditedContent("");
  };

  const handleNotificationClick = (n: NotificationPayload) => {
    setNotificationsOpen(false);
    // Logic for redirection
    if (n.type === "support_detected") {
      setActiveCaseTab("potential");
      // If we have a threadId, open the reply modal (draft generation)
      if (n.threadId) openReplyModal(n.threadId);
    } else if (n.type === "autonomous_reply" || n.type === "reply_sent") {
      setActiveCaseTab("potential"); // or active? usually potential if not a case yet.
      if (n.threadId) {
        // Just show thread detail? Or open reply modal in "sent" state?
        // openReplyModalWithSent exists?
        // I don't see openReplyModalWithSent in step 212 view.
        // I only see openReplyModal and openReplyModalForNewEmail.
        // I'll check for openReplyModalWithSent in step 166 (feb-8 code) vs mine.
        // Mine (Step 212) doesn't show it.
        // I'll just open the thread detail view.
        setThreadDetailId(n.threadId);
      }
    } else if (n.type === "human_intervention") {
      setActiveCaseTab("active"); // Likely active or high priority
      if (n.threadId) openThreadForHumanIntervention(n.threadId, n.message);
    }
  };

  const handleModeChange = async (mode: "auto" | "approval") => {
    if (!userId) return;
    setUserModeState(mode);
    try {
      await setUserMode(userId, mode);
    } catch (e) {
      console.error(e);
      setUserModeState(userMode);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!userId) return;
    setDisconnecting(true);
    setErrorBanner(null);
    try {
      await disconnectGmail(userId);
      try {
        localStorage.removeItem(USER_ID_KEY);
      } catch {
        //
      }
      setUserId(null);
      setConnected(false);
      setApiThreads([]);
      setApiReplies([]);
      setActive("inbox");
    } catch (e) {
      console.error(e);
      setErrorBanner(e instanceof Error ? e.message : "Disconnect failed.");
    } finally {
      setDisconnecting(false);
    }
  };

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apiThreads;
    return apiThreads.filter(
      (t) =>
        (t.subject ?? "").toLowerCase().includes(q) ||
        (t.threadId ?? "").toLowerCase().includes(q) ||
        (t.status ?? "").toLowerCase().includes(q)
    );
  }, [apiThreads, query]);

  const threadsToShow = filteredThreads.slice(0, visibleThreadCount);
  const hasMoreThreads = filteredThreads.length > visibleThreadCount;

  useEffect(() => {
    setVisibleThreadCount(10);
  }, [query]);

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
        <Sidebar
          active={active}
          onNavigate={setActive}
          userId={userId}
          connected={connected}
          userMode={userMode}
          onConnectGmail={handleConnectGmail}
          onModeChange={(m) => {
            if (userId && !demoMode) setUserMode(userId, m).then(() => setUserModeState(m));
            else setUserModeState(m); // Demo/optimistic
          }}
          isDemo={demoMode}
          onEnterDemo={() => {
            setDemoMode(true);
            setConnected(true); // Fake connection status for UI
            setUserId("demo-user");
          }}
        />
        <main className="min-w-0 flex-1">
          <TopBar
            query={query}
            setQuery={setQuery}
            notifications={notifications}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            onClearNotifications={() => setNotifications([])}
            onNotificationClick={handleNotificationClick}
            bellPulse={bellPulse}
          />

          {errorBanner ? (
            <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6">
              <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <span className="text-sm font-semibold text-amber-900">{errorBanner}</span>
                <button
                  type="button"
                  onClick={() => setErrorBanner(null)}
                  className="rounded-lg p-1 text-amber-700 hover:bg-amber-100"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
            <div className="relative overflow-hidden rounded-[36px] bg-white/70 p-6 ring-1 ring-black/10 backdrop-blur md:p-8">
              <Glow className="-top-24 left-[-200px] h-[520px] w-[520px] opacity-35" />
              <Glow className="-bottom-28 right-[-220px] h-[560px] w-[560px] opacity-30" />
              <Noise />

              <div className="relative flex flex-col gap-6">
                {active === "inbox" ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Inbox</h1>
                        <p className="mt-1 text-sm text-zinc-600">
                          {connected && userId
                            ? "Manage your ongoing cases and new potential leads."
                            : "Connect Gmail and sync to load your emails."}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {connected && userId ? (
                          <button
                            type="button"
                            onClick={handleSyncInbox}
                            disabled={syncing}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white ring-1 ring-black/10 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                          >
                            <Mail className="h-4 w-4" />
                            {syncing ? "Syncing…" : "Sync"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {!connected ? (
                      <GlassCard className="p-10 text-center">
                        <Mail className="mx-auto h-12 w-12 text-zinc-400" />
                        <p className="mt-4 text-lg font-semibold text-zinc-950">Connect Gmail to see your inbox</p>
                        <p className="mt-2 text-sm text-zinc-600">Click Connect Gmail in the sidebar, then Sync inbox to pull your emails.</p>
                      </GlassCard>
                    ) : (
                      <div className="space-y-6">
                        {/* Tabs */}
                        <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl w-fit">
                          <button
                            onClick={() => setActiveCaseTab("potential")}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-semibold transition",
                              activeCaseTab === "potential"
                                ? "bg-white shadow-sm text-zinc-900"
                                : "text-zinc-600 hover:text-zinc-900"
                            )}
                          >
                            Potential Cases
                            {apiThreads.filter(t => !t.caseId).length > 0 && (
                              <span className="ml-2 bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full text-xs">
                                {apiThreads.filter(t => !t.caseId).length}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => setActiveCaseTab("active")}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-semibold transition",
                              activeCaseTab === "active"
                                ? "bg-white shadow-sm text-zinc-900"
                                : "text-zinc-600 hover:text-zinc-900"
                            )}
                          >
                            Active Cases
                            {activeCases.length > 0 && (
                              <span className="ml-2 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-xs">
                                {activeCases.length}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Content */}
                        {activeCaseTab === "potential" ? (
                          <PotentialCaseList
                            threads={apiThreads
                              .filter(t => !t.caseId)
                              .map(t => ({
                                ...t,
                                updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
                                metrics: t.metrics || { sent: 0, received: 0, total: 0 }
                              }))
                            }
                            onRaiseCase={(threadId) => {
                              setCreateCaseThreadId(threadId);
                              setCreateCaseModalOpen(true);
                            }}
                            onOpenThread={(threadId) => {
                              setThreadDetailId(threadId);
                            }}
                          />
                        ) : (
                          <CaseList
                            cases={activeCases}
                            onOpenCase={(caseId) => {
                              // For now, allow opening the thread associated with the case?
                              // Or we need a case detail view.
                              // The plan says "Open Full Detail View".
                              // We'll assume we can find the thread for this case or open a case view.
                              // MVP: Open thread if we can find it, otherwise just log.
                              // Ideally we need getThreadByCaseId or store threadId in activeCases.
                              // activeCases usually has case info.
                              // Let's check activeCases data. It has `id`.
                              // For MVP I'll filter threads to find one with this caseId.
                              const thread = apiThreads.find(t => t.caseId === caseId);
                              if (thread) {
                                setThreadDetailId(thread.threadId);
                              }
                            }}
                          />
                        )}
                      </div>
                    )}
                  </>
                ) : active === "approval" ? (
                  <>
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Approval queue</h1>
                      <p className="mt-1 text-sm text-zinc-600">Drafts waiting for your sign-off.</p>
                    </div>
                    {connected && userId && apiReplies.length > 0 ? (
                      <div className="space-y-3">
                        {apiReplies.map((r) => (
                          <GlassCard key={r.id} className="p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <p className="min-w-0 flex-1 text-sm text-zinc-700 whitespace-pre-wrap">
                                {r.generatedContent}
                              </p>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!userId) return;
                                    try {
                                      await approveReply(userId, r.id);
                                      setApiReplies((prev) => prev.filter((x) => x.id !== r.id));
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!userId) return;
                                    try {
                                      await rejectReply(userId, r.id);
                                      setApiReplies((prev) => prev.filter((x) => x.id !== r.id));
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="rounded-xl bg-black/10 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-black/15"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    ) : (
                      <GlassCard className="p-10 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-zinc-400" />
                        <p className="mt-4 text-lg font-semibold text-zinc-950">No drafts pending</p>
                        <p className="mt-2 text-sm text-zinc-600">
                          {connected ? "Draft replies will appear here when in Approval mode." : "Connect Gmail to get started."}
                        </p>
                      </GlassCard>
                    )}
                  </>
                ) : active === "guardrails" ? (
                  <>
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Guardrails</h1>
                      <p className="mt-1 text-sm text-zinc-600">
                        Control when the agent triggers and how replies are written.
                      </p>
                    </div>

                    <div
                      className={cn(
                        "rounded-3xl overflow-hidden bg-white/70 ring-1 ring-black/10 backdrop-blur",
                        "shadow-[0_20px_80px_rgba(0,0,0,.10)]"
                      )}
                    >
                      <div className="border-b border-black/5 px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-black/10"
                            style={{
                              background: `linear-gradient(135deg, ${BRAND.a}18, ${BRAND.b}18)`,
                            }}
                          >
                            <Shield className="h-6 w-6" style={{ color: BRAND.a }} />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-zinc-950">When to trigger & reply style</div>
                            <div className="mt-0.5 text-xs text-zinc-600">
                              Leave blank to reply to all inbound emails. Use instructions to tailor tone and content.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6 p-6">
                        <div>
                          <label className="block text-sm font-semibold text-zinc-800">
                            When to trigger auto-reply
                          </label>
                          <p className="mt-1 text-xs text-zinc-500">
                            Describe when the agent should respond. Empty = reply to all. Support-style detection: questions, refunds, account issues, complaints, feedback requesting a response, or your own criteria below.
                          </p>
                          <textarea
                            value={guardrailsTrigger}
                            onChange={(e) => setGuardrailsTrigger(e.target.value)}
                            placeholder="e.g. Only respond to emails that look like customer support requests or questions about orders, refunds, or account issues."
                            className="mt-2 w-full rounded-2xl border-0 bg-white/80 px-4 py-3 text-sm text-zinc-800 ring-1 ring-black/10 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-zinc-800">
                            Reply style & instructions
                          </label>
                          <p className="mt-1 text-xs text-zinc-500">
                            Adjust tone, length, and what to include in generated replies.
                          </p>
                          <textarea
                            value={guardrailsReply}
                            onChange={(e) => setGuardrailsReply(e.target.value)}
                            placeholder="e.g. Be concise and friendly. Always include a clear next step. Sign off with first name only."
                            className="mt-2 w-full rounded-2xl border-0 bg-white/80 px-4 py-3 text-sm text-zinc-800 ring-1 ring-black/10 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                            rows={4}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveGuardrails}
                          disabled={guardrailsSaving}
                          className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                          style={{ background: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b})` }}
                        >
                          {guardrailsSaving ? "Saving…" : "Save guardrails"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Settings</h1>
                      <p className="mt-1 text-sm text-zinc-600">Manage your account and Gmail connection.</p>
                    </div>

                    <GlassCard className="overflow-hidden mb-6">
                      <div className="border-b border-black/5 px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/10"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${BRAND.b}18, ${BRAND.a}18)`,
                            }}
                          >
                            <Clock className="h-5 w-5" style={{ color: BRAND.b }} />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-zinc-950">Aggressive mode</div>
                            <div className="mt-0.5 text-xs text-zinc-600">
                              When ON: poll Gmail every 5s and sync new emails. When OFF: poll every 30s.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !aggressivePolling;
                              setAggressivePolling(next);
                              try {
                                localStorage.setItem(AGGRESSIVE_POLLING_KEY, next ? "1" : "0");
                              } catch {
                                //
                              }
                            }}
                            className={cn(
                              "ml-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                              aggressivePolling
                                ? "bg-emerald-500/20 text-emerald-800 ring-1 ring-emerald-500/40"
                                : "bg-zinc-100 text-zinc-700 ring-1 ring-black/10"
                            )}
                          >
                            {aggressivePolling ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard className="overflow-hidden">
                      <div className="border-b border-black/5 px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/10"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${BRAND.a}14, ${BRAND.b}14)`,
                            }}
                          >
                            <Mail className="h-5 w-5" style={{ color: BRAND.a }} />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-zinc-950">Gmail</div>
                            <div className="mt-0.5 text-xs text-zinc-600">
                              {connected
                                ? "Your Gmail account is connected. You can disconnect below."
                                : "Connect Gmail from the sidebar to sync and send emails."}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        {connected && userId ? (
                          <button
                            type="button"
                            onClick={handleDisconnectGmail}
                            disabled={disconnecting}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200 disabled:opacity-50"
                          >
                            {disconnecting ? "Disconnecting…" : "Disconnect Gmail"}
                          </button>
                        ) : (
                          <p className="text-sm text-zinc-600">Gmail is not connected.</p>
                        )}
                      </div>
                    </GlassCard>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div >

      <AnimatePresence>
        {syncModalOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSyncModalOpen(false)}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 shadow-xl"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/10"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${BRAND.a}14, ${BRAND.b}14)`,
                      }}
                    >
                      <Mail className="h-5 w-5" style={{ color: BRAND.a }} />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-zinc-950">
                        {syncStatus === "syncing" ? "Syncing inbox" : syncStatus === "error" ? "Sync failed" : "Sync complete"}
                      </div>
                      <div className="mt-1 text-sm text-zinc-600">{syncMessage}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSyncModalOpen(false)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-black/5 hover:text-zinc-700"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {(syncStatus === "success" || syncStatus === "error") && (
                  <button
                    type="button"
                    onClick={() => setSyncModalOpen(false)}
                    className="mt-4 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
        {replyModalOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReplyModal}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[min(480px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: `0 25px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)`,
              }}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-30"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.a}08, ${BRAND.b}08, ${BRAND.c}06)`,
                }}
              />
              <div className="relative p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    {replyCountdownSec != null && replyCountdownSec > 0 && (replyModalPhase === "generating" || replyModalPhase === "draft") && (
                      <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-black/5">
                        <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
                        <span className="text-sm font-semibold tabular-nums text-zinc-700">
                          {userMode === "auto"
                            ? `Sending in ${replyCountdownSec}s`
                            : `Take over within ${replyCountdownSec}s`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${BRAND.a}22, ${BRAND.b}22)`,
                          boxShadow: `0 0 0 1px rgba(0,0,0,0.06)`,
                        }}
                      >
                        <Bot className="h-5 w-5" style={{ color: BRAND.a }} />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-950">
                          {replyModalPhase === "generating" && "Generating reply…"}
                          {replyModalPhase === "sending" && "Sending…"}
                          {replyModalPhase === "sent" && "Sent"}
                          {replyModalPhase === "draft" && "Draft ready"}
                          {replyModalPhase === "takeover" && "Edit & send"}
                          {replyModalPhase === "error" && "Error"}
                        </div>
                        {replyModalSubject && replyModalPhase !== "generating" && replyModalPhase !== "sending" && (
                          <div className="mt-0.5 truncate text-xs text-zinc-600">{replyModalSubject}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeReplyModal}
                    className="rounded-xl p-2 text-zinc-500 hover:bg-white/60 hover:text-zinc-700 transition"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {(replyModalPhase === "generating" || replyModalPhase === "sending") && (
                  <div className="mt-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white/60 ring-1 ring-black/5">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b})` }}
                          initial={{ width: "20%" }}
                          animate={{ width: ["20%", "85%", "20%"] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        {replyModalPhase === "generating" ? "Creating reply and checking safety…" : "Sending via Gmail…"}
                      </p>
                    </div>
                    {replyModalPhase === "generating" && (
                      <button
                        type="button"
                        onClick={handleTakeOverDuringGenerate}
                        className="w-full rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 hover:bg-white/50 hover:text-zinc-800"
                      >
                        Take over — edit before sending
                      </button>
                    )}
                  </div>
                )}

                {replyModalPhase === "sent" && (
                  <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl bg-emerald-500/10 px-6 py-8 ring-1 ring-emerald-500/20">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.1 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30"
                    >
                      <motion.div
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
                        className="text-emerald-600"
                      >
                        <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
                      </motion.div>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center text-base font-semibold text-emerald-800"
                    >
                      Reply sent
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center text-sm text-emerald-700"
                    >
                      Your reply was sent automatically.
                    </motion.p>
                  </div>
                )}

                {(replyModalPhase === "draft" || replyModalPhase === "takeover") && (
                  <div className="mt-5 space-y-4">
                    {replyModalPhase === "draft" ? (
                      <>
                        <div className="max-h-40 overflow-y-auto rounded-2xl bg-white/70 p-4 text-sm text-zinc-700 whitespace-pre-wrap ring-1 ring-black/5">
                          {replyModalDraft}
                        </div>
                        <button
                          type="button"
                          onClick={handleTakeOver}
                          className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition shadow-lg hover:opacity-95"
                          style={{ background: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b})` }}
                        >
                          Take over — edit & send
                        </button>
                      </>
                    ) : (
                      <>
                        <textarea
                          value={replyModalEditedContent}
                          onChange={(e) => setReplyModalEditedContent(e.target.value)}
                          className="w-full max-h-48 rounded-2xl border-0 bg-white/80 p-4 text-sm text-zinc-800 ring-1 ring-black/10 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                          placeholder="Edit your reply…"
                          rows={6}
                        />
                        {replyModalError && (
                          <p className="text-sm text-red-600">{replyModalError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={closeReplyModal}
                            className="flex-1 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSendEditedReply}
                            disabled={!replyModalEditedContent.trim()}
                            className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                            style={{ background: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b})` }}
                          >
                            Send
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {replyModalPhase === "error" && (
                  <div className="mt-5 space-y-4">
                    <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                      {replyModalError}
                    </p>
                    <button
                      type="button"
                      onClick={closeReplyModal}
                      className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      Close
                    </button>
                  </div>
                )}

                {replyModalPhase === "sent" && (
                  <button
                    type="button"
                    onClick={closeReplyModal}
                    className="mt-4 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
      <ThreadDetailView
        threadId={threadDetailId}
        userId={userId}
        onClose={() => setThreadDetailId(null)}
        initialExtraction={
          (apiThreads.find((t) => t.threadId === threadDetailId) as any)?.extraction ??
          (demoMode ? (DEMO_THREADS.find((t) => t.threadId === threadDetailId) as any)?.extraction : null)
        }
      />

      <ReplySettingsDrawer
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        extractionData={
          demoMode
            ? (DEMO_THREADS.find((t) => t.threadId === threadDetailId)?.extraction as any)
            : null
        }
        onGenerate={async (config) => {
          if (!threadDetailId) return;

          // Convert files to base64
          const base64Images = await Promise.all(
            config.images.map(
              (file) =>
                new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                })
            )
          );

          handleManualGenerate(threadDetailId, {
            tone: config.tone,
            context: config.context,
            images: base64Images,
            mode: config.mode,
          });
        }}
      />

      {/* Create Case Modal */}
      <AnimatePresence>
        {createCaseModalOpen && userId && createCaseThreadId && (
          <CreateCaseModal
            userId={userId}
            threadId={createCaseThreadId}
            onClose={() => {
              setCreateCaseModalOpen(false);
              setCreateCaseThreadId(null);
            }}
            onCaseCreated={(mode) => {
              if (userId) {
                // Refresh data
                getCases(userId).then(r => setActiveCases(r.cases)).catch(() => { });
                getThreads(userId).then(r => setApiThreads(r.threads)).catch(() => { });

                // Handle Mode
                if (mode === "manual") {
                  // Open Control Panel (ReplySettingsDrawer)
                  setThreadDetailId(createCaseThreadId);
                  setSettingsDrawerOpen(true);
                } else {
                  // Auto Mode: Immediately trigger draft generation
                  // We need to simulate "New Email" flow but for this existing thread that just became a case
                  openReplyModalForNewEmail(createCaseThreadId);
                }
              }
            }}
          />
        )}
      </AnimatePresence>
    </div >
  );
}
