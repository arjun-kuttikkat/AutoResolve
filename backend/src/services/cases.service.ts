import { eq, and, desc } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

export async function createCase(
    userId: string,
    threadId: string,
    data: {
        merchantName?: string;
        issueDescription?: string;
        desiredOutcome?: string;
    }
) {
    const db = getDb();

    // Verify thread belongs to user
    const thread = await db.query.emailThreads.findFirst({
        where: and(
            eq(schema.emailThreads.userId, userId),
            eq(schema.emailThreads.threadId, threadId)
        ),
    });

    if (!thread) {
        throw new Error("Thread not found or access denied");
    }

    // Generate Case ID (AR-XXXX)
    const caseRef = `AR-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Case
    const [newCase] = await db
        .insert(schema.cases)
        .values({
            userId,
            caseReferenceId: caseRef,
            merchantName: data.merchantName,
            issueDescription: data.issueDescription,
            desiredOutcome: data.desiredOutcome,
            status: "open",
        })
        .returning();

    // Link Thread to Case
    await db
        .update(schema.emailThreads)
        .set({ caseId: newCase.id })
        .where(eq(schema.emailThreads.id, thread.id));

    return newCase;
}

export async function getCaseByThreadId(userId: string, threadId: string) {
    const db = getDb();

    const thread = await db.query.emailThreads.findFirst({
        where: and(
            eq(schema.emailThreads.userId, userId),
            eq(schema.emailThreads.threadId, threadId)
        ),
        with: {
            case: true,
        },
    });

    return thread?.case || null;
}

export async function resolveCase(userId: string, caseId: string) {
    const db = getDb();

    const [updated] = await db
        .update(schema.cases)
        .set({ status: "resolved", updatedAt: new Date() })
        .where(and(eq(schema.cases.id, caseId), eq(schema.cases.userId, userId)))
        .returning();

    return updated;
}

export async function getCases(userId: string) {
    const db = getDb();

    const userCases = await db
        .select()
        .from(schema.cases)
        .where(eq(schema.cases.userId, userId))
        .orderBy(desc(schema.cases.updatedAt));

    return userCases;
}
