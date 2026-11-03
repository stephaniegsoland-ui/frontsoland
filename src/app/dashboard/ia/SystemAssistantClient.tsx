"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Portal,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Bot, BrainCircuit, Sparkles, Search, MessagesSquare, ShieldCheck, Warehouse, Car, Users, ClipboardList, FileText, BellRing, Volume2, Mic, MicOff } from "lucide-react";
import { AvatarConfig } from "@/components/CartoonAvatar";
import { AvatarStudio } from "./AvatarStudio";

type AssistantMessage = {
  role: "assistant" | "user";
  text: string;
};

type AssistantResponse = {
  answer: string;
  provider: "deepseek" | "local";
  module?: string;
  user?: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type ModuleKnowledge = {
  key: string;
  title: string;
  description: string;
  questions: string[];
  answer: string;
};

const modules: ModuleKnowledge[] = [
  {
    key: "stock",
    title: "Stock e inventario",
    description: "Control de productos, materiales y niveles de existencias por categoría.",
    questions: ["stock", "inventario", "materiales", "existencias", "almacén", "categoría"],
    answer: "El módulo de stock te permite revisar existencias por categoría, detectar faltantes y mantener el control de inventario. Puedes consultar cantidades actuales, alertas de bajo stock y movimientos de materiales para reponer antes de que falten elementos clave.",
  },
  {
    key: "personal",
    title: "Personal",
    description: "Gestión de usuarios, perfiles, permisos y dotación del equipo.",
    questions: ["personal", "usuarios", "empleados", "dotación", "rol", "permiso"],
    answer: "El módulo de personal centraliza usuarios, roles, estado activo/inactivo y datos de contacto. También sirve para organizar la dotación y asignaciones del equipo de operaciones, administración y seguridad.",
  },
  {
    key: "vehiculos",
    title: "Vehículos",
    description: "Registro, estados, seguimiento y control operativo de la flota.",
    questions: ["vehículos", "flota", "camiones", "unidad", "kilometraje", "chofer"],
    answer: "El módulo de vehículos gestiona la flota, el estado operativo, la asignación de conductores y el historial de uso. Permite registrar unidades, revisar su condición y mantener el control de mantenimiento e inspecciones.",
  },
  {
    key: "seguridad",
    title: "Seguridad",
    description: "Inspecciones, prevención de riesgos, EPP y permisos de trabajo.",
    questions: ["seguridad", "epp", "permiso", "riesgo", "inspección", "hse"],
    answer: "El módulo de seguridad se enfoca en revisar EPP, permisos, riesgos y cumplimiento de seguridad. También permite controlar inspecciones, alertas operativas y tareas críticas para evitar incidentes.",
  },
  {
    key: "ambiente",
    title: "Ambiente",
    description: "Monitoreo ambiental, capacitaciones, residuos y simulacros.",
    questions: ["ambiente", "medio ambiente", "residuos", "simulacro", "capacitaciones", "riesgo ambiental"],
    answer: "El módulo de ambiente cubre capacitaciones, simulacros, gestión de residuos y cumplimiento ambiental. Sirve para llevar el control de documentación, actividades de prevención y seguimiento del desempeño ambiental.",
  },
  {
    key: "reportes",
    title: "Reportes",
    description: "Indicadores operativos, análisis de cumplimiento y seguimiento por áreas.",
    questions: ["reportes", "indicadores", "resumen", "estadísticas", "analítica", "dashboard"],
    answer: "El módulo de reportes consolida métricas de inventario, seguridad, flota y actividades para facilitar la toma de decisiones. Aquí puedes revisar KPI, cumplimiento del proceso y tendencias por período.",
  },
  {
    key: "procura",
    title: "Procura",
    description: "Solicitudes de materiales, compras y seguimiento de pedidos.",
    questions: ["procura", "compras", "solicitud", "materiales", "pedidos", "cotización"],
    answer: "Procura gestiona la solicitud de materiales y compras necesarias para la operación. Permite registrar requerimientos, revisar solicitudes y mantener trazabilidad del suministro y uso de materiales.",
  },
  {
    key: "timesheet",
    title: "Hoja de tiempo",
    description: "Registro de actividades y horas por usuario y período.",
    questions: ["tiempo", "horas", "timesheet", "actividades", "registro", "turno"],
    answer: "La hoja de tiempo permite registrar actividades, turnos y horas por usuario. Es útil para llevar el control operativo del personal y consolidar la carga de trabajo por día o período.",
  },
  {
    key: "chat",
    title: "Chat interno",
    description: "Comunicación rápida entre usuarios del sistema y grupos de trabajo.",
    questions: ["chat", "mensaje", "comunicación", "interno", "grupo", "notificación"],
    answer: "El chat interno permite comunicarse con otros usuarios o grupos de trabajo, compartir reportes rápidos y consultar novedades del sistema sin salir del panel principal.",
  },
  {
    key: "administracion",
    title: "Administración",
    description: "Empresas, documentos, retenciones, peajes y seguimiento administrativo.",
    questions: ["administración", "empresas", "retenciones", "peajes", "documentos", "compliance"],
    answer: "El módulo de administración cubre empresas relacionadas, documentos, retenciones, peajes y tareas del área administrativa. Tiene foco en control documental, validación y operación administrativa.",
  },
];

const quickPrompts = [
  "¿Cuántas retenciones pendientes tengo?",
  "¿Qué me permite hacer el módulo de stock?",
  "¿Cómo reviso seguridad y EPP?",
  "¿Qué puedo consultar en reportes?",
  "¿Cómo gestiono personal y usuarios?",
  "¿Qué tiene el módulo de vehículos?",
  "¿Qué puedo hacer en administración?",
];

function FloatingAvatarCreator({ username, photoData, userId, avatarConfig }: { username?: string; photoData?: string | null; userId: string; avatarConfig?: AvatarConfig | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <Portal>
          <Box
            position="fixed"
            inset={0}
            zIndex={60}
            bg="rgba(3, 7, 18, 0.58)"
            backdropFilter="blur(4px)"
            onClick={() => setOpen(false)}
          >
            <Box
              position="absolute"
              right={{ base: 4, md: 6 }}
              bottom={{ base: 20, md: 24 }}
              width={{ base: "calc(100vw - 32px)", xl: "min(980px, calc(100vw - 80px))" }}
              maxH="88vh"
              overflowY="auto"
              bg="linear-gradient(180deg, rgba(17, 19, 22, 0.96), rgba(10, 12, 16, 0.94))"
              border="1px solid"
              borderColor="rgba(250, 204, 21, 0.4)"
              borderRadius="2xl"
              boxShadow="0 28px 80px rgba(0,0,0,0.56)"
              onClick={(event) => event.stopPropagation()}
            >
              <Box p={3} borderBottom="1px solid" borderColor="whiteAlpha.200">
                <Flex justify="space-between" align="center" gap={3}>
                  <HStack gap={2}>
                    <Box
                      w={8}
                      h={8}
                      borderRadius="lg"
                      bg="linear-gradient(135deg, rgba(250, 204, 21, 0.22), rgba(250, 204, 21, 0.08))"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Sparkles size={15} color="#facc15" />
                    </Box>
                    <Text fontWeight="bold">Creador de avatar</Text>
                  </HStack>
                  <Button size="xs" variant="ghost" color="gray.400" onClick={() => setOpen(false)}>Cerrar</Button>
                </Flex>
              </Box>
              <Box p={{ base: 2, md: 3 }}>
                <AvatarStudio username={username || "Usuario"} photoData={photoData} userId={userId} initialConfig={avatarConfig} />
              </Box>
            </Box>
          </Box>
        </Portal>
      )}
      <Button
        position="fixed"
        right={{ base: 88, md: 92 }}
        bottom={{ base: 4, md: 6 }}
        zIndex={44}
        size="sm"
        bg="linear-gradient(135deg, rgba(250, 204, 21, 0.96), rgba(245, 158, 11, 0.96))"
        color="black"
        borderRadius="full"
        boxShadow="0 18px 36px rgba(245, 158, 11, 0.38)"
        px={3}
        py={2}
        h="52px"
        _hover={{ transform: "translateY(-1px)", boxShadow: "0 22px 42px rgba(245, 158, 11, 0.45)" }}
        onClick={() => setOpen((value) => !value)}
      >
        <HStack gap={2} align="center">
          <Box
            w={8}
            h={8}
            borderRadius="full"
            bg="rgba(0,0,0,0.08)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Sparkles size={14} />
          </Box>
          <Text fontWeight="bold" fontSize="sm">{open ? "Cerrar editor" : "Crear avatar"}</Text>
        </HStack>
      </Button>
    </>
  );
}

function getModuleHint(question: string) {
  const lowered = question.toLowerCase();
  for (const moduleItem of modules) {
    if (moduleItem.questions.some((keyword) => lowered.includes(keyword))) {
      return moduleItem;
    }
  }

  if (lowered.includes("seguridad") || lowered.includes("epp") || lowered.includes("permiso")) return modules.find((item) => item.key === "seguridad");
  if (lowered.includes("inventario") || lowered.includes("stock") || lowered.includes("material")) return modules.find((item) => item.key === "stock");
  if (lowered.includes("personal") || lowered.includes("usuario") || lowered.includes("empleado")) return modules.find((item) => item.key === "personal");
  if (lowered.includes("veh") || lowered.includes("flota") || lowered.includes("unidad")) return modules.find((item) => item.key === "vehiculos");
  if (lowered.includes("reporte") || lowered.includes("dashboard") || lowered.includes("indicador")) return modules.find((item) => item.key === "reportes");
  if (lowered.includes("chat") || lowered.includes("mensaje") || lowered.includes("notificacion")) return modules.find((item) => item.key === "chat");
  if (lowered.includes("admin") || lowered.includes("empresa") || lowered.includes("retencion")) return modules.find((item) => item.key === "administracion");
  return null;
}

function buildAssistantResponse(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) {
    return "Puedes preguntarme por cualquier módulo del sistema, por ejemplo: stock, personal, seguridad, vehículos, reportes o administración.";
  }

  const moduleMatch = getModuleHint(trimmed);
  if (moduleMatch) {
    return `${moduleMatch.answer} Si quieres, te puedo orientar sobre cómo usar ${moduleMatch.title.toLowerCase()} y qué revisar en cada flujo operativo.`;
  }

  const lower = trimmed.toLowerCase();

  if (lower.includes("ayuda") || lower.includes("como") || lower.includes("qué") || lower.includes("que")) {
    return "El sistema está organizado por módulos: stock, personal, vehículos, seguridad, ambiente, reportes, procura, tiempos, chat interno y administración. Puedes preguntarme por cualquiera de ellos para saber qué hace, cómo se usa y qué información revisa.";
  }

  if (lower.includes("todo") || lower.includes("sistema") || lower.includes("general")) {
    return "El sistema de Soland está pensado para cubrir operación, seguridad, administración y seguimiento. En conjunto, puedes controlar inventario, personal, flota, EPP, permisos, ambiente, reportes, tiempos y comunicación interna desde un mismo panel.";
  }

  if (lower.includes("urgente") || lower.includes("alerta") || lower.includes("riesgo")) {
    return "Lo más sensible del sistema es revisar seguridad, EPP y reportes de riesgo. Si hay alertas, lo recomendado es consultar seguridad, stock crítico y cualquier incidencia reciente en reportes antes de continuar con operaciones.";
  }

  return "Puedo ayudarte a consultar los módulos del sistema. Prueba preguntando por stock, personal, seguridad, vehículos, reportes, administración, chat o tiempos y te indicaré qué hace cada uno y cómo se usa.";
}

export function SystemAssistantClient({ username, photoData, userId, avatarConfig }: { username?: string; photoData?: string | null; userId: string; avatarConfig?: AvatarConfig | null }) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef("");

  useEffect(() => () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("El dictado por voz no está disponible en este navegador. Prueba con Chrome o Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-ES";
    voiceBaseRef.current = question.trim();
    setVoiceError("");
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interimTranscript += result[0].transcript;
      }
      const transcript = `${finalTranscript}${interimTranscript}`.trim();
      setQuestion([voiceBaseRef.current, transcript].filter(Boolean).join(" "));
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        "not-allowed": "No se permitió el acceso al micrófono. Revisa los permisos del navegador.",
        "audio-capture": "No se encontró un micrófono disponible.",
        "no-speech": "No se detectó voz. Puedes intentarlo de nuevo.",
        network: "Falló el servicio de reconocimiento de voz. Inténtalo de nuevo.",
      };
      setVoiceError(messages[event.error] || "No se pudo capturar la consulta por voz.");
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setVoiceError("No se pudo iniciar el micrófono. Revisa sus permisos e inténtalo de nuevo.");
    }
  };

  const speak = (text: string, index: number) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.onend = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: `Hola ${username || "usuario"}. Soy tu asistente de sistema. Puedo ayudarte a consultar stock, personal, seguridad, vehículos, reportes, administración y todo lo que compone Soland.`,
    },
  ]);

  const summary = useMemo(() => {
    const keys = modules.map((item) => item.title);
    return `${keys.length} módulos activos · stock, personal, seguridad, flota, reportes, ambiente, administración y más`;
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const userMessage = trimmed;
    setQuestion("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
      { role: "assistant", text: "Estoy consultando la respuesta del sistema..." },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });

      const data: AssistantResponse = await response.json();
      if (!response.ok) {
        throw new Error(data?.answer || "No se pudo consultar la IA.");
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", text: data.answer || buildAssistantResponse(userMessage) };
        return next;
      });
      if (data.answer) speak(data.answer, messages.length + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo contactar con la IA del sistema.";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", text: message || buildAssistantResponse(userMessage) };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      p={{ base: 4, md: 8 }}
      minH="100vh"
      color="white"
      bg="radial-gradient(circle at top left, rgba(250, 204, 21, 0.12), transparent 24%), radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.14), transparent 28%), #07090b"
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" inset={0} bg="linear-gradient(135deg, rgba(255,255,255,0.02), transparent 40%)" pointerEvents="none" />
      <Box position="absolute" top="10%" right="8%" w="240px" h="240px" borderRadius="50%" bg="radial-gradient(circle, rgba(250, 204, 21, 0.18), transparent 68%)" filter="blur(10px)" pointerEvents="none" />
      <Box position="absolute" bottom="8%" left="4%" w="220px" h="220px" borderRadius="50%" bg="radial-gradient(circle, rgba(56, 189, 248, 0.16), transparent 68%)" filter="blur(12px)" pointerEvents="none" />

      <Box maxW="7xl" mx="auto" position="relative" zIndex={1}>
        <Box
          mb={6}
          p={{ base: 4, md: 5 }}
          borderRadius="2xl"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          bg="linear-gradient(135deg, rgba(17, 19, 22, 0.96), rgba(10, 12, 16, 0.8))"
          boxShadow="0 26px 60px rgba(2,6,23,0.45)"
          backdropFilter="blur(14px)"
          position="relative"
        >
          <Box position="absolute" top={-3} right={5} px={2.5} py={1.5} borderRadius="full" bg="rgba(250, 204, 21, 0.12)" border="1px solid" borderColor="rgba(250,204,21,0.24)" fontSize="xs" color="yellow.200">IA activa</Box>
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <Box>
              <HStack gap={2} mb={2}>
                <Box
                  w={10}
                  h={10}
                  borderRadius="xl"
                  bg="linear-gradient(135deg, rgba(250, 204, 21, 0.24), rgba(250, 204, 21, 0.08))"
                  border="1px solid"
                  borderColor="rgba(250, 204, 21, 0.3)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <BrainCircuit color="#facc15" size={20} />
                </Box>
                <Text fontSize="sm" color="yellow.300" fontWeight="bold">Asistente IA del sistema</Text>
              </HStack>
              <Heading size="lg" letterSpacing="-0.03em">Consultas inteligentes de Soland</Heading>
            </Box>
            <Badge
              colorScheme="yellow"
              variant="subtle"
              px={3}
              py={1}
              borderRadius="full"
              border="1px solid"
              borderColor="rgba(250, 204, 21, 0.25)"
              bg="rgba(250, 204, 21, 0.08)"
            >
              {summary}
            </Badge>
          </Flex>
        </Box>

        <Grid templateColumns={{ base: "1fr", xl: "1.2fr 0.8fr" }} gap={6}>
          <Box position="relative">
            <Box position="absolute" top="-14px" left="28px" px={3} py={2} borderRadius="xl" bg="rgba(15, 118, 110, 0.18)" border="1px solid" borderColor="rgba(45, 212, 191, 0.3)" color="teal.200" fontSize="xs" fontWeight="bold" boxShadow="0 10px 24px rgba(45, 212, 191, 0.12)"> +24% seguridad</Box>
            <Box position="absolute" bottom="-12px" right="20px" px={3} py={2} borderRadius="xl" bg="rgba(59, 130, 246, 0.12)" border="1px solid" borderColor="rgba(96, 165, 250, 0.25)" color="blue.200" fontSize="xs" fontWeight="bold" boxShadow="0 10px 24px rgba(59, 130, 246, 0.1)"> Stock saludable</Box>
            <Box
              bg="linear-gradient(180deg, rgba(17, 19, 21, 0.96), rgba(12, 14, 18, 0.9))"
              borderRadius="3xl"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              p={4}
              boxShadow="0 22px 40px rgba(0,0,0,0.32)"
              position="relative"
              overflow="hidden"
            >
            <HStack justify="space-between" mb={4}>
              <HStack gap={2}>
                <Box p={2} borderRadius="lg" bg="rgba(250, 204, 21, 0.12)" border="1px solid" borderColor="rgba(250,204,21,0.22)">
                  <MessagesSquare size={18} color="#facc15" />
                </Box>
                <Text fontWeight="bold">Consulta al asistente</Text>
              </HStack>
              <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2.5} py={1}>Activo</Badge>
            </HStack>

            <VStack align="stretch" gap={3} mb={4} maxH="420px" overflowY="auto" pr={2}>
              {messages.map((msg, index) => (
                <Box
                  key={`${msg.role}-${index}`}
                  alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                  maxW="85%"
                  bg={msg.role === "user" ? "linear-gradient(135deg, rgba(250, 204, 21, 0.96), rgba(252, 211, 77, 0.88))" : "rgba(25, 29, 35, 0.96)"}
                  color={msg.role === "user" ? "black" : "white"}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={msg.role === "user" ? "rgba(250, 204, 21, 0.76)" : "rgba(255,255,255,0.08)"}
                  p={3}
                  boxShadow={msg.role === "user" ? "0 10px 24px rgba(250, 204, 21, 0.18)" : "none"}
                >
                  <HStack align="start" gap={2}>
                    <Text whiteSpace="pre-wrap" flex="1" lineHeight="1.6">{msg.text}</Text>
                    {msg.role === "assistant" && !msg.text.startsWith("Estoy consultando") && (
                      <Button size="xs" variant="ghost" aria-label="Leer respuesta" title="Leer respuesta" color="yellow.300" onClick={() => speak(msg.text, index)}>
                        <Volume2 size={14} color={speakingIndex === index ? "#facc15" : undefined} />
                      </Button>
                    )}
                  </HStack>
                </Box>
              ))}

              {isLoading && (
                <Box alignSelf="flex-start" bg="rgba(26, 29, 32, 0.96)" borderRadius="2xl" border="1px solid" borderColor="rgba(255,255,255,0.08)" p={3}>
                  <HStack gap={2}>
                    <Spinner size="sm" color="yellow.400" />
                    <Text color="gray.200">Consultando IA...</Text>
                  </HStack>
                </Box>
              )}
            </VStack>

            <form onSubmit={handleSubmit}>
              <VStack gap={3} align="stretch">
                <Box bg="rgba(10, 12, 15, 0.9)" borderRadius="2xl" border="1px solid" borderColor="rgba(255,255,255,0.1)" p={3}>
                  <Textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ej: ¿Qué puedo revisar en el módulo de seguridad y reportes?"
                    minH="110px"
                    bg="transparent"
                    border="none"
                    borderRadius="lg"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    resize="vertical"
                    _focus={{ boxShadow: "none", borderColor: "transparent" }}
                  />
                </Box>
                {isListening && <Text role="status" color="yellow.300" fontSize="sm">Escuchando tu consulta en español...</Text>}
                {voiceError && <Text role="alert" color="red.300" fontSize="sm">{voiceError}</Text>}

                <Flex justify="space-between" gap={3} wrap="wrap">
                  <HStack gap={2} flexWrap="wrap">
                    {quickPrompts.slice(0, 3).map((prompt) => (
                      <Button
                        key={prompt}
                        type="button"
                        size="sm"
                        variant="outline"
                        borderColor="rgba(255,255,255,0.15)"
                        color="gray.200"
                        bg="rgba(255,255,255,0.02)"
                        _hover={{ borderColor: "rgba(250,204,21,0.5)", bg: "rgba(250,204,21,0.08)" }}
                        onClick={() => setQuestion(prompt)}
                      >
                        {prompt.length > 24 ? `${prompt.slice(0, 24)}...` : prompt}
                      </Button>
                    ))}
                  </HStack>

                  <HStack gap={2}>
                    <Button
                      type="button"
                      variant="outline"
                      borderColor={isListening ? "red.400" : "rgba(255,255,255,0.2)"}
                      color={isListening ? "red.300" : "gray.100"}
                      bg="rgba(255,255,255,0.02)"
                      onClick={toggleVoiceInput}
                      disabled={isLoading}
                      aria-label={isListening ? "Detener dictado" : "Dictar consulta por voz"}
                      title={isListening ? "Detener dictado" : "Dictar consulta por voz"}
                    >
                      <HStack gap={2}>
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        <Text>{isListening ? "Detener" : "Hablar"}</Text>
                      </HStack>
                    </Button>
                    <Button
                      type="submit"
                      bg="linear-gradient(135deg, #facc15 0%, #f59e0b 100%)"
                      color="black"
                      fontWeight="bold"
                      _hover={{ filter: "brightness(1.05)", transform: "translateY(-1px)" }}
                      disabled={isLoading}
                    >
                      <HStack gap={2}>
                        <Search size={16} />
                        <Text>{isLoading ? "Consultando..." : "Consultar"}</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Flex>
              </VStack>
            </form>
            </Box>
          </Box>

          <VStack align="stretch" gap={4}>
            <Box
              bg="linear-gradient(180deg, rgba(17,19,21,0.96), rgba(12,14,18,0.9))"
              borderRadius="3xl"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              p={4}
              position="relative"
              overflow="hidden"
            >
              <Box position="absolute" top="-20px" right="12px" w="80px" h="80px" borderRadius="50%" bg="radial-gradient(circle, rgba(250, 204, 21, 0.18), transparent 68%)" />
              <HStack gap={2} mb={3}>
                <Box p={2} borderRadius="lg" bg="rgba(250, 204, 21, 0.12)" border="1px solid" borderColor="rgba(250,204,21,0.22)">
                  <Sparkles size={16} color="#facc15" />
                </Box>
                <Text fontWeight="bold">Módulos del sistema</Text>
              </HStack>
              <SimpleGrid columns={1} gap={3}>
                {modules.map((module) => (
                  <Box
                    key={module.key}
                    bg="rgba(23, 26, 29, 0.9)"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.07)"
                    p={3}
                    transition="all 0.2s ease"
                    _hover={{ transform: "translateY(-1px)", borderColor: "rgba(250, 204, 21, 0.3)", bg: "rgba(23, 26, 29, 1)" }}
                  >
                    <HStack align="start" gap={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="lg"
                        bg="linear-gradient(135deg, #facc15 0%, #fbbf24 100%)"
                        color="black"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 12px 18px rgba(250, 204, 21, 0.2)"
                      >
                        {module.key === "stock" && <Warehouse size={16} />}
                        {module.key === "personal" && <Users size={16} />}
                        {module.key === "vehiculos" && <Car size={16} />}
                        {module.key === "seguridad" && <ShieldCheck size={16} />}
                        {module.key === "reportes" && <FileText size={16} />}
                        {module.key === "administracion" && <ClipboardList size={16} />}
                        {module.key === "chat" && <BellRing size={16} />}
                        {module.key === "ambiente" && <Bot size={16} />}
                        {module.key === "timesheet" && <ClipboardList size={16} />}
                        {module.key === "procura" && <Warehouse size={16} />}
                      </Box>
                      <Box minW={0}>
                        <Text fontWeight="bold" mb={1}>{module.title}</Text>
                        <Text color="gray.400" fontSize="sm">{module.description}</Text>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Box
              bg="linear-gradient(180deg, rgba(17,19,21,0.96), rgba(12,14,18,0.9))"
              borderRadius="3xl"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              p={4}
              position="relative"
              overflow="hidden"
            >
              <Box position="absolute" bottom="-18px" left="12px" w="70px" h="70px" borderRadius="50%" bg="radial-gradient(circle, rgba(59, 130, 246, 0.16), transparent 68%)" />
              <HStack gap={2} mb={3}>
                <Box p={2} borderRadius="lg" bg="rgba(250, 204, 21, 0.12)" border="1px solid" borderColor="rgba(250,204,21,0.22)">
                  <Bot size={16} color="#facc15" />
                </Box>
                <Text fontWeight="bold">Ejemplos de consulta</Text>
              </HStack>
              <VStack align="stretch" gap={2}>
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="ghost"
                    justifyContent="flex-start"
                    color="gray.200"
                    _hover={{ bg: "rgba(250, 204, 21, 0.08)", color: "white" }}
                    onClick={() => setQuestion(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </VStack>
            </Box>
          </VStack>
        </Grid>
      </Box>
      <FloatingAvatarCreator username={username || "Usuario"} photoData={photoData} userId={userId} avatarConfig={avatarConfig} />
    </Box>
  );
}
