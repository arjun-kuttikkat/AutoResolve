"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GeistMono } from "geist/font";
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    ExternalLink,
    Link2,
    Lock,
    Mail,
    MessageSquare,
    Pencil,
    Star,
    Trash2,
    Wand2,
    X,
    Copy,
    Terminal,
    Bot
} from "lucide-react";
import {
    BRAND,
    Chip,
    Confidence,
    GlassCard,
    Glow,
    IconButton,
    Mono,
    Noise,
    PillDot,
    PrimaryButton,
    SecondaryButton,
    StatusPill,
    cn,
    ease,
    formatCaseId,
    modeBadge,
    type CaseItem,
} from "./components";

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

export function CaseDrawer({
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
                                                    <div className="rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300">
                                                        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2 text-zinc-500">
                                                            <Terminal className="h-3 w-3" />
                                                            <span>Agent thought process</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div><span className="text-emerald-400">✓</span> Offer detected: <span className="text-white">15% partial refund</span></div>
                                                            <div><span className="text-emerald-400">✓</span> Policy check: <span className="text-red-400">Too low (Target: 100%)</span></div>
                                                            <div><span className="text-blue-400">➜</span> Action: <span className="text-white">Generating firm counter-offer</span></div>
                                                        </div>
                                                    </div>

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
