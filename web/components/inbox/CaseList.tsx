"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Mail,
    MoreHorizontal
} from "lucide-react";
import { motion } from "framer-motion";

export interface CaseItem {
    id: string;
    caseReferenceId: string;
    merchantName: string | null;
    issueDescription: string | null;
    desiredOutcome: string | null;
    status: "open" | "resolved";
    updatedAt: string;
    // metrics from join
    metrics?: { sent: number; received: number; total: number };
}

interface CaseListProps {
    cases: CaseItem[];
    onOpenCase: (caseId: string) => void;
}

export function CaseList({ cases, onOpenCase }: CaseListProps) {
    if (cases.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 rounded-3xl border border-black/5">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                    <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">No active cases</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                    Escalate an email from your Potential Cases to start tracking it as a case.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            {/* Header Row - Optional/Hidden if we want a cleaner look, but useful for columns */}
            <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <div className="col-span-4">Case</div>
                <div className="col-span-3">Merchant</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Updated</div>
            </div>

            <div className="space-y-2">
                {cases.map((c) => (
                    <motion.div
                        key={c.id}
                        layoutId={c.id}
                        onClick={() => onOpenCase(c.id)}
                        className="group grid grid-cols-12 gap-4 items-center bg-white/70 hover:bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                        {/* Case Column */}
                        <div className="col-span-4 flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-zinc-900 truncate">
                                    {c.caseReferenceId}
                                </div>
                                <div className="text-xs text-zinc-500 truncate mt-0.5">
                                    {c.issueDescription || "No description"}
                                </div>
                            </div>
                        </div>

                        {/* Merchant Column */}
                        <div className="col-span-3 min-w-0">
                            <div className="text-sm font-medium text-zinc-900 truncate">
                                {c.merchantName || "Unknown"}
                            </div>
                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                                {c.desiredOutcome || "Resolution"}
                            </div>
                        </div>

                        {/* Status Column */}
                        <div className="col-span-3 flex items-center gap-2">
                            {/* Visual Stepper Mockup */}
                            <div className="hidden sm:flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${c.status === 'open' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                                <span className="text-xs font-medium text-zinc-700 capitalize">
                                    {c.status}
                                </span>
                            </div>
                        </div>

                        {/* Updated Column */}
                        <div className="col-span-2 text-right text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
