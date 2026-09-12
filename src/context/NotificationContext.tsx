"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Box, Text } from "@chakra-ui/react";

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

function parseNotificationPayload(payload: unknown): NotificationItem | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const id = record.id ? String(record.id) : crypto.randomUUID();
  const rawMessage = String(record.message || "Tienes una nueva notificación.");
  const rawTitle = String(record.title || "Notificación");

  let title = rawTitle;
  let message = rawMessage;

  if (rawTitle === "Nuevo mensaje") {
    const match = rawMessage.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      title = match[1];
      message = match[2] || "Tienes un mensaje nuevo.";
    }
  }

  const rawType = record.type;
  const type = rawType === "success" || rawType === "error" ? rawType : "info";
  const read = Boolean(record.read);
  const createdAt = String(record.created_at ?? record.createdAt ?? new Date().toISOString());
  return { id, title, message, type, read, createdAt };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const originalTitleRef = useRef<string | null>(null);

  const triggerIncomingAlert = useCallback((notification: NotificationItem) => {
    if (typeof window === "undefined") return;

    const AudioConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioConstructor) {
      try {
        const context = new AudioConstructor();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.0001;

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
        oscillator.stop(context.currentTime + 0.38);

        void context.resume();
      } catch (error) {
        console.warn("No se pudo reproducir el sonido de nueva notificación.", error);
      }
    }

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(notification.title, {
          body: notification.message,
          tag: `soland-${notification.id}`,
        });
      } catch (error) {
        console.warn("No se pudo mostrar la notificación del navegador.", error);
      }
    }

    const nextTitle = notification.title || "Nueva notificación";
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title || "Soland";
    }
    document.title = `${nextTitle} • ${originalTitleRef.current}`;
    window.setTimeout(() => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationItem, "id" | "read" | "createdAt">) => {
    const nextNotification: NotificationItem = {
      id: crypto.randomUUID(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [nextNotification, ...prev]);
    setToasts((prev) => [nextNotification, ...prev].slice(0, 3));
    triggerIncomingAlert(nextNotification);
  }, [triggerIncomingAlert]);

  const addServerNotification = useCallback((payload: unknown) => {
    const notification = parseNotificationPayload(payload);
    if (!notification) return;
    setNotifications((prev) => [notification, ...prev]);
    setToasts((prev) => [notification, ...prev].slice(0, 3));
    triggerIncomingAlert(notification);
  }, [triggerIncomingAlert]);

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
        console.warn("Notificaciones no disponibles por timeout o backend caído.", err);
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
          console.warn("SSE de notificaciones sin respuesta; se reintenta más tarde.", error);
          if (eventSource?.readyState === EventSource.CLOSED) {
            setTimeout(() => connectSse(), 5000);
          }
        });
      } catch (error) {
        console.warn("No se pudo conectar al SSE de notificaciones:", error);
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

  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  const value = useMemo(
    () => ({ notifications, unreadCount, addNotification, markAllAsRead, clearNotifications }),
    [notifications, unreadCount, addNotification, markAllAsRead, clearNotifications],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Box position="fixed" top={4} right={4} zIndex={1200} pointerEvents="none" display="flex" flexDirection="column" gap={2}>
        {toasts.map((toast) => (
          <Box
            key={toast.id}
            bg={toast.type === "error" ? "red.500" : toast.type === "success" ? "green.500" : "blue.500"}
            color="white"
            borderRadius="lg"
            boxShadow="lg"
            maxW="360px"
            p={3}
            pointerEvents="auto"
            display="flex"
            alignItems="flex-start"
            gap={3}
          >
            <Box flex="1">
              <Text fontWeight="bold" fontSize="sm">
                {toast.title}
              </Text>
              <Text fontSize="sm" mt={1}>
                {toast.message}
              </Text>
            </Box>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => dismissToast(toast.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </Box>
        ))}
      </Box>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
