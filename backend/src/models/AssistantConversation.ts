import mongoose, { Schema, model } from "mongoose";
import { buildEntityId } from "../utils/ids.js";

const assistantMessageSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    created_at: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

const assistantConversationSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => buildEntityId("chat"),
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    follow_ups: {
      type: [String],
      default: [],
    },
    messages: {
      type: [assistantMessageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

assistantConversationSchema.index({ user_id: 1, updatedAt: -1 });

export const AssistantConversationModel =
  mongoose.models.AssistantConversation ||
  model("AssistantConversation", assistantConversationSchema);
