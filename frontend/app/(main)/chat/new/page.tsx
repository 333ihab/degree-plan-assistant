"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { chatAPI } from "../../../lib/api";
import ChatWindow from "../../../components/chat/ChatWindow";

type Advisor = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  school?: string;
  major?: string;
};

export default function NewConversationPage() {
  const router = useRouter();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    loadAdvisors();
  }, [router]);

  const loadAdvisors = async () => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getAvailableAdvisors();
      setAdvisors(response.advisors || response.students || []);
    } catch (error) {
      console.error("Failed to load advisors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async (advisor: Advisor) => {
    try {
      setIsCreating(true);
      const response = await chatAPI.getOrCreateConversation(advisor._id);
      setConversationId(response.conversation._id);
      setSelectedAdvisor(advisor);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (selectedAdvisor && conversationId) {
    return (
      <ChatWindow
        conversationId={conversationId}
        otherParticipant={selectedAdvisor}
        onBack={() => {
          setSelectedAdvisor(null);
          setConversationId(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col bg-[#F4F6FF] px-6 pb-24 pt-10">
      <header className="mb-6">
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--primary-blue)] shadow-md shadow-[rgba(18,8,75,0.08)] transition hover:-translate-y-1 hover:shadow-lg mb-4"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--dark-navy)]">Start a Conversation</h1>
        <p className="mt-2 text-sm text-gray-600">
          Select an advisor, mentor, or student to start chatting.
        </p>
      </header>

      <section className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--primary-blue)] border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        ) : advisors.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-lg shadow-[rgba(18,8,75,0.05)]">
            <p className="text-sm text-gray-600">No advisors or students available.</p>
          </div>
        ) : (
          advisors.map((advisor) => (
            <button
              key={advisor._id}
              onClick={() => handleStartConversation(advisor)}
              disabled={isCreating}
              className="w-full rounded-3xl bg-white p-5 text-left shadow-lg shadow-[rgba(18,8,75,0.05)] transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--dark-navy)]">{advisor.fullName}</h2>
                  <p className="text-sm font-medium text-[var(--primary-blue)] capitalize mt-1">
                    {advisor.role.replace("_", " ")}
                  </p>
                  {advisor.school && (
                    <p className="text-xs text-gray-500 mt-1">{advisor.school}</p>
                  )}
                </div>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-[var(--primary-blue)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}



