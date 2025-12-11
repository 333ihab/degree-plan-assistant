"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { chatAPI, Conversation } from "../../../lib/api";
import ChatWindow from "../../../components/chat/ChatWindow";
import { getSocket, initializeSocket } from "../../../lib/socket";

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    // Initialize socket connection
    initializeSocket();

    loadConversations();

    // Set up socket listeners for real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on("conversation_updated", () => {
        loadConversations();
      });

      socket.on("new_message", () => {
        loadConversations();
      });

      return () => {
        socket.off("conversation_updated");
        socket.off("new_message");
      };
    }
  }, [router]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (selectedConversation) {
    return (
      <ChatWindow
        conversationId={selectedConversation._id}
        otherParticipant={selectedConversation.otherParticipant}
        onBack={() => {
          setSelectedConversation(null);
          loadConversations(); // Refresh conversations when going back
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col bg-[#F4F6FF] px-6 pb-24 pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--dark-navy)]">Chat with Advisors</h1>
        <p className="text-sm text-gray-600">
          Connect with faculty advisors, FYE mentors, or peer supporters. Conversations stay synced across devices.
        </p>
        <Link
          href="/chat/new"
          className="mt-4 inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-[var(--primary-blue)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-blue-light)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Start a new conversation
        </Link>
      </header>

      <section className="mt-8 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--primary-blue)] border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-lg shadow-[rgba(18,8,75,0.05)]">
            <p className="text-sm text-gray-600">No conversations yet. Start a new one!</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => setSelectedConversation(conversation)}
              className="w-full rounded-3xl bg-white p-5 text-left shadow-lg shadow-[rgba(18,8,75,0.05)] transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--dark-navy)]">
                    {conversation.otherParticipant.fullName}
                  </h2>
                  <p className="text-sm font-medium text-[var(--primary-blue)] capitalize">
                    {conversation.otherParticipant.role.replace("_", " ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                  <span>{formatTimestamp(conversation.lastMessageAt)}</span>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary-blue)] text-[10px] font-semibold text-white">
                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              {conversation.lastMessage && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {conversation.lastMessage.content}
                </p>
              )}
            </button>
          ))
        )}
      </section>

      <footer className="mt-10 rounded-3xl bg-white p-5 text-sm text-gray-500 shadow-lg shadow-[rgba(18,8,75,0.05)]">
        Looking for help? Your advisor typically replies within one business day. If you need urgent assistance,
        visit the <span className="font-semibold text-[var(--primary-blue)]">Student Success Center</span>.
      </footer>
    </div>
  );
}


