import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X, CheckCircle2, Zap, ShieldCheck } from "lucide-react";
import { createCase } from "@/lib/api";

interface CreateCaseModalProps {
    userId: string;
    threadId: string;
    onClose: () => void;
    onCaseCreated: (mode: "auto" | "manual") => void;
}

export function CreateCaseModal({ userId, threadId, onClose, onCaseCreated }: CreateCaseModalProps) {
    const [step, setStep] = useState<"form" | "creating" | "success">("form");
    const [mode, setMode] = useState<"auto" | "manual">("manual");
    const [formData, setFormData] = useState({
        merchantName: "",
        issueDescription: "",
        desiredOutcome: "",
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (mode === "manual" && !formData.desiredOutcome) {
            setError("Desired outcome is required for manual mode");
            return;
        }
        setStep("creating");
        setError(null);
        try {
            await createCase(userId, threadId, {
                ...formData,
                mode,
            });
            setStep("success");
            setTimeout(() => {
                onCaseCreated(mode);
                onClose();
            }, 1000);
        } catch (err) {
            setError("Failed to create case. Please try again.");
            setStep("form");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900">Review Case Details</h2>
                    <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === "success" ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">Case Created</h3>
                            <p className="mt-2 text-zinc-600">
                                {mode === "auto" ? "Generating draft..." : "Redirecting to control panel..."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* Mode Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMode("manual")}
                                    className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition select-none ${mode === "manual"
                                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${mode === "manual" ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className={`font-semibold text-sm ${mode === "manual" ? "text-indigo-900" : "text-zinc-900"}`}>Manual Control</div>
                                        <div className="text-xs text-zinc-500 mt-1">Configure Tone & Context</div>
                                    </div>
                                    {mode === "manual" && (
                                        <div className="absolute top-3 right-3 text-indigo-600">
                                            <div className="h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-indigo-100" />
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => setMode("auto")}
                                    className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition select-none ${mode === "auto"
                                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${mode === "auto" ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className={`font-semibold text-sm ${mode === "auto" ? "text-indigo-900" : "text-zinc-900"}`}>Auto Draft</div>
                                        <div className="text-xs text-zinc-500 mt-1">Generate & Edit</div>
                                    </div>
                                    {mode === "auto" && (
                                        <div className="absolute top-3 right-3 text-indigo-600">
                                            <div className="h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-indigo-100" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            {mode === "manual" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Merchant</label>
                                            <input
                                                type="text"
                                                value={formData.merchantName}
                                                onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                                                className="w-full rounded-xl bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g. Amazon"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Order / Reference</label>
                                            <input
                                                type="text"
                                                disabled
                                                className="w-full cursor-not-allowed rounded-xl bg-zinc-50/50 px-3 py-2 text-sm text-zinc-400 outline-none ring-1 ring-zinc-200"
                                                placeholder="Auto-detected (N/A)"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Issue</label>
                                        <input
                                            type="text"
                                            value={formData.issueDescription}
                                            onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                                            className="w-full rounded-xl bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Item damaged"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Desired Outcome</label>
                                        <textarea
                                            value={formData.desiredOutcome}
                                            onChange={(e) => setFormData({ ...formData, desiredOutcome: e.target.value })}
                                            className="h-24 w-full resize-none rounded-xl bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Full refund to original payment method..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
                                    <p>The AI will automatically analyze the email to detect the merchant, issue, and desired outcome, then generate a draft for you to review.</p>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {step !== "success" && (
                    <div className="bg-zinc-50 px-6 py-4">
                        <button
                            onClick={handleSubmit}
                            disabled={step === "creating"}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {step === "creating" ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    {mode === "auto" ? "Confirm & Auto-Draft" : "Confirm & Create Case"}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
