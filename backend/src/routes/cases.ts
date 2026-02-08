import { Router, type Request, type Response } from "express";
import { createCase, getCaseByThreadId, resolveCase, getCases } from "../services/cases.service.js";

const router = Router();

function getUserId(req: Request): string | null {
    return (req.query.userId as string) ?? (req.body?.userId as string) ?? null;
}

// Create a new case from a thread
router.post("/", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { threadId, merchantName, issueDescription, desiredOutcome, mode } = req.body;

    if (!userId || !threadId) {
        return res.status(400).json({ error: "userId and threadId required" });
    }

    try {
        const newCase = await createCase(userId, threadId, {
            merchantName,
            issueDescription,
            desiredOutcome,
            mode,
        });
        return res.json({ case: newCase });
    } catch (err) {
        console.error("Create case failed:", err);
        return res.status(500).json({ error: "Failed to create case" });
    }
});

// Get all cases for user
router.get("/", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
        const cases = await getCases(userId);
        return res.json({ cases });
    } catch (err) {
        console.error("Get cases failed:", err);
        return res.status(500).json({ error: "Failed to fetch cases" });
    }
});

// Get case details for a specific thread
router.get("/thread/:threadId", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const threadId = req.params.threadId as string;

    if (!userId || !threadId) {
        return res.status(400).json({ error: "userId and threadId required" });
    }

    try {
        const caseData = await getCaseByThreadId(userId, threadId);
        if (!caseData) {
            return res.status(404).json({ error: "No case found for this thread" });
        }
        return res.json({ case: caseData });
    } catch (err) {
        console.error("Get case failed:", err);
        return res.status(500).json({ error: "Failed to fetch case" });
    }
});

// Resolve a case
router.patch("/:caseId/resolve", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const caseId = req.params.caseId as string;

    if (!userId || !caseId) {
        return res.status(400).json({ error: "userId and caseId required" });
    }

    try {
        const updated = await resolveCase(userId, caseId);
        if (!updated) {
            return res.status(404).json({ error: "Case not found" });
        }
        return res.json({ case: updated });
    } catch (err) {
        console.error("Resolve case failed:", err);
        return res.status(500).json({ error: "Failed to resolve case" });
    }
});

export default router;
