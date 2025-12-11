"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { chatAPI } from "../../lib/api";
import { getSocket, initializeSocket } from "../../lib/socket";

const classNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type NavItem = {
  label: string;
  href: string;
  icon: (active: boolean) => JSX.Element;
};

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={classNames("h-6 w-6", active ? "fill-current" : "stroke-current")}
      >
        <path
          d="M12 3 3 10h2v9h5v-5h4v5h5v-9h2z"
          className={active ? "" : "fill-none"}
          strokeWidth={active ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Resources",
    href: "/resources",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={classNames("h-6 w-6", active ? "fill-current" : "stroke-current")}
      >
        <path
          d="M5 4h14v16H5z"
          className={active ? "" : "fill-none"}
          strokeWidth={active ? 0 : 1.8}
          strokeLinejoin="round"
        />
        <path
          d="M9 8h6M9 12h6M9 16h4"
          fill="none"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Chat",
    href: "/chat",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={classNames("h-6 w-6", active ? "fill-current" : "stroke-current")}
      >
        <path
          d="M4 5h16v11H7l-3 3z"
          className={active ? "" : "fill-none"}
          strokeWidth={active ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={9} cy={10} r={1.2} />
        <circle cx={12} cy={10} r={1.2} />
        <circle cx={15} cy={10} r={1.2} />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/settings",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={classNames("h-6 w-6", active ? "fill-current" : "stroke-current")}
      >
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 2-6 4v1h12v-1c0-2-2.67-4-6-4Z"
          className={active ? "" : "fill-none"}
          strokeWidth={active ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    // Load unread count
    const loadUnreadCount = async () => {
      try {
        const response = await chatAPI.getConversations();
        const totalUnread = response.conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Failed to load unread count:", error);
      }
    };

    loadUnreadCount();

    // Initialize socket and listen for updates
    const socket = initializeSocket();
    
    if (socket) {
      socket.on("conversation_updated", () => {
        loadUnreadCount();
      });

      socket.on("new_message", () => {
        loadUnreadCount();
      });
    }

    // Refresh unread count periodically (every 30 seconds)
    const interval = setInterval(loadUnreadCount, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("conversation_updated");
        socket.off("new_message");
      }
    };
  }, []);

  return (
    <nav className="sticky bottom-0 border-t border-white/10 bg-[var(--dark-navy)]/95 text-white shadow-[0_-4px_20px_rgba(18,8,75,0.2)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-6">
        {navItems.map((item) => {
          const hasChildRoute = pathname.startsWith(`${item.href}/`);
          const isActive = pathname === item.href || hasChildRoute;
          const isChat = item.href === "/chat";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                {item.icon(isActive)}
                {isChat && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


