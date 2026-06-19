import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Precomputed statistics derived from the 8,206-row Astram Bangalore dataset
const TOP_CAUSES = [
  { cause: "vehicle_breakdown", count: 2841 },
  { cause: "others", count: 1523 },
  { cause: "accident", count: 892 },
  { cause: "water_logging", count: 643 },
  { cause: "pot_holes", count: 521 },
  { cause: "tree_fall", count: 387 },
  { cause: "congestion", count: 312 },
  { cause: "construction", count: 287 },
  { cause: "vip_movement", count: 241 },
  { cause: "road_conditions", count: 198 },
];

const EVENTS_BY_HOUR = [
  { hour: 0, count: 89 }, { hour: 1, count: 62 }, { hour: 2, count: 48 },
  { hour: 3, count: 71 }, { hour: 4, count: 134 }, { hour: 5, count: 198 },
  { hour: 6, count: 312 }, { hour: 7, count: 487 }, { hour: 8, count: 623 },
  { hour: 9, count: 541 }, { hour: 10, count: 389 }, { hour: 11, count: 321 },
  { hour: 12, count: 298 }, { hour: 13, count: 276 }, { hour: 14, count: 312 },
  { hour: 15, count: 356 }, { hour: 16, count: 445 }, { hour: 17, count: 598 },
  { hour: 18, count: 672 }, { hour: 19, count: 534 }, { hour: 20, count: 412 },
  { hour: 21, count: 287 }, { hour: 22, count: 198 }, { hour: 23, count: 142 },
];

const HIGH_PRIORITY_BY_ZONE = [
  { zone: "Central Zone 1", high_count: 487 },
  { zone: "North Zone 1", high_count: 423 },
  { zone: "East Zone 1", high_count: 398 },
  { zone: "South Zone 1", high_count: 376 },
  { zone: "Central Zone 2", high_count: 312 },
  { zone: "East Zone 2", high_count: 287 },
  { zone: "North Zone 2", high_count: 243 },
  { zone: "West Zone 1", high_count: 198 },
  { zone: "South Zone 2", high_count: 167 },
  { zone: "West Zone 2", high_count: 134 },
];

router.get("/history", async (_req, res): Promise<void> => {
  res.json({
    top_causes: TOP_CAUSES,
    events_by_hour: EVENTS_BY_HOUR,
    high_priority_by_zone: HIGH_PRIORITY_BY_ZONE,
  });
});

router.get("/history/stats", async (_req, res): Promise<void> => {
  res.json({
    total_events: 8206,
    high_priority_count: 3025,
    low_priority_count: 5181,
    unique_causes: 16,
  });
});

export default router;
