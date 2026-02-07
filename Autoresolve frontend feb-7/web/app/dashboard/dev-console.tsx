"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { cn, Mono } from "./components";

const MOCK_LOGS = [
    { type: "POST", msg: "/api/v1/analyze_intent ... 200 OK", color: "text-green-400" },
    { type: "LLM", msg: "Token usage: 412 | Model: gpt-4o", color: "text-blue-400" },
    { type: "INFO", msg: "Merchant entity extracted: 'ACME Store'", color: "text-zinc-400" },
    { type: "WARN", msg: "Sentiment analysis: Negative (0.82)", color: "text-yellow-400" },
    { type: "GET", msg: "/api/v1/history?merchant_id=8821", color: "text-green-400" },
    { type: "DANGER", msg: "Merchant 'Acme' detected in high-risk category.", color: "text-red-400" },
    { type: "LLM", msg: "Generating draft response (temperature: 0.7)", color: "text-blue-400" },
    { type: "POST", msg: "/api/v1/draft ... 201 Created", color: "text-green-400" },
];

type LogItem = typeof MOCK_LOGS[number] & { timestamp?: string };

export function DevConsole() {
    const [open, setOpen] = useState(true);
    const [logs, setLogs] = useState<LogItem[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomLog = MOCK_LOGS[Math.floor(Math.random() * MOCK_LOGS.length)];
            const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
            setLogs((prev) => [...prev.slice(-15), { ...randomLog, timestamp }]);
        }, 1200); // Add a log every 1.2s

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, open]);

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out font-mono border-t border-zinc-800",
                open ? "h-[180px]" : "h-9"
            )}
        >
            <div className="flex h-9 items-center justify-between bg-zinc-950 px-4 text-[11px] text-zinc-400 cursor-pointer border-b border-zinc-800" onClick={() => setOpen(!open)}>
                <div className="flex items-center gap-2">
                    <Terminal className="h-3 w-3" />
                    <span className="font-semibold text-zinc-300">Developer Console</span>
                    <span className="text-zinc-600">|</span>
                    <span>Live Agent Logs</span>
                </div>
                {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </div>

            {open && (
                <div className="h-[calc(180px-36px)] overflow-y-auto bg-zinc-950 p-4 font-mono text-[11px] leading-5 text-zinc-300 scrollbar-hide">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-3">
                            <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                            <span className={cn("font-bold shrink-0 w-14", log.color)}>[{log.type}]</span>
                            <span className="text-zinc-300">{log.msg}</span>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            )}
        </div>
    );
}
