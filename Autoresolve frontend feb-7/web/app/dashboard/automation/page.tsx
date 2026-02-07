"use client";

import React, { useState } from "react";
import { Bot } from "lucide-react";
import { Glow, Noise, BRAND } from "../components";

function ToggleRow({ label, description, initial = false }: { label: string; description: string; initial?: boolean }) {
    const [enabled, setEnabled] = useState(initial);
    return (
        <div className="flex items-center justify-between p-4 rounded-3xl bg-white/60 ring-1 ring-black/5 hover:bg-white/80 transition">
            <div>
                <div className="text-sm font-semibold text-zinc-950">{label}</div>
                <div className="text-xs text-zinc-600 mt-1">{description}</div>
            </div>
            <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${enabled ? "bg-indigo-600" : "bg-zinc-200"}`}
            >
                <span
                    className={`${enabled ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </button>
        </div>
    );
}

export default function AutomationPage() {
    return (
        <div className="h-full overflow-y-auto p-6 md:p-8">
            <div className="relative min-h-full overflow-hidden rounded-[36px] bg-white/70 ring-1 ring-black/10 backdrop-blur p-8">
                <Glow className="-top-24 left-[-200px] h-[520px] w-[520px] opacity-35" />
                <Noise />

                <div className="relative max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 ring-1 ring-black/10">
                            <Bot className="h-6 w-6 text-zinc-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-zinc-950">Automation Rules</h1>
                            <p className="text-sm text-zinc-600">Configure when the agent should act autonomously.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <ToggleRow
                            label="Auto-escalate after 48h"
                            description="Automatically drift cases to 'Needs approval' if no reply received."
                            initial={true}
                        />
                        <ToggleRow
                            label="Require human approval for refunds > $50"
                            description="Agent will drift high-value refunds for review."
                            initial={false}
                        />
                        <ToggleRow
                            label="Aggressive follow-up mode"
                            description="Send daily reminders instead of every 3 days."
                            initial={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
