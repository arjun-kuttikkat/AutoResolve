"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "./components";

type ToastType = "success" | "error" | "default";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "default") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000); // 5s duration
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            layout
                            className={cn(
                                "flex items-center gap-3 rounded-full border px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-white",
                                toast.type === "success" && "border-green-200 bg-green-50 text-green-900",
                                toast.type === "error" && "border-red-200 bg-red-50 text-red-900",
                                toast.type === "default" && "border-zinc-200"
                            )}
                        >
                            {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            <span className="text-sm font-semibold">{toast.message}</span>
                            <button onClick={() => removeToast(toast.id)} className="ml-2 rounded-full p-1 hover:bg-black/5">
                                <X className="h-3 w-3 opacity-50" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
