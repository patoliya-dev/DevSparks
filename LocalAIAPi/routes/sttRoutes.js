const express = require("express");
const multer = require("multer");
const { transcribeAudio } = require("../models/stt.js");
const { getLLMResponse, formatSingleLine } = require("../models/llms.js");
const path = require('path');
const fs = require('fs');

const stt = express.Router();
const upload = multer({ dest: "uploads/" });

stt.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    const text = await transcribeAudio(req.file.path);
    const llmResponse = await getLLMResponse(text);
    const formatedResponse = formatSingleLine(llmResponse);
    const outputFile = path.join(__dirname, `tts_${Date.now()}.wav`);
        
    await textToSpeech(formatedResponse,"en",'', outputFile);
    await res.sendFile(outputFile, {}, (err) => {
      if (!err) fs.unlinkSync(outputFile); // Delete after sending
  });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

module.exports = stt;
