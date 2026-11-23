"use client";

import { useActionState } from "react";
import NextLink from "next/link";
import { Box, Button, Flex, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset, type PasswordResetState } from "@/actions/password-reset";

const initialState: PasswordResetState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="var(--soland-surface-08090a)" color="var(--soland-text-primary)" p={4}>
      <Box w="full" maxW="440px" p={{ base: 6, md: 10 }} bg="var(--soland-surface-111315)" border="1px solid" borderColor="whiteAlpha.200" borderRadius="2xl">
        <form action={formAction}>
          <VStack gap={5} align="stretch">
            <Box>
              <Mail size={24} color="var(--soland-accent-text)" />
              <Heading mt={4} size="lg">¿Olvidaste tu contraseña?</Heading>
              <Text mt={2} color="gray.400">
                Escribe el correo de tu cuenta y te enviaremos un enlace para cambiarla.
              </Text>
            </Box>
            <Box>
              <Text color="gray.400" fontSize="sm" mb={2}>Correo electrónico</Text>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="nombre@empresa.com"
                bg="var(--soland-surface-08090a)"
                borderColor="whiteAlpha.200"
                color="var(--soland-text-primary)"
                required
              />
            </Box>
            {state.error && <Text role="alert" color="red.300" fontSize="sm">{state.error}</Text>}
            {state.success && <Text role="status" color="green.300" fontSize="sm">{state.success}</Text>}
            {!state.success && (
              <Button type="submit" bg="yellow.400" color="black" _hover={{ bg: "yellow.300" }} loading={pending} loadingText="Enviando..." fontWeight="bold">
                Enviar enlace
              </Button>
            )}
            <NextLink href="/" style={{ color: "var(--soland-accent-text)", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <ArrowLeft size={16} /> Volver al inicio de sesión
            </NextLink>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}
