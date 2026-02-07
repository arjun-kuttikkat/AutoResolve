"use client";

import React from "react";
import { Settings } from "lucide-react";
import { Glow, Noise, EmptyStatePlaceholder } from "../components";

export default function SettingsPage() {
    return (
        <div className="h-full overflow-hidden p-6 md:p-8">
            <div className="relative h-full overflow-hidden rounded-[36px] bg-white/70 ring-1 ring-black/10 backdrop-blur">
                <Glow className="-top-24 left-[-200px] h-[520px] w-[520px] opacity-35" />
                <Noise />
                <EmptyStatePlaceholder
                    title="Settings"
                    desc="Manage your account, billing, and workspace preferences."
                    icon={<Settings className="h-8 w-8 text-zinc-400" />}
                />
            </div>
        </div>
    );
}
