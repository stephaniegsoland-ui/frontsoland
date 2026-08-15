"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type NotificationType = "success" | "error" | "info";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, "id" | "read" | "createdAt">) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function parseNotificationPayload(payload: any): NotificationItem | null {
  if (!payload || typeof payload !== "object") return null;
  const id = payload.id ? String(payload.id) : crypto.randomUUID();
  const title = String(payload.title || "Notificación");
  const message = String(payload.message || "Tienes una nueva notificación.");
  const type = payload.type === "success" || payload.type === "error" ? payload.type : "info";
  const read = Boolean(payload.read);
  const createdAt = payload.created_at || payload.createdAt || new Date().toISOString();
  return { id, title, message, type, read, createdAt };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationItem, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const addServerNotification = useCallback((payload: any) => {
    const notification = parseNotificationPayload(payload);
    if (!notification) return;
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const parsed = data
          .map(parseNotificationPayload)
          .filter((item): item is NotificationItem => item !== null);
        if (isMounted) {
          setNotifications(parsed);
        }
      } catch (err) {
        console.error("Error cargando notificaciones:", err);
      }
    }

    function connectSse() {
      try {
        eventSource = new EventSource("/api/notifications/stream", { withCredentials: true });

        eventSource.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(event.data || "{}");
            addServerNotification(payload);
          } catch (error) {
            console.error("Error parseando evento SSE de notificaciones:", error);
          }
        });

        eventSource.addEventListener("error", (error) => {
          console.warn("SSE de notificaciones se desconectó, reintentando en 5s", error);
          if (eventSource?.readyState === EventSource.CLOSED) {
            setTimeout(() => connectSse(), 5000);
          }
        });
      } catch (error) {
        console.error("No se pudo conectar al SSE de notificaciones:", error);
      }
    }

    loadNotifications();
    connectSse();

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [addServerNotification]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, addNotification, markAllAsRead, clearNotifications }),
    [notifications, unreadCount, addNotification, markAllAsRead, clearNotifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
