"use client";

import { useActionState } from "react";
import NextLink from "next/link";
import { Box, Button, Flex, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { KeyRound } from "lucide-react";
import { resetPassword, type PasswordResetState } from "@/actions/password-reset";

const initialState: PasswordResetState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#08090a" color="white" p={4}>
      <Box w="full" maxW="440px" p={{ base: 6, md: 10 }} bg="#111315" border="1px solid" borderColor="whiteAlpha.200" borderRadius="2xl">
        <form action={formAction}>
          <input type="hidden" name="token" value={token} />
          <VStack gap={5} align="stretch">
            <Box>
              <KeyRound size={24} color="#facc15" />
              <Heading mt={4} size="lg">Crea una contraseña nueva</Heading>
              <Text mt={2} color="gray.400">
                Elige una contraseña de entre 8 y 128 caracteres.
              </Text>
            </Box>
            {!token && <Text role="alert" color="red.300" fontSize="sm">El enlace de recuperación no es válido.</Text>}
            {state.error && <Text role="alert" color="red.300" fontSize="sm">{state.error}</Text>}
            {state.success && <Text role="status" color="green.300" fontSize="sm">{state.success}</Text>}
            {!state.success && token && (
              <>
                <Box>
                  <Text color="gray.400" fontSize="sm" mb={2}>Contraseña nueva</Text>
                  <Input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required bg="#08090a" borderColor="whiteAlpha.200" color="white" />
                </Box>
                <Box>
                  <Text color="gray.400" fontSize="sm" mb={2}>Confirma la contraseña</Text>
                  <Input name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required bg="#08090a" borderColor="whiteAlpha.200" color="white" />
                </Box>
                <Button type="submit" bg="yellow.400" color="black" _hover={{ bg: "yellow.300" }} loading={pending} loadingText="Guardando..." fontWeight="bold">
                  Cambiar contraseña
                </Button>
              </>
            )}
            <NextLink href="/" style={{ color: "#facc15", fontSize: "0.875rem" }}>
              Volver al inicio de sesión
            </NextLink>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}
