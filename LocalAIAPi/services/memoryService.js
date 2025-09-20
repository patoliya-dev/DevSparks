import { Conversation } from "../schema/conversation.js";

export async function saveMessage(sessionId, message, response) {
  return await Conversation.create({ sessionId, message, response });
}

export async function getConversation(sessionId, limit = 10) {
  return await Conversation.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
