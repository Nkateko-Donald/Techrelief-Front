"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";

interface NotificationData {
  id: number;
  type: "user" | "broadcast" | "success";
  title: string;
  content: string;
  isRead: boolean;
  link: string;
  createdAt: Date; // Only keep this date property
}

interface NotificationContextType {
  showNotification: (data: Omit<NotificationData, "id" | "isRead">) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  notifications: NotificationData[];
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://myappapi-yo3p.onrender.com";

  // Add a new notification
  const showNotification = useCallback(
    (data: Omit<NotificationData, "id" | "isRead">) => {
      setNotifications((prev) => [
        {
          ...data,
          id: Date.now(),
          isRead: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    },
    []
  );

  // Mark a notification as read
  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await fetch(`${BASE}/api/messages/${user?.UserID}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: id }),
        });

        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [BASE]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch(`${BASE}/api/messages/${user?.UserID}/mark-all-read`, {
        method: "POST",
        credentials: "include",
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [BASE]);

  // Fetch unread count (now without Auth dependency)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(
        `${BASE}/api/messages/${user?.UserID}/unread-count`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Notification count from server:", data.count);
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [BASE]);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        markAsRead,
        markAllAsRead,
        notifications,
        unreadCount,
        fetchUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
