import { Router } from "express";
import { getMultipleClaps } from "../services/clapService.js";

const router = Router();

router.post("/get-multiple", async (req, res) => {
  try {
    const urls = req.body;

    if (!Array.isArray(urls)) {
      res.status(400).json({ error: "Request body must be an array of URLs" });
      return;
    }

    if (urls.length === 0) {
      res.json([]);
      return;
    }

    const results = await getMultipleClaps(urls);
    res.json(results);
  } catch (err) {
    console.error("get-multiple error:", err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
