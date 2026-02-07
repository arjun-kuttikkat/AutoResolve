"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GeistMono } from "geist/font";
import {
    CheckCircle2,
    CircleDot,
    Download,
    Inbox,
    Link2,
    Loader2,
    Lock,
    MessageSquare,
    Sparkles,
    X,
} from "lucide-react";
import {
    BRAND,
    Chip,
    Glow,
    IconButton,
    Noise,
    PillDot,
    PrimaryButton,
    SecondaryButton,
    SoftCard,
    cn,
    ease,
} from "./components";

// Helper components local to this modal (or could be in components.tsx if shared)

function Field({
    label,
    placeholder,
    icon,
    className,
    mono,
    defaultValue,
}: {
    label: string;
    placeholder: string;
    icon: React.ReactNode;
    className?: string;
    mono?: boolean;
    defaultValue?: string;
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
                defaultValue={defaultValue}
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
        <button
            type="button"
            className={cn(
                "bg-white text-left ring-1 ring-black/10 transition active:scale-[0.98]",
                active ? "ring-2 ring-indigo-500" : "hover:bg-zinc-50",
                "rounded-2xl p-3"
            )}
        >
            <div className="flex items-center justify-between">
                <div
                    className={cn(
                        "text-sm font-semibold",
                        active ? "text-indigo-600" : "text-zinc-900"
                    )}
                >
                    {label}
                </div>
                {active && (
                    <div className="h-2 w-2 rounded-full bg-indigo-600" />
                )}
            </div>
            <div className="mt-1 text-xs text-zinc-500 font-medium">{desc}</div>
        </button>
    );
}

import { useToast } from "./toast-context";

// ... (imports)

export function CreateCaseModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { showToast } = useToast();
    const [parsing, setParsing] = useState(false);
    const [parsed, setParsed] = useState(false);
    const [text, setText] = useState("");

    const [loadingLabel, setLoadingLabel] = useState("Analysing...");
    const [hasEvidence, setHasEvidence] = useState(false);

    const handleParse = () => {
        if (!text) return;
        setParsing(true);
        setLoadingLabel("Scanning text...");

        // Auto-detect evidence
        const lower = text.toLowerCase();
        if (lower.includes("image") || lower.includes("attached") || lower.includes("screenshot")) {
            setHasEvidence(true);
        } else {
            setHasEvidence(false);
        }

        // Staged Animation
        setTimeout(() => setLoadingLabel("Identifying Merchant Entity..."), 600);
        setTimeout(() => setLoadingLabel("Extracting Intent & Sentiment..."), 1200);
        setTimeout(() => {
            setLoadingLabel("Done!");
            setTimeout(() => {
                setParsing(false);
                setParsed(true);
            }, 600);
        }, 1800);
    };

    const reset = () => {
        setParsing(false);
        setParsed(false);
        setText("");
        onClose();
    };

    return (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/25"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={reset}
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
                                        <div className="text-sm font-semibold text-zinc-950">
                                            {parsed ? "Review case details" : "Create a case"}
                                        </div>
                                        <div className="mt-1 text-xs text-zinc-600">
                                            {parsed ? "AI extracted these details. Confirm to activate agent." : "Paste the email or context. The agent does the rest."}
                                        </div>
                                    </div>
                                    <IconButton label="Close" onClick={reset}>
                                        <X className="h-4 w-4 text-zinc-700" />
                                    </IconButton>
                                </div>
                            </div>

                            <div className="relative p-6">
                                {!parsed ? (
                                    // PASTE STATE
                                    <div className="space-y-4">
                                        <div className="relative rounded-3xl bg-white ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-indigo-500/20">
                                            <textarea
                                                className="min-h-[200px] w-full resize-none bg-transparent p-5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                                                placeholder="Paste the support email here. Example: 'Hi, my order #12345 arrived damaged...' or drag and drop screenshots."
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="border-t border-black/5 bg-zinc-50/50 px-4 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs font-semibold text-zinc-500">
                                                        <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5 text-indigo-500" />
                                                        AI will extract merchant, order #, and intent
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <SecondaryButton onClick={reset}>Cancel</SecondaryButton>
                                            <PrimaryButton
                                                onClick={handleParse}
                                                className={cn("min-w-[100px]", parsing && "opacity-80")}
                                            >
                                                {parsing ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        {loadingLabel}
                                                    </span>
                                                ) : (
                                                    "Parse details"
                                                )}
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                ) : (
                                    // REVIEW STATE (Mock Data)
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field label="Merchant" placeholder="ACME Store" icon={<Inbox className="h-4 w-4" />} defaultValue="ACME Store" />
                                            <Field label="Order / reference" placeholder="#18472" icon={<CircleDot className="h-4 w-4" />} mono defaultValue="#18472" />
                                            <Field label="Issue" placeholder="Item arrived damaged" icon={<MessageSquare className="h-4 w-4" />} className="md:col-span-2" defaultValue="Item arrived damaged, requesting refund" />
                                            <Field label="Desired outcome" placeholder="Full refund" icon={<CheckCircle2 className="h-4 w-4" />} className="md:col-span-2" defaultValue="Full refund to original payment method" />
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
                                                    <div className="text-sm font-semibold text-zinc-950">Evidence</div>
                                                    <SecondaryButton className="gap-2 px-3 py-1.5 text-xs">
                                                        <Link2 className="h-3.5 w-3.5" />
                                                        Add
                                                    </SecondaryButton>
                                                </div>
                                                <div className="mt-3 flex items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
                                                    {hasEvidence ? (
                                                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl ring-1 ring-black/5 shadow-sm">
                                                            <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                                                                <Download className="h-4 w-4 text-zinc-500" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xs font-semibold text-zinc-900">damage_photo.jpg</div>
                                                                <div className="text-[10px] text-zinc-500">2.4 MB</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-zinc-500">Drag files or paste images</div>
                                                    )}
                                                </div>
                                            </SoftCard>
                                        </div>

                                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="text-xs font-semibold text-zinc-600">
                                                <span className="inline-flex items-center gap-2">
                                                    <Lock className="h-4 w-4" style={{ color: BRAND.a }} />
                                                    Sends from your inbox
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <SecondaryButton onClick={() => setParsed(false)}>Back</SecondaryButton>
                                                <PrimaryButton onClick={() => {
                                                    showToast("🚀 Agent deployed! First email sent to Acme Store.", "success");
                                                    reset();
                                                }}>
                                                    Confirm & Create
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
