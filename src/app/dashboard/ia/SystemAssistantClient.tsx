"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Bot, BrainCircuit, Sparkles, Search, MessagesSquare, ShieldCheck, Warehouse, Car, Users, ClipboardList, FileText, BellRing, Volume2 } from "lucide-react";
import { AvatarConfig, CartoonAvatar } from "@/components/CartoonAvatar";
import { ThreeDAvatar } from "@/components/ThreeDAvatar";
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

function FloatingAvatarCreator({ username, photoData, avatarConfig, talking }: { username: string; photoData?: string | null; avatarConfig?: AvatarConfig | null; talking: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <Box position="fixed" right={{ base: 4, md: 6 }} bottom={{ base: 24, md: 28 }} zIndex={45} width={{ base: "calc(100vw - 32px)", sm: "300px" }} bg="#151719" border="1px solid" borderColor="yellow.500" borderRadius="xl" p={4} boxShadow="0 18px 48px rgba(0,0,0,0.5)">
          <HStack justify="space-between" mb={3}>
            <HStack gap={2}><Sparkles size={16} color="#facc15" /><Text fontWeight="bold">Mi avatar IA</Text></HStack>
            <Button size="xs" variant="ghost" color="gray.400" onClick={() => setOpen(false)}>Cerrar</Button>
          </HStack>
          <Flex direction="column" align="center" gap={3}>
            <Box width="128px" height="176px" borderRadius="54px 54px 24px 24px" overflow="hidden" bg="transparent" border="1px solid" borderColor="yellow.300" animation={talking ? "assistantFloat 0.55s ease-in-out infinite, assistantGlow 0.9s ease-in-out infinite" : "assistantFloat 3.2s ease-in-out infinite"}>
              <ThreeDAvatar config={avatarConfig} isTalking={talking} />
            </Box>
            <Text textAlign="center" color="gray.300" fontSize="sm">Este avatar se genera visualmente desde tu foto y se muestra en el sistema.</Text>
          </Flex>
        </Box>
      )}
      <Button position="fixed" right={{ base: 4, md: 6 }} bottom={{ base: 4, md: 6 }} zIndex={44} size="sm" bg="yellow.400" color="black" borderRadius="full" boxShadow="0 8px 24px rgba(0,0,0,0.35)" onClick={() => setOpen((value) => !value)}>
        <HStack gap={2}><Sparkles size={16} /><Text>{open ? "Ocultar avatar" : "Crear mi avatar"}</Text></HStack>
      </Button>
    </>
  );
}

function getModuleHint(question: string) {
  const lowered = question.toLowerCase();
  for (const module of modules) {
    if (module.questions.some((keyword) => lowered.includes(keyword))) {
      return module;
    }
  }

  if (lowered.includes("seguridad") || lowered.includes("epp") || lowered.includes("permiso")) return modules.find((m) => m.key === "seguridad");
  if (lowered.includes("inventario") || lowered.includes("stock") || lowered.includes("material")) return modules.find((m) => m.key === "stock");
  if (lowered.includes("personal") || lowered.includes("usuario") || lowered.includes("empleado")) return modules.find((m) => m.key === "personal");
  if (lowered.includes("veh") || lowered.includes("flota") || lowered.includes("unidad")) return modules.find((m) => m.key === "vehiculos");
  if (lowered.includes("reporte") || lowered.includes("dashboard") || lowered.includes("indicador")) return modules.find((m) => m.key === "reportes");
  if (lowered.includes("chat") || lowered.includes("mensaje") || lowered.includes("notificacion")) return modules.find((m) => m.key === "chat");
  if (lowered.includes("admin") || lowered.includes("empresa") || lowered.includes("retencion")) return modules.find((m) => m.key === "administracion");
  return null;
}

function buildAssistantResponse(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) {
    return "Puedes preguntarme por cualquier módulo del sistema, por ejemplo: stock, personal, seguridad, vehículos, reportes o administración.";
  }

  const module = getModuleHint(trimmed);
  if (module) {
    return `${module.answer} Si quieres, te puedo orientar sobre cómo usar ${module.title.toLowerCase()} y qué revisar en cada flujo operativo.`;
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
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

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
    <Box p={{ base: 4, md: 8 }} bg="#08080a" minH="100vh" color="white">
      <Box maxW="7xl" mx="auto">
        <AvatarStudio username={username || "Usuario"} photoData={photoData} userId={userId} initialConfig={avatarConfig} />
        <Flex justify="space-between" align="center" mb={6} gap={4} wrap="wrap">
          <Box>
            <HStack gap={2} mb={2}>
              <BrainCircuit color="#facc15" size={26} />
              <Text fontSize="sm" color="yellow.300" fontWeight="bold">Asistente IA del sistema</Text>
            </HStack>
            <Heading size="lg">Consultas inteligentes de Soland</Heading>
          </Box>
          <Badge colorScheme="yellow" variant="subtle" px={3} py={1} borderRadius="full">
            {summary}
          </Badge>
        </Flex>

        <Grid templateColumns={{ base: "1fr", xl: "1.2fr 0.8fr" }} gap={6}>
          <Box bg="#111315" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.200" p={4}>
            <HStack justify="space-between" mb={4}>
              <HStack gap={2}>
                <MessagesSquare size={18} color="#facc15" />
                <Text fontWeight="bold">Consulta al asistente</Text>
              </HStack>
              <Badge colorScheme="green" variant="subtle">Activo</Badge>
            </HStack>

            <VStack align="stretch" gap={3} mb={4} maxH="420px" overflowY="auto" pr={2}>
              {messages.map((msg, index) => (
                <Box
                  key={`${msg.role}-${index}`}
                  alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                  maxW="85%"
                  bg={msg.role === "user" ? "yellow.400" : "#1a1d20"}
                  color={msg.role === "user" ? "black" : "white"}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={msg.role === "user" ? "yellow.300" : "whiteAlpha.200"}
                  p={3}
                >
                  <HStack align="start" gap={2}>
                    <Text whiteSpace="pre-wrap" flex="1">{msg.text}</Text>
                    {msg.role === "assistant" && !msg.text.startsWith("Estoy consultando") && (
                      <Button size="xs" variant="ghost" aria-label="Leer respuesta" title="Leer respuesta" color="yellow.300" onClick={() => speak(msg.text, index)}>
                        <Volume2 size={14} color={speakingIndex === index ? "#facc15" : undefined} />
                      </Button>
                    )}
                  </HStack>
                </Box>
              ))}

              {isLoading && (
                <Box alignSelf="flex-start" bg="#1a1d20" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200" p={3}>
                  <HStack gap={2}>
                    <Spinner size="sm" color="yellow.400" />
                    <Text color="gray.200">Consultando IA...</Text>
                  </HStack>
                </Box>
              )}
            </VStack>

            <form onSubmit={handleSubmit}>
              <VStack gap={3} align="stretch">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ej: ¿Qué puedo revisar en el módulo de seguridad y reportes?"
                  minH="110px"
                  bg="#0d0e10"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  resize="vertical"
                />

                <Flex justify="space-between" gap={3} wrap="wrap">
                  <HStack gap={2} flexWrap="wrap">
                    {quickPrompts.slice(0, 3).map((prompt) => (
                      <Button
                        key={prompt}
                        type="button"
                        size="sm"
                        variant="outline"
                        borderColor="whiteAlpha.200"
                        color="gray.200"
                        onClick={() => setQuestion(prompt)}
                      >
                        {prompt.length > 24 ? `${prompt.slice(0, 24)}...` : prompt}
                      </Button>
                    ))}
                  </HStack>

                  <Button type="submit" bg="yellow.400" color="black" fontWeight="bold" _hover={{ bg: "yellow.300" }} disabled={isLoading}>
                    <HStack gap={2}>
                      <Search size={16} />
                      <Text>{isLoading ? "Consultando..." : "Consultar"}</Text>
                    </HStack>
                  </Button>
                </Flex>
              </VStack>
            </form>
          </Box>

          <VStack align="stretch" gap={4}>
            <Box bg="#111315" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.200" p={4}>
              <HStack gap={2} mb={3}>
                <Sparkles size={16} color="#facc15" />
                <Text fontWeight="bold">Módulos del sistema</Text>
              </HStack>
              <SimpleGrid columns={1} gap={3}>
                {modules.map((module) => (
                  <Box key={module.key} bg="#171a1d" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100" p={3}>
                    <HStack align="start" gap={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="lg"
                        bg="yellow.400"
                        color="black"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
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

            <Box bg="#111315" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.200" p={4}>
              <HStack gap={2} mb={3}>
                <Bot size={16} color="#facc15" />
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
      <FloatingAvatarCreator username={username || "Usuario"} photoData={photoData} avatarConfig={avatarConfig} talking={isLoading || speakingIndex !== null} />
    </Box>
  );
}
