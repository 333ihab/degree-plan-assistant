"use client";

import { useEffect, useState } from "react";
import { chatAPI, Conversation } from "../api";
import { getSocket, initializeSocket } from "../socket";

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.conversations);
      
      // Calculate total unread count
      const totalUnread = response.conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Initialize socket connection
    const socket = initializeSocket();
    if (!socket) {
      console.warn("Failed to initialize socket for chat");
      loadConversations();
      return;
    }

    // Load conversations on mount
    loadConversations();

    // Listen for conversation updates
    socket.on("conversation_updated", () => {
      loadConversations();
    });

    // Listen for new messages (to update unread counts)
    socket.on("new_message", () => {
      loadConversations();
    });

    // Cleanup
    return () => {
      socket.off("conversation_updated");
      socket.off("new_message");
    };
  }, []);

  return {
    conversations,
    unreadCount,
    isLoading,
    refreshConversations: loadConversations,
  };
}

