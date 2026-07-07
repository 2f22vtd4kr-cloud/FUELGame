// §5.6 Anti-cheat: player report endpoint
// Logs suspicious player reports for manual review at launch.
// Future: automated detection pipeline.

import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/report", (req, res) => {
  const { reportedName, reportedCharacter } = req.body ?? {};
  if (!reportedName) {
    res.status(400).json({ error: "reportedName required" });
    return;
  }
  // Log for manual review; no DB write yet (launched without DB for report tracking)
  logger.info({ reportedName, reportedCharacter, ts: Date.now() }, "player_report");
  res.json({ ok: true });
});

export default router;
