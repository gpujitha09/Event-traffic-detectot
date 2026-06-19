import { Router, type IRouter } from "express";
import { SubmitFeedbackBody } from "@workspace/api-zod";
import { db, feedbackTable, hasDb } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

// Local in-memory feedback store fallback
interface FeedbackItem {
  id: number;
  predicted_score: number;
  predicted_band: string;
  actual_severity: string;
  actual_police_deployed: number;
  diversion_used: string;
  notes: string | null;
  created_at: Date;
}

const memoryFeedback: FeedbackItem[] = [
  {
    id: 1,
    predicted_score: 72,
    predicted_band: "High",
    actual_severity: "High",
    actual_police_deployed: 11,
    diversion_used: "Yes",
    notes: "Heavy congestion handled successfully via Bannerghatta Road diversion.",
    created_at: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 2,
    predicted_score: 42,
    predicted_band: "Medium",
    actual_severity: "Low",
    actual_police_deployed: 2,
    diversion_used: "No",
    notes: "Minor delays near Silk Board, police deployment was sufficient.",
    created_at: new Date(Date.now() - 3600000 * 5),
  }
];
let nextId = 3;

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (hasDb) {
    const [row] = await db
      .insert(feedbackTable)
      .values({
        predicted_score: String(parsed.data.predicted_score),
        predicted_band: parsed.data.predicted_band,
        actual_severity: parsed.data.actual_severity,
        actual_police_deployed: parsed.data.actual_police_deployed,
        diversion_used: parsed.data.diversion_used,
        notes: parsed.data.notes ?? null,
      })
      .returning();

    res.status(201).json({
      id: row.id,
      predicted_score: Number(row.predicted_score),
      predicted_band: row.predicted_band,
      actual_severity: row.actual_severity,
      actual_police_deployed: row.actual_police_deployed,
      diversion_used: row.diversion_used,
      notes: row.notes ?? null,
      created_at: row.created_at.toISOString(),
    });
  } else {
    const newRow: FeedbackItem = {
      id: nextId++,
      predicted_score: parsed.data.predicted_score,
      predicted_band: parsed.data.predicted_band,
      actual_severity: parsed.data.actual_severity,
      actual_police_deployed: parsed.data.actual_police_deployed,
      diversion_used: parsed.data.diversion_used,
      notes: parsed.data.notes ?? null,
      created_at: new Date(),
    };
    memoryFeedback.unshift(newRow); // add to top of array (descending order)

    res.status(201).json({
      id: newRow.id,
      predicted_score: newRow.predicted_score,
      predicted_band: newRow.predicted_band,
      actual_severity: newRow.actual_severity,
      actual_police_deployed: newRow.actual_police_deployed,
      diversion_used: newRow.diversion_used,
      notes: newRow.notes,
      created_at: newRow.created_at.toISOString(),
    });
  }
});

router.get("/feedback", async (_req, res): Promise<void> => {
  if (hasDb) {
    const rows = await db
      .select()
      .from(feedbackTable)
      .orderBy(desc(feedbackTable.created_at));

    res.json(
      rows.map((r: any) => ({
        id: r.id,
        predicted_score: Number(r.predicted_score),
        predicted_band: r.predicted_band,
        actual_severity: r.actual_severity,
        actual_police_deployed: r.actual_police_deployed,
        diversion_used: r.diversion_used,
        notes: r.notes ?? null,
        created_at: r.created_at.toISOString(),
      }))
    );
  } else {
    res.json(
      memoryFeedback.map((r: FeedbackItem) => ({
        id: r.id,
        predicted_score: r.predicted_score,
        predicted_band: r.predicted_band,
        actual_severity: r.actual_severity,
        actual_police_deployed: r.actual_police_deployed,
        diversion_used: r.diversion_used,
        notes: r.notes,
        created_at: r.created_at.toISOString(),
      }))
    );
  }
});

export default router;
