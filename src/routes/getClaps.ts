import { Router } from "express";
import { getSourceUrl } from "../lib/util.js";
import { getClaps } from "../services/clapService.js";

const router = Router();

router.get("/get-claps", async (req, res) => {
  if (!req.headers.referer && !req.query.url) {
    res.json(0);
    return;
  }

  try {
    const sourceUrl = getSourceUrl(req);
    const claps = await getClaps(sourceUrl);
    res.json(claps);
  } catch (err) {
    console.error("get-claps error:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
