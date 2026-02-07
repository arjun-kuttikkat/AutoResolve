"use client";

import React from "react";
import { GeistSans, GeistMono } from "geist/font"; // usage of font might need adjustment based on imports in page.tsx
import { ArrowRight as ArrowRightIcon, Loader2, Link2, CheckCircle2, CircleDot, MessageSquare, Download, Lock, Inbox, Settings, Shield, Bot, Mail, ListChecks, Plus, Filter, MoreHorizontal, Terminal } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utilities ---

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const BRAND = {
    name: "AutoResolve",
    a: "#4F46E5", // indigo
    b: "#06B6D4", // cyan
    c: "#F43F5E", // rose
};

export const ease = [0.22, 1, 0.36, 1] as const;

export type CaseStatus = "Draft" | "Running" | "Awaiting reply" | "Needs approval" | "Resolved" | "Closed";

export type CaseItem = {
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
    refundedAmount?: string;
};

export function statusColor(s: CaseStatus) {
    switch (s) {
        case "Running": return BRAND.b;
        case "Awaiting reply": return BRAND.a;
        case "Needs approval": return BRAND.c;
        case "Resolved": return "#22C55E";
        case "Closed": return "#71717A";
        default: return "#111827";
    }
}

export function modeBadge(mode: "Approval" | "Auto") {
    return mode === "Auto" ? { label: "Auto", dot: BRAND.b } : { label: "Approval", dot: BRAND.a };
}

export function kpiTrendColor(kind: "up" | "down" | "flat") {
    if (kind === "up") return "#22C55E";
    if (kind === "down") return BRAND.c;
    return "#71717A";
}

export function formatCaseId(id: string) {
    return `#${id}`;
}

// --- Components ---

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
    // Assuming GeistMono is global or I need to check how it's imported.
    // In page.tsx: import { GeistSans, GeistMono } from "geist/font";
    // I will assume the same import works here.
    return <span className={cn("font-mono", className)} style={className ? undefined : { fontFamily: 'var(--font-geist-mono)' }}>{children}</span>;
}

export function GradientText({ children }: { children: React.ReactNode }) {
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

export function Glow({ className }: { className?: string }) {
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

export function Noise() {
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

export function LogoMark({ size = 34 }: { size?: number }) {
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

export function Chip({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-black/10 backdrop-blur">
            {children}
        </span>
    );
}

export function PillDot({ color }: { color: string }) {
    return <span className="h-2 w-2 rounded-full" style={{ background: color }} />;
}

export function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
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

export function SoftCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("rounded-3xl bg-white/80 ring-1 ring-black/10", className)}>{children}</div>;
}

export function PrimaryButton({
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
            <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
    );
}

export function SecondaryButton({
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

export function IconButton({
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

export function SplitBar({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn("h-1 w-full", className)}
            style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})` }}
        />
    );
}

export function StatusPill({ status }: { status: CaseStatus }) {
    const colorClasses = {
        "Draft": "bg-gray-100 text-gray-800",
        "Waiting": "bg-yellow-100 text-yellow-800", // Mapping "Waiting" probably means "Awaiting reply"
        "Awaiting reply": "bg-yellow-100 text-yellow-800",
        "Needs approval": "bg-red-100 text-red-800", // "Action Needed" interpretation
        "Running": "bg-blue-100 text-blue-800", // "Action Needed" or Running
        "Resolved": "bg-green-100 text-green-800", // "Resolved"
        "Closed": "bg-gray-100 text-gray-600"
    };

    // User requested: Draft(gray), Waiting(yellow), Action(blue), Resolved(green).
    // Our types: Draft, Running, Awaiting reply, Needs approval, Resolved, Closed.
    // Mapping:
    // Draft -> Draft
    // Awaiting reply -> Waiting (Yellow)
    // Running -> Action (Blue)? Or Needs Approval as Action?
    // "Action Needed: bg-blue-100".
    // Let's map "Running" to Blue and "Needs approval" to Red or Blue?
    // Usually "Needs approval" is the action needed. Let's make "Needs approval" Blue per "Action Needed".
    // And "Running" maybe Blue too?

    // Revised Mapping per user request:
    // Draft -> bg-gray-100 text-gray-800
    // Awaiting reply (Waiting) -> bg-yellow-100 text-yellow-800
    // Needs approval (Action Needed) -> bg-blue-100 text-blue-800
    // Resolved -> bg-green-100 text-green-800
    // Running -> bg-blue-50 text-blue-600 (Generic active)

    let className = "bg-gray-100 text-gray-800";
    if (status === "Resolved") className = "bg-green-100 text-green-800";
    else if (status === "Awaiting reply") className = "bg-yellow-100 text-yellow-800";
    else if (status === "Needs approval") className = "bg-blue-100 text-blue-800";
    else if (status === "Running") className = "bg-blue-50 text-blue-700";

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
            {status}
        </span>
    );
}

export function NegotiationStepper({ status }: { status: CaseStatus }) {
    const steps = ["Draft", "Sent", "Counter", "Resolved"];
    // Map statuses to step indices
    const statusMap: Record<string, number> = {
        "Needs approval": 0,
        "Awaiting reply": 1,
        "Running": 2,
        "Resolved": 3,
    };

    const currentStepIndex = statusMap[status] ?? 0;

    return (
        <div className="flex items-center gap-1">
            {steps.map((step, i) => {
                const isActive = i === currentStepIndex;
                const isCompleted = i < currentStepIndex;

                let color = "bg-zinc-200"; // default/future
                // if (isActive) color = BRAND.a; // Active brand color handled in style
                // if (isCompleted) color = BRAND.b; // Completed color handled in style

                return (
                    <div key={step} className="flex flex-col items-center gap-1">
                        <div
                            className={cn("h-1.5 w-8 rounded-full transition-all")}
                            style={{
                                backgroundColor: isActive ? BRAND.a : isCompleted ? BRAND.b : "#e4e4e7",
                                height: isActive ? "6px" : "6px"
                            }}
                        />
                        {isActive && (
                            <span className="text-[10px] font-bold text-zinc-950 uppercase tracking-tighter">{step}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function Confidence({ value }: { value: number }) {
    const v = Math.max(0, Math.min(100, value));
    return (
        <div className="group relative flex items-center gap-3 cursor-help" title="Confidence is high because the merchant used standard refund keywords ('process', '7-10 days').">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-black/5">
                <div
                    className="h-full"
                    style={{
                        width: `${v}%`,
                        backgroundImage: `linear-gradient(90deg, ${BRAND.a}, ${BRAND.b}, ${BRAND.c})`,
                    }}
                />
            </div>
            <span className={cn("text-xs font-semibold text-zinc-600")}>{v}%</span>
        </div>
    );
}

export function EmptyStatePlaceholder({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 ring-1 ring-black/10">
                {icon}
            </div>
            <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
            <p className="mt-2 text-sm text-zinc-600 max-w-sm">{desc}</p>
        </div>
    );
}
