import express from "express";
import { saveMessage, getConversation } from "../services/memoryService.js";
import { getLLMResponse } from "../models/llms.js"; // your friend's code

const chatRouter = express.Router();

chatRouter.post("/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    // 1. Save user message
    await saveMessage(sessionId, "user", message);

    // 2. Fetch last 5 messages for context
    const history = await getConversation(sessionId, 5);

    // 3. Pass context + message to LLM
    const response = await getLLMResponse(message, history);

    // 4. Save assistant reply
    await saveMessage(sessionId, "assistant", response);

    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default chatRouter;

