import express from "express";
import multer from "multer";
import { transcribeAudio } from "../models/stt.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    const text = await transcribeAudio(req.file.path);
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

export default router;
