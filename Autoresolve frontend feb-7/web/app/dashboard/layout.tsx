"use client";

import React from "react";
import { GeistSans } from "geist/font";
import { cn } from "./components";
import { Sidebar } from "./sidebar";
import { DevConsole } from "./dev-console";
import { ToastProvider } from "./toast-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <div className={cn("flex min-h-screen bg-[#F0F2F5]", GeistSans.className)}>
                <Sidebar />
                <main className="flex-1 overflow-hidden pb-[36px]"> {/* Add padding for console */}
                    {children}
                </main>
                <DevConsole />
            </div>
        </ToastProvider>
    );
}
