import { Router } from "express";
import { getSourceUrl } from "../lib/util.js";
import { updateClaps } from "../services/clapService.js";

const router = Router();

router.post("/update-claps", async (req, res) => {
  try {
    const sourceUrl = getSourceUrl(req);

    const body = req.body;
    let claps: number;

    if (typeof body === "string") {
      claps = Number(body.split(",")[0]);
    } else if (typeof body === "number") {
      claps = body;
    } else {
      claps = Number(body);
    }

    if (!Number.isInteger(claps)) {
      claps = 1;
    }

    const sourceIp = req.ip || "unknown";
    const totalClaps = await updateClaps(sourceUrl, claps, sourceIp);

    res.json(totalClaps);
  } catch (err) {
    console.error("update-claps error:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
