import React, { useEffect, useState, useRef } from "react";
import { X, Reply, Clock, User, AlertCircle, Briefcase, CheckCircle2, ShieldCheck, Zap, Image as ImageIcon, Trash2, ArrowRight, Sparkles, Send, RefreshCw } from "lucide-react";
import { getThread, getCaseByThreadId, generateReplyForThread, approveReply, syncEmails } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { CreateCaseModal } from "./CreateCaseModal";

const TONES = [
    { id: "professional", label: "Professional", desc: "Balanced standard" },
    { id: "firm", label: "Firm", desc: "For ignoring merchants" },
    { id: "empathetic", label: "Empathetic", desc: "Delicate situations" },
    { id: "direct", label: "Direct", desc: "Cut through fluff" },
];

interface ThreadDetailViewProps {
    threadId: string | null;
    userId: string | null;
    onClose: () => void;
    initialExtraction?: {
        merchant?: string;
        orderRef?: string;
        issue?: string;
        outcome?: string;
        suggestedContext?: string;
    } | null;
}

interface Message {
    id: string;
    fromEmail: string;
    toEmail: string;
    subject: string | null;
    body: string | null;
    isFromUser: boolean;
    createdAt: Date | null;
}

interface ThreadData {
    thread: {
        id: string;
        threadId: string;
        subject: string | null;
        status: string | null;
    };
    messages: Message[];
}

interface CaseData {
    id: string;
    caseReferenceId: string;
    status: string;
    merchantName: string | null;
    desiredOutcome: string | null;
    issueDescription: string | null;
}

export function ThreadDetailView({
    threadId,
    userId,
    onClose,
    initialExtraction,
}: ThreadDetailViewProps) {
    const [data, setData] = useState<ThreadData | null>(null);
    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createCaseOpen, setCreateCaseOpen] = useState(false);

    // AI Settings State
    const [tone, setTone] = useState("professional");
    const [context, setContext] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [mode, setMode] = useState<"approval" | "auto">("approval");
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Draft State
    const [draftStatus, setDraftStatus] = useState<"idle" | "generating" | "review" | "sending" | "sent" | "error">("idle");
    const [draftContent, setDraftContent] = useState("");
    const [draftReplyId, setDraftReplyId] = useState<string | null>(null);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        if (!userId) return;
        setSyncing(true);
        try {
            await syncEmails(userId);
            await fetchData();
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        if (initialExtraction?.suggestedContext) {
            setContext(initialExtraction.suggestedContext);
        }
    }, [initialExtraction]);

    const fetchData = async () => {
        if (!threadId || !userId) return;
        setLoading(true);
        setError(null);

        try {
            // Fetch thread data first (Priority)
            const threadRes = await getThread(userId, threadId);
            setData(threadRes);

            // Then fetch case data (Secondary)
            try {
                const caseRes = await getCaseByThreadId(userId, threadId);
                setCaseData(caseRes.case);
            } catch (caseErr) {
                console.warn("Failed to load case data:", caseErr);
                setCaseData(null); // Non-critical failure
            }
        } catch (err) {
            console.error("Failed to load thread:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Reset draft state on new thread
        setDraftStatus("idle");
        setDraftContent("");
        setDraftReplyId(null);
        setDraftError(null);
    }, [threadId, userId]);

    const handleGenerate = async () => {
        if (!threadId || !userId) return;
        setDraftStatus("generating");
        setDraftError(null);

        try {
            // Convert images to base64
            const base64Images = await Promise.all(
                images.map(
                    (file) =>
                        new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        })
                )
            );

            const res = await generateReplyForThread(userId, threadId, {
                tone,
                userContext: context,
                imageContext: base64Images,
                takeOver: false, // We always want to review first in this view
            });

            if (res.sent) {
                // Should not happen if takeOver is false, but handle it
                setDraftStatus("sent");
                fetchData();
            } else {
                setDraftContent(res.draft);
                setDraftReplyId(res.replyId);
                setDraftStatus("review");
            }
        } catch (e) {
            setDraftStatus("error");
            setDraftError(e instanceof Error ? e.message : "Failed to generate reply");
        }
    };

    const handleSendDraft = async () => {
        if (!userId || !draftReplyId) return;
        setDraftStatus("sending");
        try {
            await approveReply(userId, draftReplyId, draftContent);
            setDraftStatus("sent");
            fetchData();
        } catch (e) {
            setDraftStatus("error");
            setDraftError(e instanceof Error ? e.message : "Failed to send reply");
        }
    };

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

    if (!threadId) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            >
                <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 md:flex-row">

                    {/* LEFT COLUMN: Thread & Messages */}
                    <div className="flex flex-1 flex-col border-r border-zinc-100 bg-zinc-50/50 md:w-1/2 lg:w-3/5">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                            <h2 className="text-lg font-semibold text-zinc-900">
                                {data?.thread.subject || "Loading..."}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSync}
                                    disabled={syncing || loading}
                                    className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-full transition"
                                    title="Sync emails"
                                >
                                    <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                                </button>
                                {data?.thread.status && (
                                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                                        {data.thread.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading && !data ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                </div>
                            ) : error ? (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
                                    <p className="text-sm text-zinc-600">Failed to load thread</p>
                                    <p className="text-xs text-zinc-400 mt-1">{error}</p>
                                </div>
                            ) : data ? (
                                <div className="space-y-6">
                                    {data.messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col rounded-2xl border p-5 ${msg.isFromUser
                                                ? "items-end border-indigo-100 bg-indigo-50/30"
                                                : "items-start border-zinc-200 bg-white"
                                                }`}
                                        >
                                            <div className="mb-3 flex w-full items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${msg.isFromUser
                                                            ? "bg-indigo-100 text-indigo-600"
                                                            : "bg-orange-100 text-orange-600"
                                                            }`}
                                                    >
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-semibold text-zinc-900">
                                                            {msg.isFromUser ? "You" : msg.fromEmail}
                                                        </span>
                                                        <div className="text-xs text-zinc-500">
                                                            {new Date(msg.createdAt!).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="prose prose-sm max-w-none text-zinc-800 whitespace-pre-wrap">
                                                {msg.body}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Control Center */}
                    <div className="flex flex-col bg-white md:w-1/2 lg:w-2/5">
                        {/* Header with Close */}
                        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                <span className="font-semibold text-zinc-900">Agent Control</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {/* Case Info Wrapper */}
                            <div className="mb-6 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                                {caseData ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-zinc-500" />
                                                <span className="font-semibold text-zinc-900">{caseData.caseReferenceId}</span>
                                            </div>
                                            {caseData.status === "resolved" && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Resolved
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs font-medium text-zinc-400 uppercase">Merchant</div>
                                                <div className="text-sm text-zinc-900 font-medium truncate">{caseData.merchantName || "Unknown"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-zinc-400 uppercase">Outcome</div>
                                                <div className="text-sm text-zinc-900 font-medium truncate">{caseData.desiredOutcome || "-"}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-zinc-900">No Active Case</div>
                                            <div className="text-xs text-zinc-500">Track and resolve this issue</div>
                                        </div>
                                        <button
                                            onClick={() => setCreateCaseOpen(true)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
                                        >
                                            <Briefcase className="h-3 w-3" />
                                            Raise Case
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Draft / AI Logic */}
                            {draftStatus === "review" ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-zinc-900">Review Draft</h3>
                                        <button
                                            onClick={() => setDraftStatus("idle")}
                                            className="text-xs text-zinc-500 hover:text-zinc-700 underline"
                                        >
                                            Discard & Edit Settings
                                        </button>
                                    </div>
                                    <textarea
                                        value={draftContent}
                                        onChange={(e) => setDraftContent(e.target.value)}
                                        className="w-full h-64 rounded-xl border-zinc-200 bg-white p-4 text-sm text-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-sm"
                                        placeholder="Draft content..."
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSendDraft}
                                            disabled={!draftContent.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-200 transition disabled:opacity-50"
                                        >
                                            <Send className="h-4 w-4" />
                                            Send Reply
                                        </button>
                                    </div>
                                </div>
                            ) : draftStatus === "sent" ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-2xl border border-green-100">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-900">Reply Sent!</h3>
                                    <p className="text-sm text-green-700 mt-1">The agent has processed your response.</p>
                                    <button
                                        onClick={() => setDraftStatus("idle")}
                                        className="mt-4 text-sm font-medium text-green-800 hover:underline"
                                    >
                                        Start New Reply
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Tone Selection */}
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block uppercase tracking-wider">Tone</label>
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

                                    {/* Context */}
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 block uppercase tracking-wider">Instructions / Context</label>
                                        <textarea
                                            value={context}
                                            onChange={(e) => setContext(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border-zinc-200 bg-white p-3 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Ex: Tell them I already shipped the return..."
                                        />
                                    </div>

                                    {/* Evidence */}
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 mb-2 flex justify-between uppercase tracking-wider">
                                            <span>Evidence / Images</span>
                                            <span
                                                className="cursor-pointer text-indigo-600 hover:underline"
                                                onClick={() => fileInputRef.current?.click()}
                                            >+ Add</span>
                                        </label>
                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                            onDragLeave={() => setIsDragOver(false)}
                                            onDrop={handleDrop}
                                            className={`min-h-[60px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition p-2 ${isDragOver ? "border-indigo-500 bg-indigo-50/50" : "border-zinc-200 bg-zinc-50/50"}`}
                                        >
                                            {images.length > 0 ? (
                                                <div className="flex gap-2 overflow-x-auto w-full px-1">
                                                    {images.map((img, i) => (
                                                        <div key={i} className="relative group shrink-0">
                                                            <div className="h-10 w-10 rounded-lg bg-zinc-200 flex items-center justify-center overflow-hidden border border-zinc-200">
                                                                <ImageIcon className="h-4 w-4 text-zinc-400" />
                                                            </div>
                                                            <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                                                                <X className="h-2 w-2" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400">Drag files here</span>
                                            )}
                                            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                                        </div>
                                    </div>

                                    {/* Generate Button */}
                                    <div className="pt-2">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={draftStatus === "generating"}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 disabled:opacity-70"
                                        >
                                            {draftStatus === "generating" ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4" />
                                                    Generate Draft
                                                </>
                                            )}
                                        </button>
                                        {draftError && (
                                            <p className="mt-2 text-center text-xs text-red-500">{draftError}</p>
                                        )}
                                    </div>

                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {createCaseOpen && userId && (
                    <CreateCaseModal
                        userId={userId}
                        threadId={threadId}
                        onClose={() => setCreateCaseOpen(false)}
                        onCaseCreated={() => {
                            setCreateCaseOpen(false);
                            fetchData();
                        }}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
}
