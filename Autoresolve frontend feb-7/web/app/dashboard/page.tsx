"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GeistMono, GeistSans } from "geist/font";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Bot
} from "lucide-react";
import {
  BRAND,
  Chip,
  cn,
  ease,
  GlassCard,
  Glow,
  GradientText,
  IconButton,
  kpiTrendColor,
  Noise,
  PillDot,
  PrimaryButton,
  SecondaryButton,
  SoftCard,
  SplitBar,
  type CaseItem,
} from "./components";
import { CasesTable } from "./cases-table";
import { CaseDrawer } from "./case-drawer";
import { CreateCaseModal } from "./create-case-modal";

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
          {/* Note: Can't easily use setCreateOpen here without props, but EmptyState is simple enough to assume handler or be updated */}
          {/* For now just placeholder buttons */}
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
    <>
      <TopBar query={query} setQuery={setQuery} onCreate={() => setCreateOpen(true)} />

      <div className="h-[calc(100vh-84px)] overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1400px]">
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
                <div className="lg:col-span-12">
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
      </div>

      <CaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} item={selectedItem} />
      <CreateCaseModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
