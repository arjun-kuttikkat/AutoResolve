"use client";

import React from "react";
import { GeistMono } from "geist/font";
import { Filter, MoreHorizontal, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import {
    GlassCard,
    SecondaryButton,
    IconButton,
    cn,
    BRAND,
    Mono,
    formatCaseId,
    modeBadge,
    StatusPill,
    Confidence,
    NegotiationStepper,
    type CaseItem
} from "./components";

export function CasesTable({
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
                                        {c.refundedAmount ? (
                                            <div className="mt-0.5 text-xs font-semibold text-green-600">{c.refundedAmount}</div>
                                        ) : (
                                            <div className="mt-0.5 text-xs text-zinc-600">{c.desired}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.status === "Resolved" ? (
                                            <StatusPill status="Resolved" />
                                        ) : (
                                            <NegotiationStepper status={c.status} />
                                        )}
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
