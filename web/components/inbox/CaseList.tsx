"use client";

import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
    Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { Case } from "@/lib/api";

interface CaseListProps {
    cases: Case[];
    onOpenCase: (caseId: string) => void;
}

export function CaseList({ cases, onOpenCase }: CaseListProps) {
    if (cases.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 rounded-3xl border border-black/5">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">No active cases</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                    Escalate an email from your Potential Cases to start tracking it as a case.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
                <div className="col-span-3">Case</div>
                <div className="col-span-2">Merchant</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Mode</div>
                <div className="col-span-3">Next action</div>
            </div>

            <div className="divide-y divide-zinc-50">
                {cases.map((c) => (
                    <motion.div
                        key={c.id}
                        layoutId={c.id}
                        onClick={() => onOpenCase(c.id)}
                        className="group grid grid-cols-12 gap-4 items-center bg-white hover:bg-zinc-50/50 p-4 transition-all cursor-pointer"
                    >
                        {/* Case Column */}
                        <div className="col-span-3 flex items-start gap-3 min-w-0">
                            <div className="mt-1 w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 ring-1 ring-indigo-100">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-zinc-900 truncate">
                                    #{c.caseReferenceId}
                                </div>
                                <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
                                    {c.issueDescription || "No description"}
                                </div>
                            </div>
                        </div>

                        {/* Merchant Column */}
                        <div className="col-span-2 min-w-0">
                            <div className="text-sm font-semibold text-zinc-900 truncate">
                                {c.merchantName || "Unknown"}
                            </div>
                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                                {c.desiredOutcome || "Resolution"}
                            </div>
                        </div>

                        {/* Status Column (The "Case Bar") */}
                        <div className="col-span-2">
                            <StatusBar status={c.status} />
                        </div>

                        {/* Mode Column */}
                        <div className="col-span-2">
                            <ModeBadge mode={c.mode} />
                        </div>

                        {/* Next Action & Updated Column */}
                        <div className="col-span-3 min-w-0">
                            <div className="text-sm font-semibold text-zinc-900 truncate">
                                {c.nextAction || "Waiting for reply"}
                            </div>
                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                                {c.lastAction ? `Last: ${c.lastAction}` : `Updated ${formatDistanceToNow(new Date(c.updatedAt))} ago`}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1">
                                {format(new Date(c.updatedAt), "HH:mm")}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// --- Subcomponents ---

function StatusBar({ status }: { status: string }) {
    // defined stages
    const stages = ["draft", "sent", "open", "resolved"];
    const currentIndex = stages.indexOf(status) === -1 ? 0 : stages.indexOf(status);

    // Status label mapping
    const labels: Record<string, string> = {
        draft: "DRAFT",
        sent: "SENT",
        open: "OPEN",
        resolved: "RESOLVED"
    };

    return (
        <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
            {/* Progress Bars */}
            <div className="flex gap-1 h-1.5">
                {stages.map((stage, idx) => {
                    const isActive = idx === currentIndex;
                    const isPast = idx < currentIndex;

                    let bgClass = "bg-zinc-200";
                    if (isActive || isPast) {
                        if (status === "draft") bgClass = "bg-indigo-500";
                        else if (status === "sent") bgClass = "bg-blue-500";
                        else if (status === "open") bgClass = "bg-amber-500";
                        else if (status === "resolved") bgClass = "bg-emerald-500";
                    }

                    return (
                        <div
                            key={stage}
                            className={`flex-1 rounded-full ${bgClass} transition-colors duration-300`}
                        />
                    );
                })}
            </div>
            {/* Label */}
            <div className={`text-[10px] font-bold uppercase tracking-wider ${status === 'resolved' ? 'text-emerald-600' :
                status === 'open' ? 'text-amber-600' :
                    status === 'sent' ? 'text-blue-600' :
                        'text-zinc-900'
                }`}>
                {labels[status] || status}
            </div>
        </div>
    )
}

function ModeBadge({ mode }: { mode: "auto" | "manual" }) {
    if (mode === "auto") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold ring-1 ring-cyan-100/50">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Auto
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold ring-1 ring-indigo-100/50">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Manual
        </span>
    );
}
