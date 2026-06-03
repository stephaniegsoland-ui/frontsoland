"use client";

import { useActionState } from "react"; // <-- Nuevo hook de React 19
import { useFormStatus } from "react-dom"; // Este sí se queda en react-dom
import { Box, Button, Flex, Input, Text, VStack, Heading } from "@chakra-ui/react";
import { loginAction } from "@/actions/auth";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      bg="yellow.400"
      color="black"
      _hover={{ bg: "yellow.500" }}
      w="full"
      fontWeight="bold"
      borderRadius="md"
      loading={pending}
      loadingText="Iniciando..."
    >
      Iniciar Sesión
    </Button>
  );
}

const initialState = { error: "" };

export default function LoginPage() {
  // Conectamos el estado del formulario con nuestra Server Action
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    // Fondo oscuro que ocupa toda la pantalla, centrado absoluto
    <Flex minH="100vh" align="center" justify="center" bg="#0a0a0a">
      
      {/* La caja de Login */}
      <Box
        w="full"
        maxW="sm" // Ancho máximo pequeño para mantener la estética
        p={8}
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="lg"
        bg="#121212"
      >
        <form action={formAction}>
          <VStack gap={6} align="stretch">
            
            {/* Títulos */}
            <Box>
              <Heading color="yellow.400" size="xl" mb={1} letterSpacing="tight">
                SOLAND
              </Heading>
              <Text color="gray.400" fontSize="sm">
                Sistema de Suministros - Acceso
              </Text>
            </Box>

            {/* Inputs */}
            <VStack gap={4}>
              <Input
                name="username"
                placeholder="Usuario"
                bg="black"
                borderColor="whiteAlpha.300"
                color="white"
                _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
                required
              />
              <Input
                name="password"
                type="password"
                placeholder="••••••••••••"
                bg="black"
                borderColor="whiteAlpha.300"
                color="white"
                _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
                required
              />
            </VStack>

            {/* Mensaje de error dinámico (Si el usuario se equivoca) */}
            {state?.error && (
              <Text color="red.400" fontSize="sm" textAlign="center">
                {state.error}
              </Text>
            )}

            {/* Botón Amarillo */}
            <SubmitButton />
            
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}