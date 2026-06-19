import { Router, type IRouter } from "express";
import healthRouter from "./health";
import predictRouter from "./predict";
import feedbackRouter from "./feedback";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(predictRouter);
router.use(feedbackRouter);
router.use(historyRouter);

export default router;
