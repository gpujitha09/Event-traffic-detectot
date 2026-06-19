import { Router, type IRouter } from "express";
import { SubmitFeedbackBody } from "@workspace/api-zod";
import { db, feedbackTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

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
});

router.get("/feedback", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.created_at));

  res.json(
    rows.map((r) => ({
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
});

export default router;
