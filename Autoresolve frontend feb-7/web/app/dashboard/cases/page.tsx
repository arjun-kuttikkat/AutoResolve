"use client";

import React, { useState, useMemo } from "react";
import { Search, Sparkles, Bell, Plus } from "lucide-react";
import {
    BRAND,
    Chip,
    cn,
    GlassCard,
    Glow,
    GradientText,
    IconButton,
    Noise,
    PrimaryButton,
    SplitBar,
    type CaseItem,
} from "../components"; // Adjust import path
import { CasesTable } from "../cases-table"; // Adjust import path
import { CaseDrawer } from "../case-drawer"; // Adjust import path
import { CreateCaseModal } from "../create-case-modal"; // Adjust import path
import { GeistMono } from "geist/font";

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
                                placeholder="Search cases..."
                                className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                            />
                            <span className={cn("rounded-xl bg-black/5 px-2 py-1 text-[11px] font-semibold text-zinc-600", GeistMono.className)}>
                                ⌘K
                            </span>
                        </div>
                        <div className="md:hidden">
                            <Chip>
                                <Sparkles className="h-4 w-4" style={{ color: BRAND.b }} />
                                Cases
                            </Chip>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <IconButton label="Notifications">
                            <Bell className="h-4 w-4 text-zinc-700" />
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

export default function CasesPage() {
    const [query, setQuery] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [selected, setSelected] = useState<string | undefined>();

    const cases: CaseItem[] = useMemo(
        () => [
            {
                id: "18472",
                merchant: "ACME Store",
                category: "Refund • Damaged delivery",
                createdAt: "Feb 03",
                updatedAt: "11:05",
                status: "Resolved",
                mode: "Approval",
                desired: "Full refund",
                lastAction: "Refund confirmed",
                nextAction: "Close case",
                offer: "15% partial refund",
                confidence: 86,
                refundedAmount: "+ $45.00 Refunded",
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

                        <div className="relative">
                            <div className="mb-6">
                                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">All Cases</h1>
                                <p className="mt-2 text-sm text-zinc-600">Manage all your active and closed dispute resolutions.</p>
                            </div>

                            <CasesTable
                                items={filtered}
                                selectedId={selected}
                                onSelect={(id) => {
                                    setSelected(id);
                                    setDrawerOpen(true);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <CaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} item={selectedItem} />
            <CreateCaseModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </>
    );
}
