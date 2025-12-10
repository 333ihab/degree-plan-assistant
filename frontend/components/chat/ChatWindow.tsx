"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSocket, initializeSocket } from "../../lib/socket";
import { chatAPI, Message } from "../../lib/api";

type ChatWindowProps = {
  conversationId: string;
  otherParticipant: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  onBack: () => void;
};

export default function ChatWindow({ conversationId, otherParticipant, onBack }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    // Initialize socket (reuse existing connection if available)
    const socket = getSocket();
    if (!socket) {
      console.error("Failed to initialize socket");
      return;
    }

    socketRef.current = socket;

    // Join conversation room
    socket.emit("join_conversation", conversationId);

    // Load existing messages
    loadMessages();

    // Listen for new messages
    socket.on("new_message", (data: { message: Message }) => {
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socket.on("user_typing", (data: { userId: string; userName: string }) => {
      if (data.userId !== otherParticipant._id) return;
      setIsTyping(true);
    });

    socket.on("user_stopped_typing", () => {
      setIsTyping(false);
    });

    // Cleanup
    return () => {
      socket.emit("leave_conversation", conversationId);
      socket.off("new_message");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };
  }, [conversationId, otherParticipant._id, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Emit typing indicator
    const socket = getSocket();
    if (socket) {
      socket.emit("typing", { conversationId });

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout to stop typing
      const timeout = setTimeout(() => {
        socket.emit("stop_typing", { conversationId });
      }, 1000);
      setTypingTimeout(timeout);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Stop typing indicator
    const socket = getSocket();
    if (socket) {
      socket.emit("stop_typing", { conversationId });
    }

    try {
      // Send via socket.io (preferred for real-time)
      if (socket) {
        socket.emit("send_message", { conversationId, content });
      } else {
        // Fallback to REST API
        await chatAPI.sendMessage(conversationId, content);
        await loadMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getCurrentUserId = () => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user._id || user.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center bg-[#F4F6FF] px-6 pb-24 pt-10">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--primary-blue)] border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col bg-[#F4F6FF] px-6 pb-24 pt-6">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-lg shadow-[rgba(18,8,75,0.05)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full p-2 text-[var(--primary-blue)] transition hover:bg-[#F4F6FF]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-[var(--dark-navy)]">{otherParticipant.fullName}</h1>
            <p className="text-xs text-gray-500 capitalize">{otherParticipant.role.replace("_", " ")}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <section className="flex flex-1 flex-col gap-4 overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-[rgba(18,8,75,0.08)]">
        <div className="flex flex-col gap-4 overflow-y-auto pb-2 px-2 max-h-[60vh]">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender._id === currentUserId;
              return (
                <div
                  key={message._id}
                  className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative max-w-[80%] rounded-3xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                      isOwnMessage
                        ? "rounded-br-md bg-[var(--primary-blue)] text-white"
                        : "rounded-bl-md bg-[#E8EDFF] text-[var(--dark-navy)]"
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="mb-1 text-xs font-semibold opacity-80">{message.sender.fullName}</p>
                    )}
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    <span className={`mt-2 block text-[10px] opacity-70 ${isOwnMessage ? "text-right" : "text-left"}`}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-md bg-[#E8EDFF] px-4 py-3 text-sm font-medium text-[var(--primary-blue)]/90 shadow shadow-[rgba(18,8,75,0.08)]">
                <div className="flex items-center gap-2">
                  <span>{otherParticipant.fullName} is typing...</span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--primary-blue)]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--primary-blue)] delay-150" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--primary-blue)] delay-300" />
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl bg-[#F4F6FF] p-3">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            rows={2}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-[var(--dark-navy)] shadow-inner focus:border-[var(--primary-blue)] focus:outline-none"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-blue)] text-white transition hover:bg-[var(--primary-blue-light)] disabled:cursor-not-allowed disabled:bg-[var(--primary-blue)]/60"
          >
            {isSending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}

