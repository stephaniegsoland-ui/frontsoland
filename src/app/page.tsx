"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom"; // Este sí se queda en react-dom
import NextLink from "next/link";
import { Box, Button, Flex, HStack, Image, Input, Text, VStack, Heading } from "@chakra-ui/react";
import { loginAction } from "@/actions/auth";
import { Check, Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { ColorModeButton, useColorMode } from "@/components/ui/color-mode";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      bg="yellow.400"
      color="black"
      _hover={{ bg: "yellow.300", transform: "translateY(-1px)", boxShadow: "0 10px 24px rgba(234,179,8,0.18)" }}
      _active={{ transform: "translateY(0)" }}
      w="full"
      fontWeight="bold"
      borderRadius="md"
      transition="all 160ms ease"
      loading={pending}
      loadingText="Iniciando..."
    >
      <HStack gap={2} justify="center">
        <LogIn size={17} />
        <Text>Iniciar sesión</Text>
      </HStack>
    </Button>
  );
}

const initialState = { error: "", mfaRequired: false };

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { colorMode } = useColorMode();
  const isMfaStep = Boolean(state?.mfaRequired);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="var(--soland-surface-08090a)" color="var(--soland-text-primary)" p={{ base: 4, md: 8 }} position="relative" overflow="hidden">
      <Box position="absolute" inset={0} bg="radial-gradient(circle at 15% 10%, rgba(234,179,8,0.12), transparent 32%), radial-gradient(circle at 90% 90%, rgba(59,130,246,0.10), transparent 30%)" pointerEvents="none" />
      <ColorModeButton
        position="absolute"
        top={4}
        right={4}
        zIndex={2}
        color="yellow.500"
        bg="whiteAlpha.100"
        _hover={{ bg: "whiteAlpha.200" }}
      />
      <Flex
        position="relative"
        w="full"
        maxW="920px"
        minH={{ base: "auto", md: "560px" }}
        direction={{ base: "column", md: "row" }}
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="2xl"
        overflow="hidden"
        bg="var(--soland-surface-111315)"
        boxShadow="0 24px 80px rgba(0,0,0,0.42)"
      >
        <Flex
          flex="1"
          direction="column"
          justify="space-between"
          p={{ base: 6, md: 10 }}
          bg="var(--soland-login-panel-gradient)"
          borderRight={{ base: "none", md: "1px solid" }}
          borderBottom={{ base: "1px solid", md: "none" }}
          borderColor="whiteAlpha.100"
        >
          <Box>
            <Flex align="center" justify="center" w={{ base: "220px", md: "300px" }} h={{ base: "72px", md: "96px" }} mb={8} px={3} py={2} overflow="hidden">
              {!logoFailed ? (
                <Image
                  src={colorMode === "dark" ? "/LOGODEF-dark.png" : "/LOGODEF.png"}
                  alt="Logo de Soland"
                  width="100%"
                  height="100%"
                  objectFit="contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <Text color={colorMode === "dark" ? "white" : "black"} fontSize="2xl" fontWeight="black" letterSpacing="widest">SOLAND</Text>
              )}
            </Flex>
            <Text color="yellow.300" fontSize="sm" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
              Plataforma operativa
            </Text>
            <Heading mt={3} size={{ base: "lg", md: "xl" }} lineHeight="1.1">
              Todo el control de tu operación en un solo lugar.
            </Heading>
            <Text mt={4} color="gray.400" maxW="360px" lineHeight="1.7">
              Gestiona personal, inventario, vehículos, seguridad y reportes con información centralizada.
            </Text>
          </Box>
          <HStack mt={{ base: 8, md: 12 }} gap={3} color="gray.400" fontSize="sm">
            <ShieldCheck size={18} color="var(--soland-accent-text)" />
            <Text>Acceso protegido para usuarios autorizados</Text>
          </HStack>
        </Flex>

        <Box w={{ base: "full", md: "430px" }} p={{ base: 6, md: 10 }} bg="var(--soland-surface-0d0f10)">
        <form action={formAction}>
          <VStack gap={6} align="stretch">
            <Box>
              <HStack gap={2} color="yellow.300" mb={2}>
                <LockKeyhole size={18} />
                <Text fontSize="sm" fontWeight="bold">
                  {isMfaStep ? "Verificación de identidad" : "Acceso al sistema"}
                </Text>
              </HStack>
              <Heading color="var(--soland-text-primary)" size="lg">
                {isMfaStep ? "Confirma tu identidad" : "Bienvenido de nuevo"}
              </Heading>
              <Text color="gray.500" fontSize="sm" mt={2}>
                {isMfaStep
                  ? "Ingresa el código de seguridad para completar el acceso."
                  : "Ingresa tus credenciales para continuar."}
              </Text>
            </Box>

            <Box
              aria-label="Flujo de acceso"
              bg="var(--soland-surface-141719)"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="xl"
              p={4}
              role="list"
            >
              <Flex align="flex-start" gap={0}>
                <Flex flex="1" direction="column" gap={2} role="listitem">
                  <HStack gap={2}>
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="26px"
                      flexShrink={0}
                      borderRadius="full"
                      bg={isMfaStep ? "green.500" : "yellow.400"}
                      color={isMfaStep ? "var(--soland-text-primary)" : "black"}
                      fontSize="xs"
                      fontWeight="bold"
                      aria-current={!isMfaStep ? "step" : undefined}
                    >
                      {isMfaStep ? <Check size={15} /> : "1"}
                    </Flex>
                    <Box flex="1" h="1px" bg={isMfaStep ? "green.500" : "whiteAlpha.200"} />
                  </HStack>
                  <Box>
                    <Text color={isMfaStep ? "green.300" : "var(--soland-text-primary)"} fontSize="sm" fontWeight="semibold">
                      Credenciales
                    </Text>
                    <Text color="gray.500" fontSize="xs">Usuario y contraseña</Text>
                  </Box>
                </Flex>

                <Flex flex="1" direction="column" gap={2} role="listitem">
                  <HStack gap={2}>
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="26px"
                      flexShrink={0}
                      border="1px solid"
                      borderColor={isMfaStep ? "yellow.400" : "whiteAlpha.300"}
                      borderRadius="full"
                      bg={isMfaStep ? "yellow.400" : "transparent"}
                      color={isMfaStep ? "black" : "gray.400"}
                      fontSize="xs"
                      fontWeight="bold"
                      aria-current={isMfaStep ? "step" : undefined}
                    >
                      2
                    </Flex>
                    <Box flex="1" h="1px" bg="transparent" />
                  </HStack>
                  <Box>
                    <Text color={isMfaStep ? "yellow.300" : "gray.300"} fontSize="sm" fontWeight="semibold">
                      Verificación
                    </Text>
                    <Text color="gray.500" fontSize="xs">
                      {isMfaStep ? "Código de seguridad" : "Solo si se solicita"}
                    </Text>
                  </Box>
                </Flex>
              </Flex>
            </Box>

            <VStack gap={4}>
              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>Usuario</Text>
                <Input name="username" placeholder="Ej. user" bg="var(--soland-surface-08090a)" borderColor="whiteAlpha.200" color="var(--soland-text-primary)" _hover={{ borderColor: "whiteAlpha.400" }} _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} required />
              </Box>
              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>Contraseña</Text>
                <Box position="relative">
                  <Input name="password" type={showPassword ? "text" : "password"} placeholder="Ingresa tu contraseña" pr="48px" bg="var(--soland-surface-08090a)" borderColor="whiteAlpha.200" color="var(--soland-text-primary)" _hover={{ borderColor: "whiteAlpha.400" }} _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} required />
                  <Button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} position="absolute" right="4px" top="4px" size="sm" variant="ghost" color="gray.400" _hover={{ color: "yellow.300" }} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </Button>
                </Box>
                <Flex justify="flex-end" mt={2}>
                  <NextLink href="/forgot-password" style={{ color: "var(--soland-accent-text)", fontSize: "0.875rem" }}>
                    ¿Olvidaste tu contraseña?
                  </NextLink>
                </Flex>
              </Box>
              {state?.mfaRequired && (
                <Box>
                  <Text color="gray.400" fontSize="sm" mb={2}>Código de verificación</Text>
                  <Input name="totp_code" inputMode="text" pattern="[A-Za-z0-9-]{6,16}" maxLength={16} placeholder="Código de app o recuperación" bg="var(--soland-surface-08090a)" borderColor="whiteAlpha.200" color="var(--soland-text-primary)" autoComplete="one-time-code" required />
                  <Text color="gray.500" fontSize="xs" mt={2}>
                    Usa el código de tu aplicación autenticadora o uno de recuperación.
                  </Text>
                </Box>
              )}
            </VStack>

            {state?.error && (
              <Box role="alert" aria-live="polite" bg="red.950" border="1px solid" borderColor="red.800" borderRadius="md" px={3} py={2}>
                <Text color="red.300" fontSize="sm" textAlign="center">
                {state.error}
                </Text>
              </Box>
            )}

            <SubmitButton />
            <Text color="gray.600" fontSize="xs" textAlign="center">
              Si no puedes ingresar, solicita ayuda al administrador del sistema.
            </Text>
          </VStack>
        </form>
        </Box>
      </Flex>
    </Flex>
  );
}