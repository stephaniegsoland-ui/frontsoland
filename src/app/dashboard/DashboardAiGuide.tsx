"use client";

import { FormEvent, useEffect, useState } from "react";
import { Box, Button, Flex, HStack, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { ArrowRight, Bot, MessageCircle, Send, Sparkles } from "lucide-react";
import NextLink from "next/link";
import { AvatarConfig, CartoonAvatar as SharedCartoonAvatar } from "@/components/CartoonAvatar";
import { ThreeDAvatar } from "@/components/ThreeDAvatar";

type DashboardAiGuideProps = {
  username: string;
  photoData?: string | null;
  avatarConfig?: AvatarConfig | null;
};

const positiveMessages = [
  "Hoy tienes todo lo necesario para avanzar con claridad.",
  "Un paso bien registrado hace que toda la operación sea más segura.",
  "Puedo ayudarte a encontrar el módulo correcto y entender cada flujo.",
];

const suggestedQuestions = [
  "¿Cuántas retenciones pendientes tengo?",
  "¿Cómo registro un peaje?",
  "¿Dónde reviso el stock?",
];

export function DashboardAiGuide({ username, photoData, avatarConfig }: DashboardAiGuideProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((currentIndex) => (currentIndex + 1) % positiveMessages.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/assistant/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "¿Cuántas retenciones pendientes tengo?" }) }),
      fetch("/api/assistant/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "¿Cómo está el stock?" }) }),
    ]).then(async ([retentions, stock]) => {
      const results = await Promise.all([retentions.json(), stock.json()]);
      if (active) setAlerts(results.map((item) => item.answer).filter(Boolean));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const askAssistant = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    setIsLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
      });
      const data = await response.json();
      const nextAnswer = response.ok ? data.answer || "No encontré una respuesta para esa consulta." : data.detail || "No se pudo consultar la IA.";
      setAnswer(nextAnswer);
      speak(nextAnswer);
    } catch {
      setAnswer("No se pudo conectar con la IA. Intenta nuevamente en unos segundos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      mb={8}
      p={{ base: 4, md: 5 }}
      bg="linear-gradient(105deg, #151719 0%, #12191b 66%, #182315 100%)"
      border="1px solid"
      borderColor="rgba(250, 204, 21, 0.28)"
      borderRadius="2xl"
      position="relative"
      overflow="hidden"
      css={{
        "@keyframes assistantFloat": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
        "@keyframes assistantGlow": { "0%, 100%": { boxShadow: "0 0 0 0 rgba(250, 204, 21, 0.18)" }, "50%": { boxShadow: "0 0 0 9px rgba(250, 204, 21, 0)" } },
      }}
    >
      <Box position="absolute" right="-50px" top="-70px" w="180px" h="180px" borderRadius="full" border="1px solid" borderColor="yellow.300" opacity={0.12} />
      <Flex direction={{ base: "column", lg: "row" }} align={{ base: "start", lg: "center" }} gap={5} position="relative">
        <HStack align="center" gap={4} minW={{ lg: "310px" }}>
          <Box animation="assistantFloat 3.2s ease-in-out infinite" position="relative">
            <Box width="112px" height="156px" borderRadius="56px 56px 24px 24px" border="1px solid" borderColor="yellow.300" animation={question ? "assistantFloat 0.8s ease-in-out infinite, assistantGlow 1.2s ease-in-out infinite" : "assistantGlow 3.2s ease-in-out infinite"} bg="transparent" overflow="hidden" display="flex" alignItems="center" justifyContent="center">
              <ThreeDAvatar config={avatarConfig} isTalking={isLoading || isSpeaking} />
            </Box>
            <Box position="absolute" right="-2px" bottom="2px" bg="green.400" border="3px solid" borderColor="#151719" w="14px" h="14px" borderRadius="full" />
          </Box>
          <Box>
            <HStack gap={2} color="yellow.300" mb={1}>
              <Bot size={17} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">Guía IA</Text>
            </HStack>
            <Text fontWeight="bold">Hola, {username}</Text>
            <Text color="gray.400" fontSize="sm" mt={1}>{positiveMessages[messageIndex]}</Text>
          </Box>
        </HStack>

        <VStack align="stretch" gap={3} flex="1" width="full">
          <HStack gap={2} color="gray.300" fontSize="sm">
            <Sparkles size={15} color="#facc15" />
            <Text>Pregúntame cómo usar el sistema o consulta tus datos.</Text>
          </HStack>
          {alerts.length > 0 && (
            <HStack gap={2} flexWrap="wrap">
              {alerts.map((alert) => <Box key={alert} px={3} py={2} bg="yellow.950" border="1px solid" borderColor="yellow.800" borderRadius="lg"><Text fontSize="xs" color="yellow.200">{alert}</Text></Box>)}
            </HStack>
          )}
          <form onSubmit={askAssistant}>
            <Flex gap={2}>
              <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ej. ¿Cómo registro una solicitud de procura?" bg="#0b0d0e" borderColor="whiteAlpha.200" _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} />
              <Button type="submit" aria-label="Preguntar a la IA" title="Preguntar a la IA" bg="yellow.400" color="black" minW="44px" px={3} disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : <Send size={16} />}
              </Button>
            </Flex>
          </form>
          <HStack gap={2} flexWrap="wrap">
            {suggestedQuestions.map((suggestedQuestion) => (
              <Button key={suggestedQuestion} type="button" size="xs" variant="outline" borderColor="whiteAlpha.200" color="gray.300" onClick={() => setQuestion(suggestedQuestion)}>
                {suggestedQuestion}
              </Button>
            ))}
            <NextLink href="/dashboard/ia">
              <Button type="button" size="xs" variant="ghost" color="yellow.300">
                Abrir asistente <ArrowRight size={13} />
              </Button>
            </NextLink>
          </HStack>
          {answer && (
            <HStack align="start" gap={2} p={3} bg="blackAlpha.300" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <MessageCircle size={16} color="#facc15" />
              <Text color="gray.200" fontSize="sm" whiteSpace="pre-wrap">{answer}</Text>
            </HStack>
          )}
        </VStack>
      </Flex>
    </Box>
  );
}
