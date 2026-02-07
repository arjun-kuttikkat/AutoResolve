"use client";

// Premium, light-mode dashboard for AutoResolve (ElevenLabs-style).
// Tailwind required. Framer Motion + lucide-react required.
// Drop-in for Next.js App Router: app/dashboard/page.tsx (or any route).

import React, { Fragment, useMemo, useState, useEffect, useRef } from "react";
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
  getNotifications,
  createNotification,
} from "@/lib/api";
import { Logo } from "@/components/Logo";
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
}: {
  active: string;
  onNavigate: (k: string) => void;
  userId?: string | null;
  connected?: boolean;
  userMode?: "auto" | "approval";
  onConnectGmail?: () => void;
  onModeChange?: (mode: "auto" | "approval") => void;
}) {
  const nav = [
    { k: "inbox", label: "Inbox", icon: Mail },
    { k: "approval", label: "Approval queue", icon: ListChecks },
    { k: "guardrails", label: "Guardrails", icon: Shield },
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

            {!connected && onConnectGmail ? (
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
  notifications,
  notificationsOpen,
  setNotificationsOpen,
  onClearNotifications,
  onLoadMoreNotifications,
  onNotificationOpenThread,
  notificationsHasMore,
  notificationsLoading,
  bellPulse: bellPulseVal = false,
}: {
  query: string;
  setQuery: (v: string) => void;
  notifications: Array<{ id: string; type: string; title: string; message?: string; subject?: string; threadId?: string; timestamp: number }>;
  notificationsOpen: boolean;
  setNotificationsOpen: (v: boolean) => void;
  onClearNotifications?: () => void;
  onLoadMoreNotifications?: () => void;
  onNotificationOpenThread?: (threadId: string, notification?: { type: string; message?: string }) => void;
  notificationsHasMore?: boolean;
  notificationsLoading?: boolean;
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
                className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div className="relative shrink-0">
            <motion.button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-black/10 backdrop-blur transition hover:bg-white",
                bellPulseVal && "ring-2 ring-rose-400"
              )}
              aria-label="Notifications"
              animate={bellPulseVal ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Bell className="h-5 w-5 text-zinc-600" />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {notifications.length > 99 ? "99+" : notifications.length}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full z-50 mt-2 w-[min(380px,92vw)] overflow-hidden rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/10 backdrop-blur"
                  >
                    <div className="border-b border-black/5 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Notifications</span>
                      {notifications.length > 0 && onClearNotifications && (
                        <button
                          type="button"
                          onClick={onClearNotifications}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-zinc-500">
                          No notifications yet
                        </div>
                      ) : (
                        <ul className="divide-y divide-black/5">
                          {notifications.map((n) => (
                            <motion.li
                              key={n.id}
                              initial={{ opacity: 0, x: 12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.25 }}
                              className="px-4 py-3"
                            >
                              <div className="flex gap-3">
                                {n.type === "autonomous_reply" && (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                                    <Bot className="h-4 w-4" />
                                  </span>
                                )}
                                {n.type === "reply_sent" && (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600">
                                    <Mail className="h-4 w-4" />
                                  </span>
                                )}
                                {n.type === "support_detected" && (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                                    <MessageSquare className="h-4 w-4" />
                                  </span>
                                )}
                                {n.type === "human_intervention" && (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
                                    <User className="h-4 w-4" />
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-zinc-900">{n.title}</p>
                                  {n.subject && (
                                    <p className="mt-0.5 truncate text-xs text-zinc-500">{n.subject}</p>
                                  )}
                                  {n.message && (
                                    <p className="mt-0.5 text-xs text-zinc-600">{n.message}</p>
                                  )}
                                  <p className="mt-1 text-[10px] text-zinc-400">
                                    {new Date(n.timestamp).toLocaleString()}
                                  </p>
                                  {n.type === "human_intervention" && n.threadId && onNotificationOpenThread && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNotificationsOpen(false);
                                        onNotificationOpenThread(n.threadId!, n);
                                      }}
                                      className="mt-2 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-500/20"
                                    >
                                      Open thread
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                      {notificationsHasMore && onLoadMoreNotifications && (
                        <div className="border-t border-black/5 p-3">
                          <button
                            type="button"
                            onClick={onLoadMoreNotifications}
                            disabled={notificationsLoading}
                            className="w-full rounded-xl bg-black/5 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-black/10 disabled:opacity-50"
                          >
                            {notificationsLoading ? "Loading…" : "Load more"}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
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
const NOTIFICATIONS_PAGE_SIZE = 10;
const POLL_AGGRESSIVE_MS = 5000;
const POLL_NORMAL_MS = 30000;
const AUTO_SEND_COUNTDOWN_SEC = 10;

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [active, setActive] = useState("inbox");
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [apiThreads, setApiThreads] = useState<Array<{ id: string; threadId: string; subject: string | null; status: string | null }>>([]);
  const [apiReplies, setApiReplies] = useState<Array<{ id: string; generatedContent: string; status: string; confidenceScore: number | null }>>([]);
  const [userMode, setUserModeState] = useState<"auto" | "approval">("approval");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [visibleThreadCount, setVisibleThreadCount] = useState(10);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");

  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyModalThreadId, setReplyModalThreadId] = useState<string | null>(null);
  const [replyModalPhase, setReplyModalPhase] = useState<"generating" | "sent" | "draft" | "takeover" | "sending" | "error" | "needs_human" | "human_input">("generating");
  const [replyModalNeedsHumanReason, setReplyModalNeedsHumanReason] = useState<string | null>(null);
  const [replyModalContext, setReplyModalContext] = useState("");
  const [replyModalDraft, setReplyModalDraft] = useState("");
  const [replyModalReplyId, setReplyModalReplyId] = useState("");
  const [replyModalSubject, setReplyModalSubject] = useState<string | null>(null);
  const [replyModalEditedContent, setReplyModalEditedContent] = useState("");
  const [replyModalError, setReplyModalError] = useState<string | null>(null);
  const replyAbortRef = useRef<AbortController | null>(null);
  const previousThreadIdsRef = useRef<Set<string>>(new Set());
  const initialPollDoneRef = useRef(false);
  const seenRepliedThreadIdsRef = useRef<Set<string>>(new Set());
  const [seenRepliedThreadIds, setSeenRepliedThreadIds] = useState<Set<string>>(new Set());

  const [aggressivePolling, setAggressivePolling] = useState(false);
  const [replyCountdownSec, setReplyCountdownSec] = useState<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [guardrailsTrigger, setGuardrailsTrigger] = useState("");
  const [guardrailsReply, setGuardrailsReply] = useState("");
  const [guardrailsSaving, setGuardrailsSaving] = useState(false);
  const [guardrailsLoaded, setGuardrailsLoaded] = useState(false);

  type NotificationType = "autonomous_reply" | "reply_sent" | "support_detected" | "human_intervention";
  type NotificationItem = {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    subject?: string;
    threadId?: string;
    timestamp: number;
  };
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsHasMore, setNotificationsHasMore] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsOffset, setNotificationsOffset] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);
  const prevNotificationCountRef = useRef(0);
  const addNotification = (n: Omit<NotificationItem, "id" | "timestamp">) => {
    if (!userId) return;
    createNotification(userId, {
      type: n.type,
      title: n.title,
      message: n.message,
      subject: n.subject,
    })
      .then((item) => {
        setNotifications((prev) => {
          const next = [item, ...prev];
          if (next.length > prevNotificationCountRef.current) {
            setBellPulse(true);
            setTimeout(() => setBellPulse(false), 800);
          }
          prevNotificationCountRef.current = next.length;
          return next;
        });
      })
      .catch(() => {});
  };
  const loadMoreNotifications = () => {
    if (!userId || notificationsLoading) return;
    setNotificationsLoading(true);
    getNotifications(userId, NOTIFICATIONS_PAGE_SIZE, notificationsOffset)
      .then((r) => {
        setNotifications((prev) => [...prev, ...r.notifications]);
        setNotificationsOffset((o) => o + r.notifications.length);
        setNotificationsHasMore(r.hasMore);
      })
      .catch(() => {})
      .finally(() => setNotificationsLoading(false));
  };
  const clearNotifications = () => {
    setNotifications([]);
    setNotificationsOffset(0);
    setNotificationsHasMore(false);
    prevNotificationCountRef.current = 0;
  };

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
      .catch(() => {});
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

  const refetchNotifications = () => {
    if (!userId) return;
    getNotifications(userId, NOTIFICATIONS_PAGE_SIZE, 0)
      .then((r) => {
        setNotifications(r.notifications);
        setNotificationsOffset(r.notifications.length);
        setNotificationsHasMore(r.hasMore);
        prevNotificationCountRef.current = r.notifications.length;
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!userId || !connected) return;
    refetchNotifications();
  }, [userId, connected]);

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
    if (!userId || !connected) return;
    initialPollDoneRef.current = false;
  }, [userId, connected]);

  useEffect(() => {
    if (!userId || !connected) return;
    const pollMs = aggressivePolling ? POLL_AGGRESSIVE_MS : POLL_NORMAL_MS;
    const fetchData = () => {
      const doFetch = () => {
        if (aggressivePolling) {
          syncEmails(userId!).catch(() => {}).finally(() => {
            getThreads(userId!)
              .then((r) => {
                const threads = r.threads;
                const prevIds = previousThreadIdsRef.current;
                const isFirstPoll = !initialPollDoneRef.current;
                if (isFirstPoll) {
                  initialPollDoneRef.current = true;
                  previousThreadIdsRef.current = new Set(threads.map((t) => t.threadId));
                  setApiThreads(threads);
                  const replied = threads.filter((t) => t.status === "replied");
                  const seen = seenRepliedThreadIdsRef.current;
                  const newReplied = replied.find((t) => !seen.has(t.threadId));
                  if (newReplied) {
                    markThreadSentSeen(newReplied.threadId);
                    setTimeout(() => openReplyModalWithSent(newReplied.threadId, newReplied.subject ?? null), 150);
                  }
                  return;
                }
                const newThreads = threads.filter((t) => !prevIds.has(t.threadId));
                previousThreadIdsRef.current = new Set(threads.map((t) => t.threadId));
                setApiThreads(threads);
                const replied = threads.filter((t) => t.status === "replied");
                const seen = seenRepliedThreadIdsRef.current;
                const newReplied = replied.find((t) => !seen.has(t.threadId));
                if (newReplied) {
                  markThreadSentSeen(newReplied.threadId);
                  setTimeout(() => openReplyModalWithSent(newReplied.threadId, newReplied.subject ?? null), 150);
                } else if (newThreads.length > 0) {
                  const pending = newThreads.find((t) => t.status === "pending" || t.status === "processing");
                  const toOpen = pending ?? newThreads[0];
                  setTimeout(() => openReplyModalForNewEmail(toOpen.threadId, toOpen.subject ?? null), 150);
                }
              })
              .catch(() => {});
            getReplies(userId!).then((r) => setApiReplies(r.replies)).catch(() => {});
          });
        } else {
          getThreads(userId!)
            .then((r) => {
              const threads = r.threads;
              const isFirstPoll = !initialPollDoneRef.current;
              if (isFirstPoll) {
                initialPollDoneRef.current = true;
              }
              previousThreadIdsRef.current = new Set(threads.map((t) => t.threadId));
              setApiThreads(threads);
              const seen = seenRepliedThreadIdsRef.current;
              const newReplied = threads.find((t) => t.status === "replied" && !seen.has(t.threadId));
              if (newReplied) {
                markThreadSentSeen(newReplied.threadId);
                setTimeout(() => openReplyModalWithSent(newReplied.threadId, newReplied.subject ?? null), 150);
              }
            })
            .catch(() => {});
          getReplies(userId!).then((r) => setApiReplies(r.replies)).catch(() => {});
        }
      };
      doFetch();
    };
    fetchData();
    const t = setInterval(fetchData, pollMs);
    return () => clearInterval(t);
  }, [userId, connected, aggressivePolling]);

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
    return () => {};
  }, [replyCountdownSec]);

  useEffect(() => {
    if (replyCountdownSec === 0 && replyModalPhase === "draft" && userMode === "auto" && userId && replyModalReplyId) {
      setReplyModalPhase("sending");
      setReplyCountdownSec(null);
      approveReply(userId, replyModalReplyId)
        .then(() => {
          setReplyModalPhase("sent");
          markThreadSentSeen(replyModalThreadId!);
          addNotification({
            type: "reply_sent",
            title: "Reply sent",
            message: "Your reply was sent.",
            subject: replyModalSubject ?? undefined,
          });
          getReplies(userId!).then((r) => setApiReplies(r.replies)).catch(() => {});
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
    addNotification({
      type: "autonomous_reply",
      title: "Reply sent",
      message: "Your reply was sent automatically.",
      subject: subject ?? undefined,
    });
  };

  const openReplyModalForNewEmail = (threadId: string, subject?: string | null) => {
    if (!userId) return;
    addNotification({
      type: "support_detected",
      title: "Support email detected",
      message: "Generating reply…",
      subject: subject ?? undefined,
    });
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
    setReplyModalNeedsHumanReason(null);
    setReplyCountdownSec(AUTO_SEND_COUNTDOWN_SEC);
    generateReplyForThread(userId, threadId, { signal })
      .then((result) => {
        if ("needsHuman" in result && result.needsHuman) {
          setReplyModalPhase("needs_human");
          setReplyModalNeedsHumanReason(result.reason ?? "Human intervention needed.");
          setReplyCountdownSec(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          refetchNotifications();
          return;
        }
        if ("sent" in result && result.sent) {
          setReplyModalPhase("sent");
          setReplyCountdownSec(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          markThreadSentSeen(threadId);
        } else if ("draft" in result) {
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
    setReplyModalNeedsHumanReason(null);
    setReplyCountdownSec(AUTO_SEND_COUNTDOWN_SEC);
    generateReplyForThread(userId, threadId, { signal })
      .then((result) => {
        if ("needsHuman" in result && result.needsHuman) {
          setReplyModalPhase("needs_human");
          setReplyModalNeedsHumanReason(result.reason ?? "Human intervention needed.");
          setReplyCountdownSec(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          refetchNotifications();
          return;
        }
        if ("sent" in result && result.sent) {
          setReplyModalPhase("sent");
          setReplyCountdownSec(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          markThreadSentSeen(threadId);
          addNotification({
            type: "autonomous_reply",
            title: "Reply sent",
            message: "Your reply was sent automatically.",
            subject: replyModalSubject ?? undefined,
          });
        } else if ("draft" in result) {
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
        if ("needsHuman" in result && result.needsHuman) {
          setReplyModalPhase("needs_human");
          setReplyModalNeedsHumanReason(result.reason ?? "Human intervention needed.");
          return;
        }
        if ("sent" in result && result.sent) return;
        if ("draft" in result) {
          setReplyModalPhase("takeover");
          setReplyModalDraft(result.draft);
          setReplyModalEditedContent(result.draft);
          setReplyModalReplyId(result.replyId);
          setReplyModalSubject(result.subject);
        }
      })
      .catch((e) => {
        setReplyModalPhase("needs_human");
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
    setReplyModalNeedsHumanReason(null);
    setReplyModalContext("");
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalEditedContent("");
  };

  const openThreadForHumanIntervention = (threadId: string, reason?: string | null) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setReplyCountdownSec(null);
    setReplyModalOpen(true);
    setReplyModalThreadId(threadId);
    setReplyModalPhase("human_input");
    setReplyModalNeedsHumanReason(reason ?? "Human intervention needed.");
    setReplyModalContext("");
    setReplyModalError(null);
    setReplyModalDraft("");
    setReplyModalReplyId("");
    setReplyModalSubject(null);
    setReplyModalEditedContent("");
  };

  const handleGenerateWithContext = () => {
    if (!userId || !replyModalThreadId) return;
    setReplyModalPhase("generating");
    setReplyModalError(null);
    generateReplyForThread(userId, replyModalThreadId, {
      takeOver: true,
      context: replyModalContext.trim() || undefined,
    })
      .then((result) => {
        if ("needsHuman" in result && result.needsHuman) {
          setReplyModalPhase("needs_human");
          setReplyModalNeedsHumanReason(result.reason ?? "Human intervention needed.");
          return;
        }
        if ("sent" in result && result.sent) {
          setReplyModalPhase("sent");
          markThreadSentSeen(replyModalThreadId);
          refetchNotifications();
          return;
        }
        if ("draft" in result) {
          setReplyModalPhase("draft");
          setReplyModalDraft(result.draft);
          setReplyModalReplyId(result.replyId);
          setReplyModalSubject(result.subject);
        }
      })
      .catch((e) => {
        setReplyModalPhase("human_input");
        setReplyModalError(e instanceof Error ? e.message : String(e));
      });
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
      markThreadSentSeen(replyModalThreadId!);
      addNotification({
        type: "reply_sent",
        title: "Reply sent",
        message: "Your edited reply was sent.",
        subject: replyModalSubject ?? undefined,
      });
      getReplies(userId).then((r) => setApiReplies(r.replies)).catch(() => {});
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
          onModeChange={handleModeChange}
        />

        <main className="min-w-0 flex-1">
          <TopBar
            query={query}
            setQuery={setQuery}
            notifications={notifications}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            onClearNotifications={clearNotifications}
            onLoadMoreNotifications={loadMoreNotifications}
            onNotificationOpenThread={(threadId, notification) => {
              if (notification?.type === "human_intervention") {
                openThreadForHumanIntervention(threadId, notification.message);
              } else {
                openReplyModal(threadId);
              }
            }}
            notificationsHasMore={notificationsHasMore}
            notificationsLoading={notificationsLoading}
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">Inbox</h1>
                        <p className="mt-1 text-sm text-zinc-600">
                          {connected && userId
                            ? `${apiThreads.length} thread${apiThreads.length === 1 ? "" : "s"} synced from Gmail`
                            : "Connect Gmail and sync to load your emails."}
                        </p>
                      </div>
                      {connected && userId ? (
                        <button
                          type="button"
                          onClick={handleSyncInbox}
                          disabled={syncing}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <Mail className="h-4 w-4" />
                          {syncing ? "Syncing…" : "Sync inbox"}
                        </button>
                      ) : null}
                    </div>

                    {!connected ? (
                      <GlassCard className="p-10 text-center">
                        <Mail className="mx-auto h-12 w-12 text-zinc-400" />
                        <p className="mt-4 text-lg font-semibold text-zinc-950">Connect Gmail to see your inbox</p>
                        <p className="mt-2 text-sm text-zinc-600">Click Connect Gmail in the sidebar, then Sync inbox to pull your emails.</p>
                      </GlassCard>
                    ) : filteredThreads.length === 0 ? (
                      <GlassCard className="p-10 text-center">
                        <Inbox className="mx-auto h-12 w-12 text-zinc-400" />
                        <p className="mt-4 text-lg font-semibold text-zinc-950">
                          {apiThreads.length === 0 ? "No threads yet" : "No matching threads"}
                        </p>
                        <p className="mt-2 text-sm text-zinc-600">
                          {apiThreads.length === 0
                            ? "Click Sync inbox to pull emails from Gmail."
                            : "Try a different search."}
                        </p>
                        {apiThreads.length === 0 && (
                          <button
                            type="button"
                            onClick={handleSyncInbox}
                            disabled={syncing}
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {syncing ? "Syncing…" : "Sync inbox"}
                          </button>
                        )}
                      </GlassCard>
                    ) : (
                      <GlassCard className="overflow-hidden">
                        <div className="border-b border-black/5 px-4 py-3 sm:px-6">
                          <div className="text-xs font-semibold text-zinc-600">
                            Showing {threadsToShow.length} of {filteredThreads.length} thread{filteredThreads.length === 1 ? "" : "s"}
                          </div>
                        </div>
                        <div className="divide-y divide-black/5 max-h-[60vh] overflow-y-auto">
                          {threadsToShow.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => openReplyModal(t.threadId)}
                              className="flex w-full cursor-pointer flex-col gap-1 px-4 py-4 text-left sm:px-6 hover:bg-white/50 sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-zinc-950">
                                  {t.subject || "(No subject)"}
                                </div>
                                <div className="mt-0.5 truncate text-xs text-zinc-600">
                                  {t.threadId} · {t.status ?? "pending"}
                                </div>
                              </div>
                              <span className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0">
                                <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                  {t.status ?? "pending"}
                                </span>
                                <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-black/10">
                                  Auto-reply
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                        {hasMoreThreads ? (
                          <div className="border-t border-black/5 px-4 py-4 sm:px-6">
                            <button
                              type="button"
                              onClick={() => setVisibleThreadCount((n) => n + 10)}
                              className="w-full rounded-2xl bg-black/5 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-black/10"
                            >
                              Load more ({filteredThreads.length - visibleThreadCount} more)
                            </button>
                          </div>
                        ) : null}
                      </GlassCard>
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
      </div>

      <AnimatePresence>
        {syncModalOpen ? (
          <Fragment key="sync-modal">
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
          </Fragment>
        ) : null}
        {replyModalOpen ? (
          <Fragment key="reply-modal">
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
                          {replyModalPhase === "needs_human" && "Human intervention needed"}
                          {replyModalPhase === "human_input" && "What does the AI need to know?"}
                          {replyModalPhase === "error" && "Error"}
                        </div>
                        {replyModalSubject && replyModalPhase !== "generating" && replyModalPhase !== "sending" && replyModalPhase !== "human_input" && (
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

                {replyModalPhase === "human_input" && (
                  <div className="mt-5 flex flex-col gap-4">
                    <p className="text-sm text-zinc-700">
                      {replyModalNeedsHumanReason}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Tell the AI what it needs to know so it can generate a reply (e.g. &quot;We received their document. Refund is processed.&quot;). Then it will generate and can send autonomously.
                    </p>
                    <textarea
                      value={replyModalContext}
                      onChange={(e) => setReplyModalContext(e.target.value)}
                      placeholder="e.g. We received the document. Refund is processed."
                      className="min-h-[100px] w-full rounded-2xl border-0 bg-white/80 px-4 py-3 text-sm text-zinc-800 ring-1 ring-black/10 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      rows={3}
                    />
                    {replyModalError && (
                      <p className="text-xs text-rose-600">{replyModalError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateWithContext}
                      className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b})` }}
                    >
                      Generate reply
                    </button>
                  </div>
                )}

                {replyModalPhase === "needs_human" && (
                  <div className="mt-5 flex flex-col gap-4">
                    <p className="text-sm text-zinc-700">
                      {replyModalNeedsHumanReason}
                    </p>
                    <p className="text-xs text-zinc-500">
                      You can add context above and generate again, or take over to write a reply yourself.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyModalPhase("human_input");
                        setReplyModalError(null);
                      }}
                      className="w-full rounded-2xl border-2 border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-white/50"
                    >
                      Add context & generate
                    </button>
                    <button
                      type="button"
                      onClick={handleTakeOverDuringGenerate}
                      className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b})` }}
                    >
                      Take over — write reply
                    </button>
                  </div>
                )}

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
                        <label className="block text-sm font-semibold text-zinc-800">
                          Edit your reply
                        </label>
                        <textarea
                          value={replyModalEditedContent}
                          onChange={(e) => setReplyModalEditedContent(e.target.value)}
                          placeholder="Type your reply…"
                          className="min-h-[160px] w-full rounded-2xl border-0 bg-white/90 p-4 text-sm leading-relaxed text-zinc-800 shadow-sm ring-1 ring-black/10 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
                          rows={8}
                        />
                        {replyModalError && (
                          <p className="text-sm text-rose-600">{replyModalError}</p>
                        )}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={closeReplyModal}
                            className="flex-1 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSendEditedReply}
                            disabled={!replyModalEditedContent.trim()}
                            className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50 disabled:shadow-none"
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
          </Fragment>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
