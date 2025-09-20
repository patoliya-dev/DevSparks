import mongoose from "mongoose";

const converSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  // role: { type: String, enum: ["user", "assistant"], required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Conversation = mongoose.model("Conversation", converSchema);
