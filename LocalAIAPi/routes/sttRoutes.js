const express = require("express");
const multer = require("multer");
const { transcribeAudio } = require("../models/stt.js");

const stt = express.Router();
const upload = multer({ dest: "uploads/" });

stt.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    const text = await transcribeAudio(req.file.path);
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

module.exports = stt;
