import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X, CheckCircle2 } from "lucide-react";
import { createCase } from "@/lib/api";

interface CreateCaseModalProps {
    userId: string;
    threadId: string;
    onClose: () => void;
    onCaseCreated: () => void;
}

export function CreateCaseModal({ userId, threadId, onClose, onCaseCreated }: CreateCaseModalProps) {
    const [step, setStep] = useState<"form" | "creating" | "success">("form");
    const [formData, setFormData] = useState({
        merchantName: "",
        issueDescription: "",
        desiredOutcome: "",
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!formData.desiredOutcome) {
            setError("Desired outcome is required");
            return;
        }
        setStep("creating");
        setError(null);
        try {
            await createCase(userId, threadId, formData);
            setStep("success");
            setTimeout(() => {
                onCaseCreated();
                onClose();
            }, 1500);
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
                            <p className="mt-2 text-zinc-600">The AI is now ready to handle this negotiation.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

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

                            {/* Mocks for Config (Static for MVP as per plan to just do basics first, or use simple inputs) 
                  The plan said "Configuration: Tone...". I'll add a static note or simple selector if needed.
                  For now keeping it simple as per "Review case details" inputs.
              */}

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
                                    Confirm & Create
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
