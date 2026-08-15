"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Spinner,
  Badge,
  Stack,
  Avatar,
} from "@chakra-ui/react";
import { SendHorizonal, MessageSquareText } from "lucide-react";

interface CurrentUser {
  id: string;
  username: string;
  level: number;
  email: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_username?: string | null;
}

export function ChatInternalClient({ currentUser }: { currentUser: CurrentUser }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    try {
      const token = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("access_token="));

      const response = await fetch("http://localhost:8000/api/chat/", {
        headers: {
          Authorization: `Bearer ${token?.split("=")[1] ?? ""}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const token = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("access_token="));

      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token?.split("=")[1] ?? ""}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const msg = await response.json();
        setMessages((prev) => [...prev, msg]);
        setDraft("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const sortedMessages = useMemo(() => [...messages].sort((a, b) => a.created_at.localeCompare(b.created_at)), [messages]);

  return (
    <Box p={{ base: 4, md: 8 }} bg="gray.50" minH="100vh">
      <Box maxW="6xl" mx="auto" bg="white" borderRadius="2xl" boxShadow="md" overflow="hidden">
        <Box bg="black" color="white" p={6}>
          <HStack justify="space-between">
            <Box>
              <Heading size="md">Chat interno de la empresa</Heading>
              <Text color="gray.300" mt={1}>Mensajes compartidos entre usuarios del sistema</Text>
            </Box>
            <Badge colorScheme="green">En línea</Badge>
          </HStack>
        </Box>

        <Box p={6}>
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="lg" color="yellow.400" />
            </Flex>
          ) : (
            <VStack gap={4} align="stretch">
              {sortedMessages.length === 0 ? (
                <Box border="1px dashed" borderColor="gray.200" borderRadius="xl" p={8} textAlign="center">
                  <MessageSquareText size={32} style={{ margin: "0 auto", color: "#facc15" }} />
                  <Text mt={3} fontWeight="semibold">Aún no hay mensajes</Text>
                  <Text color="gray.500">Sé el primero en abrir el canal de comunicación interna.</Text>
                </Box>
              ) : (
                sortedMessages.map((message) => {
                  const isMine = message.sender_id === currentUser.id;
                  return (
                    <Flex key={message.id} justify={isMine ? "flex-end" : "flex-start"}>
                      <Box maxW="80%" borderRadius="2xl" p={4} bg={isMine ? "yellow.400" : "gray.100"} color={isMine ? "black" : "gray.800"}>
                        <HStack justify="space-between" mb={2} gap={4}>
                          <Text fontSize="sm" fontWeight="bold">
                            {message.sender_username || "Usuario"}
                          </Text>
                          <Text fontSize="xs" opacity={0.7}>
                            {new Date(message.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                          </Text>
                        </HStack>
                        <Text whiteSpace="pre-wrap">{message.content}</Text>
                      </Box>
                    </Flex>
                  );
                })
              )}
            </VStack>
          )}

          <Stack direction={{ base: "column", md: "row" }} gap={3} mt={6}>
            <Input
              placeholder="Escribe un mensaje para todo el equipo..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} colorScheme="yellow" loading={sending} disabled={!draft.trim()}>
              <HStack gap={2}>
                <SendHorizonal size={16} />
                <Text>Enviar</Text>
              </HStack>
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
