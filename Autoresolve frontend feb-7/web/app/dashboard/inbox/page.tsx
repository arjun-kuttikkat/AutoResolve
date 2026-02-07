"use client";

import React from "react";
import { Mail } from "lucide-react";
import { Glow, Noise, EmptyStatePlaceholder } from "../components";

export default function InboxPage() {
    return (
        <div className="h-full overflow-hidden p-6 md:p-8">
            <div className="relative h-full overflow-hidden rounded-[36px] bg-white/70 ring-1 ring-black/10 backdrop-blur">
                <Glow className="-top-24 left-[-200px] h-[520px] w-[520px] opacity-35" />
                <Noise />
                <EmptyStatePlaceholder
                    title="Unified Inbox"
                    desc="Manage all your support correspondence in one place. AI drafts responses automatically."
                    icon={<Mail className="h-8 w-8 text-zinc-400" />}
                />
            </div>
        </div>
    );
}
