import express from "express";
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getAvailableAdvisors,
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get or create a conversation
router.post("/conversations", getOrCreateConversation);

// Get all conversations for current user
router.get("/conversations", getConversations);

// Get messages for a conversation
router.get("/conversations/:conversationId/messages", getMessages);

// Send a message
router.post("/messages", sendMessage);

// Get available advisors/mentors (for students) or students (for advisors)
router.get("/available", getAvailableAdvisors);

export default router;

