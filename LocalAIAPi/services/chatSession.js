import { ChatSession, Conversation } from '../models/chatModels.js';
import mongoose from 'mongoose';

export const createNewChatSession = async (userId, firstMessage = null) => {
  try {
    const sessionId = new mongoose.Types.ObjectId().toString();
    const title = firstMessage ? ChatSession.generateTitle(firstMessage) : "New Chat";
    
    const session = new ChatSession({
      sessionId,
      userId,
      title
    });
    
    return await session.save();
  } catch (error) {
    throw new Error(`Failed to create chat session: ${error.message}`);
  }
};

export const getUserChatSessions = async (userId, includeArchived = false) => {
  try {
    return await ChatSession.getUserSessions(userId, includeArchived);
  } catch (error) {
    throw new Error(`Failed to fetch chat sessions: ${error.message}`);
  }
};

export const getChatSessionById = async (sessionId, userId) => {
  try {
    const session = await ChatSession.findOne({ sessionId, userId });
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }
    return session;
  } catch (error) {
    throw new Error(`Failed to fetch chat session: ${error.message}`);
  }
};

export const updateChatSessionTitle = async (sessionId, userId, newTitle) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId, userId },
      { title: newTitle.trim(), updatedAt: new Date() },
      { new: true }
    );
    
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }
    
    return session;
  } catch (error) {
    throw new Error(`Failed to update chat title: ${error.message}`);
  }
};

export const archiveChatSession = async (sessionId, userId) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId, userId },
      { isArchived: true, updatedAt: new Date() },
      { new: true }
    );
    
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }
    
    return session;
  } catch (error) {
    throw new Error(`Failed to archive chat session: ${error.message}`);
  }
};

export const deleteChatSession = async (sessionId, userId) => {
  try {
    // Verify ownership first
    const session = await ChatSession.findOne({ sessionId, userId });
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }
    
    // Delete all messages first
    await Conversation.deleteMany({ sessionId });
    
    // Delete session
    await ChatSession.deleteOne({ sessionId, userId });
    
    return { sessionId, deleted: true };
  } catch (error) {
    throw new Error(`Failed to delete chat session: ${error.message}`);
  }
};

// ===== CONVERSATION SERVICES =====

export const getConversationHistory = async (sessionId, userId, limit = 100, offset = 0) => {
  try {
    // Verify user owns this session
    const session = await getChatSessionById(sessionId, userId);
    
    // Get messages
    const messages = await Conversation.getSessionMessages(sessionId, limit, offset);
    
    return {
      session: {
        sessionId: session.sessionId,
        title: session.title,
        messageCount: session.messageCount
      },
      messages
    };
  } catch (error) {
    throw new Error(`Failed to fetch conversation: ${error.message}`);
  }
};

export const addMessageToConversation = async (sessionId, userId, role, message, metadata = {}) => {
  try {
    // Verify session exists and user owns it
    await getChatSessionById(sessionId, userId);
    
    const newMessage = await Conversation.addMessage(sessionId, role, message, metadata);
    
    return newMessage;
  } catch (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }
};

export const createChatWithFirstMessage = async (userId, userMessage) => {
  try {
    // Create new session
    const session = await createNewChatSession(userId, userMessage);
    
    // Add first user message
    const firstMessage = await Conversation.addMessage(
      session.sessionId,
      'user',
      userMessage
    );
    
    return {
      session,
      firstMessage
    };
  } catch (error) {
    throw new Error(`Failed to create chat with message: ${error.message}`);
  }
};

export const getRecentMessagesForContext = async (sessionId, userId, count = 10) => {
  try {
    // Verify ownership
    await getChatSessionById(sessionId, userId);
    
    return await Conversation.getRecentMessages(sessionId, count);
  } catch (error) {
    throw new Error(`Failed to fetch recent messages: ${error.message}`);
  }
};

export const getUserStats = async (userId) => {
  try {
    const stats = await ChatSession.aggregate([
      { $match: { userId, isArchived: false } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: '$messageCount' },
          lastActivity: { $max: '$lastActivity' }
        }
      }
    ]);
    
    return stats[0] || { totalSessions: 0, totalMessages: 0, lastActivity: null };
  } catch (error) {
    throw new Error(`Failed to fetch user stats: ${error.message}`);
  }
};
