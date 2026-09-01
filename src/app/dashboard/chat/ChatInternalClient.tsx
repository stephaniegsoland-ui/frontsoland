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
  Link,
} from "@chakra-ui/react";
import { SendHorizonal, MessageSquareText, FileText, HelpCircle, BellDot, ClipboardList, Users, UserRound, Search } from "lucide-react";

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
  recipient_id?: string | null;
  created_at: string;
  sender_username?: string | null;
  message_type?: string;
  reference_title?: string | null;
  reference_url?: string | null;
}

interface ChatUser {
  id: string;
  username: string;
  nombre_completo?: string | null;
  department?: string | null;
}

const quickReports = [
  {
    title: "Reporte de seguridad",
    url: "/dashboard/seguridad-permisos",
    template: "Necesito revisar el reporte de seguridad del turno y confirmar si quedó todo resuelto.",
  },
  {
    title: "Inventario",
    url: "/dashboard/stock",
    template: "Necesito información del stock disponible en almacén y los movimientos recientes.",
  },
  {
    title: "Personal",
    url: "/dashboard/personal",
    template: "Quiero revisar el estado de la dotación y la disponibilidad del personal.",
  },
  {
    title: "Vehículos",
    url: "/dashboard/vehiculos",
    template: "Necesito un resumen de los vehículos y sus condiciones actuales.",
  },
];

const typeStyles: Record<string, { label: string; color: string; bg: string }> = {
  info: { label: "Información", color: "gray.200", bg: "whiteAlpha.200" },
  question: { label: "Pregunta", color: "blue.200", bg: "blue.900" },
  report: { label: "Reporte", color: "orange.200", bg: "orange.900" },
  update: { label: "Actualización", color: "green.200", bg: "green.900" },
  alert: { label: "Alerta", color: "red.200", bg: "red.900" },
};

export function ChatInternalClient({ currentUser, compact = false }: { currentUser: CurrentUser; compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState("info");
  const [selectedReport, setSelectedReport] = useState(quickReports[0]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [conversation, setConversation] = useState("group");
  const [userSearch, setUserSearch] = useState("");

  const loadMessages = async () => {
    try {
      const response = await fetch("/api/chat/", {
        credentials: "include",
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

  const loadChatUsers = async () => {
    try {
      const response = await fetch("/api/chat/users", { credentials: "include", cache: "no-store" });
      if (response.ok) setChatUsers(await response.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadMessages();
    void loadChatUsers();
    const interval = setInterval(() => {
      void loadMessages();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content,
          message_type: messageType,
          recipient_id: conversation === "group" ? null : conversation,
          reference_title: selectedReport?.title ?? null,
          reference_url: selectedReport?.url ?? null,
        }),
      });

      if (response.ok) {
        const msg = await response.json();
        setMessages((prev) => [...prev, msg]);
        setDraft("");
        setMessageType("info");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const sortedMessages = useMemo(
    () => messages
      .filter((message) => conversation === "group"
        ? !message.recipient_id
        : message.sender_id === conversation || message.recipient_id === conversation)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messages, conversation],
  );

  const selectedUser = chatUsers.find((user) => user.id === conversation);
  const filteredUsers = chatUsers.filter((user) => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return true;
    return `${user.username} ${user.nombre_completo ?? ""} ${user.department ?? ""}`.toLowerCase().includes(term);
  });

  const applyTemplate = (report: (typeof quickReports)[number]) => {
    setSelectedReport(report);
    setMessageType("report");
    setDraft(report.template);
  };

  return (
    <Box p={compact ? 0 : { base: 4, md: 8 }} bg={compact ? "#0f1012" : "#08080a"} color="white" h={compact ? "100%" : "auto"} minH={compact ? 0 : "100vh"} overflowY={compact ? "auto" : "visible"} css={compact ? { "&::-webkit-scrollbar": { width: "6px" }, "&::-webkit-scrollbar-thumb": { background: "#52525b", borderRadius: "6px" } } : undefined}>
      <Box maxW={compact ? "none" : "7xl"} mx="auto" bg="#0f1012" border={compact ? "none" : "1px solid"} borderColor="whiteAlpha.100" borderRadius={compact ? "none" : "xl"} boxShadow={compact ? "none" : "0 18px 45px rgba(0,0,0,0.28)"} overflow="hidden">
        <Box bg="#141518" color="white" p={compact ? 4 : 6} borderBottom="1px solid" borderColor="whiteAlpha.100" position={compact ? "sticky" : "static"} top={0} zIndex={1}>
          <HStack justify="space-between" align="center" gap={4} wrap="wrap">
            <Box>
              <Heading size="md">{conversation === "group" ? "Chat grupal de la empresa" : `Chat con ${selectedUser?.nombre_completo || selectedUser?.username || "usuario"}`}</Heading>
              <Text color="gray.300" mt={1}>{conversation === "group" ? "Conversación general para todo el equipo" : "Conversación privada entre usuarios registrados"}</Text>
            </Box>
            <HStack>
              <Badge colorScheme="green">En línea</Badge>
              <Box
                w={8}
                h={8}
                borderRadius="full"
                bg="yellow.400"
                color="black"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
              >
                {currentUser.username.slice(0, 2).toUpperCase()}
              </Box>
            </HStack>
          </HStack>
        </Box>

        <Box p={compact ? 4 : 6} pb={compact ? 10 : 6}>
          <Box mb={5} bg="#17191c" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200" overflow="hidden">
            <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
              <HStack justify="space-between" mb={3}>
                <HStack gap={2}><Users size={17} color="#facc15" /><Text fontSize="sm" fontWeight="bold" color="yellow.300">Conversaciones</Text></HStack>
                <Badge colorScheme="yellow">{chatUsers.length + 1}</Badge>
              </HStack>
              <HStack bg="#0f1012" border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" px={3}>
                <Search size={15} color="#71717a" />
                <Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar usuario..." border="none" _focus={{ boxShadow: "none" }} bg="transparent" color="white" _placeholder={{ color: "gray.500" }} />
              </HStack>
            </Box>
            <VStack align="stretch" gap={0} maxH={{ base: "260px", md: "320px" }} overflowY="auto" p={2}>
              <Button justifyContent="flex-start" variant="ghost" bg={conversation === "group" ? "whiteAlpha.100" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.100" }} onClick={() => setConversation("group")} px={3} py={6}>
                <HStack gap={3} width="100%"><Box w={9} h={9} borderRadius="full" bg="yellow.400" color="black" display="flex" alignItems="center" justifyContent="center"><Users size={17} /></Box><Box textAlign="left"><Text fontWeight="bold">Grupo general</Text><Text fontSize="xs" color="gray.500">Todos los usuarios</Text></Box></HStack>
              </Button>
              {filteredUsers.map((user) => (
                <Button key={user.id} justifyContent="flex-start" variant="ghost" bg={conversation === user.id ? "whiteAlpha.100" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.100" }} onClick={() => setConversation(user.id)} px={3} py={6}>
                  <HStack gap={3} width="100%"><Box w={9} h={9} borderRadius="full" bg="blue.700" color="blue.100" display="flex" alignItems="center" justifyContent="center"><UserRound size={17} /></Box><Box textAlign="left" overflow="hidden"><Text fontWeight="bold" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{user.nombre_completo || user.username}</Text><Text fontSize="xs" color="gray.500" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{user.department || user.username}</Text></Box></HStack>
                </Button>
              ))}
              {filteredUsers.length === 0 ? <Text color="gray.500" fontSize="sm" px={3} py={4}>No hay usuarios que coincidan.</Text> : null}
            </VStack>
          </Box>

          <Box mb={compact ? 4 : 6} bg="#17191c" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200" p={4}>
            <HStack align="center" justify="space-between" wrap="wrap" mb={3}>
              <Text fontWeight="bold">Compartir información rápida</Text>
              <Badge colorScheme="yellow">Reportes disponibles</Badge>
            </HStack>
            <Stack direction={{ base: "column", md: "row" }} gap={3}>
              {quickReports.map((report) => (
                <Button
                  key={report.title}
                  size="sm"
                  variant={selectedReport?.title === report.title ? "solid" : "outline"}
                  colorScheme="yellow"
                  onClick={() => applyTemplate(report)}
                >
                  <HStack gap={2}>
                    <FileText size={14} />
                    <Text>{report.title}</Text>
                  </HStack>
                </Button>
              ))}
            </Stack>
          </Box>

          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="lg" color="yellow.400" />
            </Flex>
          ) : (
            <VStack gap={4} align="stretch">
              {sortedMessages.length === 0 ? (
                <Box border="1px dashed" borderColor="whiteAlpha.300" borderRadius="lg" p={8} textAlign="center" bg="#121315">
                  <MessageSquareText size={32} style={{ margin: "0 auto", color: "#facc15" }} />
                  <Text mt={3} fontWeight="semibold">Aún no hay mensajes en esta conversación</Text>
                  <Text color="gray.500">Escribe un mensaje para iniciar la conversación.</Text>
                </Box>
              ) : (
                sortedMessages.map((message) => {
                  const isMine = message.sender_id === currentUser.id;
                  const typeInfo = typeStyles[message.message_type ?? "info"] ?? typeStyles.info;
                  return (
                    <Flex key={message.id} justify={isMine ? "flex-end" : "flex-start"}>
                      <Box maxW={{ base: "100%", md: "80%" }} borderRadius="lg" p={4} bg={isMine ? "yellow.400" : "#1b1e23"} color={isMine ? "black" : "gray.100"} border="1px solid" borderColor={isMine ? "yellow.300" : "whiteAlpha.100"}>
                        <HStack justify="space-between" mb={2} gap={4} wrap="wrap">
                          <HStack gap={2}>
                            <Text fontSize="sm" fontWeight="bold">
                              {message.sender_username || "Usuario"}
                            </Text>
                            <Badge color={typeInfo.color} bg={typeInfo.bg} borderRadius="full">
                              {typeInfo.label}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" opacity={0.7}>
                            {new Date(message.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                          </Text>
                        </HStack>
                        <Text whiteSpace="pre-wrap">{message.content}</Text>
                        {message.reference_title && message.reference_url ? (
                            <Box mt={3} p={2.5} borderRadius="md" bg={isMine ? "rgba(0,0,0,0.10)" : "blackAlpha.300"}>
                            <Text fontSize="xs" fontWeight="bold" mb={1}>Referencia compartida</Text>
                            <Link href={message.reference_url} color={isMine ? "black" : "blue.600"} fontSize="sm" fontWeight="semibold">
                              {message.reference_title}
                            </Link>
                          </Box>
                        ) : null}
                      </Box>
                    </Flex>
                  );
                })
              )}
            </VStack>
          )}

          <Box mt={6} borderTop="1px solid" borderColor="whiteAlpha.200" pt={4}>
            <Stack direction={{ base: "column", md: "row" }} gap={3}>
              <Box maxW={{ md: "220px" }} w="100%">
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    background: "#17191c",
                    color: "#f4f4f5",
                  }}
                >
                  <option value="info">Información</option>
                  <option value="question">Pregunta</option>
                  <option value="report">Reporte</option>
                  <option value="update">Actualización</option>
                  <option value="alert">Alerta</option>
                </select>
              </Box>
            </Stack>

            <Stack direction={{ base: "column", md: "row" }} gap={3} mt={3}>
              <Input
                placeholder="Escribe un mensaje para el equipo..."
                value={draft}
                bg="#17191c"
                color="white"
                borderColor="whiteAlpha.200"
                _placeholder={{ color: "gray.500" }}
                _hover={{ borderColor: "yellow.400" }}
                _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #facc15" }}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <Button onClick={() => void handleSend()} colorScheme="yellow" loading={sending} disabled={!draft.trim()}>
                <HStack gap={2}>
                  <SendHorizonal size={16} />
                  <Text>Enviar</Text>
                </HStack>
              </Button>
            </Stack>

            <HStack mt={3} gap={2} wrap="wrap">
              <Button size="sm" variant="ghost" onClick={() => setDraft("Necesito información sobre este tema y me gustaría confirmar los detalles.") }>
                <HStack gap={2}>
                  <HelpCircle size={14} />
                  <Text>Pedir información</Text>
                </HStack>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft("Actualización del equipo: revisar este punto y dejar evidencia clara para coordinación.") }>
                <HStack gap={2}>
                  <BellDot size={14} />
                  <Text>Actualizar</Text>
                </HStack>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft("Adjunto el detalle del reporte para revisión del equipo y seguimiento.") }>
                <HStack gap={2}>
                  <ClipboardList size={14} />
                  <Text>Compartir reporte</Text>
                </HStack>
              </Button>
            </HStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
