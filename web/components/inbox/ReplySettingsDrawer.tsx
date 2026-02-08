import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, Image as ImageIcon, Trash2, ArrowRight, ShieldCheck, Zap } from "lucide-react";

const TONES = [
    { id: "professional", label: "Professional", desc: "Balanced standard" },
    { id: "firm", label: "Firm", desc: "For ignoring merchants" },
    { id: "empathetic", label: "Empathetic", desc: "Delicate situations" },
    { id: "direct", label: "Direct", desc: "Cut through fluff" },
];

interface ReplyConfig {
    tone: string;
    context: string;
    images: File[];
    mode: "approval" | "auto";
}

interface ExtractionData {
    merchant?: string;
    orderRef?: string;
    issue?: string;
    outcome?: string;
    suggestedContext?: string;
}

interface ReplySettingsDrawerProps {
    open: boolean;
    onClose: () => void;
    onGenerate: (config: ReplyConfig) => void;
    extractionData?: ExtractionData | null;
}

export function ReplySettingsDrawer({
    open,
    onClose,
    onGenerate,
    extractionData,
}: ReplySettingsDrawerProps) {
    const [tone, setTone] = useState("professional");
    const [context, setContext] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [mode, setMode] = useState<"approval" | "auto">("approval");
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-fill context from extraction data if available
    useEffect(() => {
        if (open && extractionData?.suggestedContext) {
            setContext(extractionData.suggestedContext);
        } else if (open && !extractionData) {
            setContext("");
        }
    }, [open, extractionData]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
                f.type.startsWith("image/")
            );
            setImages((prev) => [...prev, ...newFiles]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).filter((f) =>
                f.type.startsWith("image/")
            );
            setImages((prev) => [...prev, ...newFiles]);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className="pointer-events-auto w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-black/5 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-black/5 px-8 py-5">
                                <div>
                                    <h2 className="text-xl font-semibold text-zinc-950">
                                        Review case details
                                    </h2>
                                    <p className="text-sm text-zinc-500">
                                        AI extracted these details. Confirm to activate agent.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 text-zinc-400 hover:bg-black/5 hover:text-zinc-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 py-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column: Extraction Data */}
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-1.5 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100">
                                                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Merchant</div>
                                                <div className="font-semibold text-zinc-900">{extractionData?.merchant || "Unknown"}</div>
                                            </div>
                                            <div className="flex-1 space-y-1.5 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100">
                                                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Order / Reference</div>
                                                <div className="font-semibold text-zinc-900">{extractionData?.orderRef || "N/A"}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100">
                                            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Issue</div>
                                            <div className="font-medium text-zinc-900">{extractionData?.issue || "No issue detected"}</div>
                                        </div>

                                        <div className="space-y-1.5 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100">
                                            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Desired Outcome</div>
                                            <div className="font-medium text-zinc-900">{extractionData?.outcome || "Resolution"}</div>
                                        </div>
                                    </div>

                                    {/* Right Column: Configuration */}
                                    <div className="space-y-8">
                                        {/* Configuration Section */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-zinc-950 mb-4">Configuration</h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-medium text-zinc-500 mb-2 block">Response Style</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {TONES.map((t) => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => setTone(t.id)}
                                                                className={`px-3 py-2 text-sm rounded-lg border transition text-center ${tone === t.id
                                                                    ? "bg-zinc-900 text-white border-zinc-900"
                                                                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                                                                    }`}
                                                            >
                                                                {t.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium text-zinc-500 mb-2 block">Specific Instructions</label>
                                                    <textarea
                                                        value={context}
                                                        onChange={(e) => setContext(e.target.value)}
                                                        rows={2}
                                                        className="w-full rounded-xl border-zinc-200 bg-white p-3 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        placeholder="Add user context..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            {/* Mode Selector */}
                                            <div className="flex-1 space-y-4">
                                                <h3 className="text-sm font-semibold text-zinc-950">Mode</h3>
                                                <div className="flex gap-2 p-1 bg-zinc-100/80 rounded-xl">
                                                    <button
                                                        onClick={() => setMode("approval")}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${mode === "approval" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" : "text-zinc-500 hover:text-zinc-700"}`}
                                                    >
                                                        <ShieldCheck className="h-4 w-4" />
                                                        Approval
                                                    </button>
                                                    <button
                                                        onClick={() => setMode("auto")}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${mode === "auto" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" : "text-zinc-500 hover:text-zinc-700"}`}
                                                    >
                                                        <Zap className="h-4 w-4" />
                                                        Auto
                                                    </button>
                                                </div>
                                                <p className="text-xs text-zinc-500 px-1">
                                                    {mode === "approval" ? "Review drafts before sending." : "Hands-off. Sends if confidence is high."}
                                                </p>
                                            </div>

                                            {/* Evidence */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-zinc-950">Evidence</h3>
                                                    <button onClick={() => fileInputRef.current?.click()} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">+ Add</button>
                                                </div>

                                                <div
                                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                                    onDragLeave={() => setIsDragOver(false)}
                                                    onDrop={handleDrop}
                                                    className={`h-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${isDragOver ? "border-indigo-500 bg-indigo-50/50" : "border-zinc-200 bg-zinc-50/50"}`}
                                                >
                                                    {images.length > 0 ? (
                                                        <div className="flex gap-2 overflow-x-auto px-2 w-full justify-center">
                                                            {images.map((img, i) => (
                                                                <div key={i} className="relative group shrink-0">
                                                                    <div className="h-16 w-16 rounded-lg bg-zinc-200 flex items-center justify-center overflow-hidden border border-zinc-200">
                                                                        <ImageIcon className="h-6 w-6 text-zinc-400" />
                                                                    </div>
                                                                    <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400 text-center px-4">Drag files or paste images</span>
                                                    )}
                                                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-black/5 p-6 bg-zinc-50/50 flex justify-between items-center">
                                <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition">
                                    Back
                                </button>
                                <button
                                    onClick={() => onGenerate({ tone, context, images, mode })}
                                    className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/25 hover:opacity-90 transition transform active:scale-95 flex items-center gap-2"
                                >
                                    Confirm & Create
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
