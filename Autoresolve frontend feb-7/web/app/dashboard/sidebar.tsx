"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bot,
    ChevronDown,
    ChevronRight,
    CreditCard,
    Download,
    HelpCircle,
    Inbox,
    KeyRound,
    ListChecks,
    Mail,
    Settings,
    Shield,
    User,
} from "lucide-react";
import {
    BRAND,
    Chip,
    Glow,
    IconButton,
    LogoMark,
    Noise,
    PillDot,
    SecondaryButton,
    cn,
    Mono,
} from "./components";

export function Sidebar() {
    const pathname = usePathname();
    // Helper to check active state
    // exact match for /dashboard (Overview), prefix match for others?
    const isActive = (path: string) => {
        if (path === "/dashboard" && pathname === "/dashboard") return true;
        if (path !== "/dashboard" && pathname?.startsWith(path)) return true;
        return false;
    };

    const nav = [
        { href: "/dashboard", label: "Overview", icon: Inbox },
        { href: "/dashboard/cases", label: "Cases", icon: ListChecks },
        { href: "/dashboard/inbox", label: "Inbox", icon: Mail },
        { href: "/dashboard/automation", label: "Automation", icon: Bot },
        { href: "/dashboard/security", label: "Security", icon: Shield },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className="hidden h-screen w-[300px] shrink-0 border-r border-black/5 bg-white/70 backdrop-blur md:block sticky top-0">
            <div className="relative h-full overflow-hidden">
                <Glow className="-top-28 left-[-160px] h-[380px] w-[380px] opacity-40" />
                <Glow className="bottom-[-180px] right-[-180px] h-[460px] w-[460px] opacity-35" />
                <Noise />

                <div className="relative flex h-full flex-col p-5">
                    <div className="flex items-center gap-3">
                        <LogoMark />
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
                        <div className="mt-1 text-xs text-zinc-600">Gmail connected • Approval by default</div>

                        <div className="mt-4 grid gap-2">
                            <button
                                type="button"
                                className="flex items-center justify-between rounded-2xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-black/7"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <KeyRound className="h-4 w-4" style={{ color: BRAND.a }} />
                                    API key
                                </span>
                                <span className={cn("text-zinc-600")}>•••• 4F2A</span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-between rounded-2xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-black/7"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" style={{ color: BRAND.c }} />
                                    Billing
                                </span>
                                <span className="text-zinc-600">Manage</span>
                            </button>
                        </div>
                    </div>

                    <nav className="mt-5 space-y-1">
                        {nav.map((it) => {
                            const Icon = it.icon;
                            const active = isActive(it.href);
                            const isExternal = it.href === "/dashboard/inbox";
                            const href = isExternal ? "https://mail.google.com" : it.href;
                            const target = isExternal ? "_blank" : undefined;

                            return (
                                <Link
                                    key={it.href}
                                    href={href}
                                    target={target}
                                    className={cn(
                                        "group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold",
                                        "transition",
                                        active
                                            ? "bg-white ring-1 ring-black/10 shadow-[0_14px_50px_rgba(0,0,0,.10)]"
                                            : "text-zinc-700 hover:bg-white/70"
                                    )}
                                >
                                    <span className="inline-flex items-center gap-3">
                                        <span
                                            className={cn(
                                                "inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-black/10",
                                                active ? "bg-white" : "bg-white/70"
                                            )}
                                            style={{
                                                backgroundImage: active
                                                    ? `linear-gradient(135deg, ${BRAND.a}10, ${BRAND.b}10, ${BRAND.c}10)`
                                                    : undefined,
                                            }}
                                        >
                                            <Icon className="h-4 w-4" style={{ color: active ? BRAND.a : "#111827" }} />
                                        </span>
                                        {it.label}
                                    </span>

                                    {!isExternal && (
                                        <span className="opacity-0 transition group-hover:opacity-100">
                                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                                        </span>
                                    )}
                                    {isExternal && (
                                        <span className="opacity-0 transition group-hover:opacity-100">
                                            <div className="h-4 w-4" /> {/* Spacer or external icon if desired */}
                                        </span>
                                    )}
                                </Link>
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
