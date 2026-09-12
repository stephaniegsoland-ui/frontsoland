"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom"; // Este sí se queda en react-dom
import { Box, Button, Flex, HStack, Image, Input, Text, VStack, Heading } from "@chakra-ui/react";
import { loginAction } from "@/actions/auth";
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";


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

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#08090a" color="white" p={{ base: 4, md: 8 }} position="relative" overflow="hidden">
      <Box position="absolute" inset={0} bg="radial-gradient(circle at 15% 10%, rgba(234,179,8,0.12), transparent 32%), radial-gradient(circle at 90% 90%, rgba(59,130,246,0.10), transparent 30%)" pointerEvents="none" />
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
        bg="#111315"
        boxShadow="0 24px 80px rgba(0,0,0,0.42)"
      >
        <Flex
          flex="1"
          direction="column"
          justify="space-between"
          p={{ base: 6, md: 10 }}
          bg="linear-gradient(145deg, #1b1d1f 0%, #111315 72%)"
          borderRight={{ base: "none", md: "1px solid" }}
          borderBottom={{ base: "1px solid", md: "none" }}
          borderColor="whiteAlpha.100"
        >
          <Box>
            <Flex align="center" justify="center" w="88px" h="88px" mb={8} bg="white" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="yellow.400">
              {!logoFailed ? (
                <Image src="/LOGODEF.png" alt="Logo de la empresa" maxW="100%" maxH="100%" objectFit="contain" onError={() => setLogoFailed(true)} />
              ) : (
                <Text color="yellow.500" fontSize="3xl" fontWeight="black">S</Text>
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
            <ShieldCheck size={18} color="#facc15" />
            <Text>Acceso protegido para usuarios autorizados</Text>
          </HStack>
        </Flex>

        <Box w={{ base: "full", md: "430px" }} p={{ base: 6, md: 10 }} bg="#0d0f10">
        <form action={formAction}>
          <VStack gap={6} align="stretch">
            <Box>
              <HStack gap={2} color="yellow.300" mb={2}>
                <LockKeyhole size={18} />
                <Text fontSize="sm" fontWeight="bold">Acceso al sistema</Text>
              </HStack>
              <Heading color="white" size="lg">Bienvenido de nuevo</Heading>
              <Text color="gray.500" fontSize="sm" mt={2}>Ingresa tus credenciales para continuar.</Text>
            </Box>

            <VStack gap={4}>
              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>Usuario</Text>
                <Input name="username" placeholder="Ej. jperez" bg="#08090a" borderColor="whiteAlpha.200" color="white" _hover={{ borderColor: "whiteAlpha.400" }} _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} required />
              </Box>
              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>Contraseña</Text>
                <Box position="relative">
                  <Input name="password" type={showPassword ? "text" : "password"} placeholder="Ingresa tu contraseña" pr="48px" bg="#08090a" borderColor="whiteAlpha.200" color="white" _hover={{ borderColor: "whiteAlpha.400" }} _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} required />
                  <Button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} position="absolute" right="4px" top="4px" size="sm" variant="ghost" color="gray.400" _hover={{ color: "yellow.300" }} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </Button>
                </Box>
              </Box>
            </VStack>

            {state?.error && (
              <Box bg="red.950" border="1px solid" borderColor="red.800" borderRadius="md" px={3} py={2}>
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