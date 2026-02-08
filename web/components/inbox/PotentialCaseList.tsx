"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowRight,
    Inbox,
    Mail,
    Reply,
    Send
} from "lucide-react";
import { motion } from "framer-motion";

export interface PotentialCaseItem {
    id: string;
    threadId: string;
    subject: string | null;
    status: string | null;
    updatedAt: string;
    metrics?: { sent: number; received: number; total: number };
}

interface PotentialCaseListProps {
    threads: PotentialCaseItem[];
    onRaiseCase: (threadId: string) => void;
    onOpenThread: (threadId: string) => void;
}

export function PotentialCaseList({ threads, onRaiseCase, onOpenThread }: PotentialCaseListProps) {
    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 rounded-3xl border border-black/5">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                    <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">All caught up</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                    No potential cases found.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            {/* Header Row */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <div className="col-span-5">Thread Subject</div>
                <div className="col-span-3">Activity</div>
                <div className="col-span-2">Action</div>
                <div className="col-span-2 text-right">Updated</div>
            </div>

            <div className="space-y-2">
                {threads.map((t) => (
                    <motion.div
                        key={t.id}
                        layoutId={`thread-${t.id}`}
                        onClick={() => onOpenThread(t.threadId)}
                        className="group grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/70 hover:bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                    >
                        {/* Subject Column */}
                        <div className="col-span-1 sm:col-span-5 flex items-center gap-4 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.status === 'replied' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                {t.status === 'replied' ? <Reply className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-zinc-900 truncate">
                                    {t.subject || "(No subject)"}
                                </div>
                                <div className="text-xs text-zinc-500 truncate mt-0.5">
                                    {t.threadId}
                                </div>
                            </div>
                        </div>

                        {/* Activity / Metrics Column */}
                        <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                            {t.metrics ? (
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md text-zinc-700">
                                        <Send className="w-3 h-3" /> {t.metrics.sent}
                                    </span>
                                    <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md text-zinc-700">
                                        <Mail className="w-3 h-3" /> {t.metrics.received}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs text-zinc-400">Loading metrics...</span>
                            )}
                        </div>

                        {/* Action Column */}
                        <div className="col-span-1 sm:col-span-2" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => onRaiseCase(t.threadId)}
                                className="w-full sm:w-auto px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                            >
                                Raise Case
                            </button>
                        </div>

                        {/* Updated Column */}
                        <div className="col-span-1 sm:col-span-2 text-left sm:text-right text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
