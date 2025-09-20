const express = require("express");
const multer = require("multer");
const { transcribeAudio } = require("../models/stt.js");
const { getLLMResponse, formatSingleLine } = require("../models/llms.js");
const path = require("path");
const fs = require("fs");
const {
  getAllHistory,
  getHistoryBySessionId,
  createSession,
  saveMessage,
} = require("../services/memoryService.js");

const stt = express.Router();
const upload = multer({ dest: "uploads/" });

stt.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    let { sessionId, message, userId } = req.body;
    let session;
    if (sessionId === "" || !sessionId) {
      session = await createSession(userId, message.trim().slice(0, 10));
      sessionId = session._id;
    }

    const text = await transcribeAudio(req.file.path);
    const llmResponse = await getLLMResponse(text);
    const formatedResponse = formatSingleLine(llmResponse);
    const outputFile = path.join(__dirname, `tts_${Date.now()}.wav`);

    await saveMessage(sessionId, text, formatedResponse);

    await textToSpeech(formatedResponse, "en", "", outputFile);
    await res.sendFile(outputFile, {}, (err) => {
      if (!err) fs.unlinkSync(outputFile); // Delete after sending
    });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

stt.get("/getConversations", async (req, res) => {
  try {
    const getSessions = await getAllHistory(req.params.userId);
    return res.json({ getSessions });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

stt.get("/getConversation/:sessionId", async (req, res) => {
  try {
    const getHistory = await getHistoryBySessionId(req.params.sessionId);
    return res.json({ history: getHistory });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

module.exports = stt;
