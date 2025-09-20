import { Conversation } from "../schema/conversation.js";

export async function saveMessage(sessionId, role, message) {
  return await Conversation.create({ sessionId, role, message });
}

export async function getConversation(sessionId, limit = 10) {
  return await Conversation.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
