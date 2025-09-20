import { Conversation } from "../schema/conversation.js";
import Session from '../schema/session.js';

export async function saveMessage(sessionId, message, response) {
  return await Conversation.create({ sessionId, message, response });
}

export async function getConversation(sessionId, limit = 10) {
  return await Conversation.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function createSession(userId, name) {
  return await Session.create({ userId, name });
}

export async function getAllHistory(userId) {
  return await Session.find({ userId }).lean();
}

export async function getHistoryBySessionId(sessionId) {
  return await Session.find({ sessionId }, { $sort: { createdAt: 1 } }).lean();
}