"use client";

import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Circle,
  Flex,
} from "@chakra-ui/react";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

// Contenido especializado para cuando estás dentro del Dashboard
export function DashboardNotFoundContent() {
  return (
    <Box
      minH="80vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="#08080a"
      p={6}
      w="full"
    >
      <VStack gap={6} textAlign="center" maxW="md">
        <Circle
          size="80px"
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <FileQuestion size={40} color="#eab308" />
        </Circle>
        <VStack gap={2}>
          <Heading as="h2" size="xl" color="yellow.400" fontWeight="bold">
            Página no encontrada
          </Heading>
          <Text color="gray.400" fontSize="md">
            El módulo al que intentas acceder no existe en el sistema, ha sido
            movido o cambió su ruta operativa.
          </Text>
        </VStack>
        <Button
          asChild
          bg="yellow.400"
          color="black"
          _hover={{ bg: "yellow.500" }}
          fontWeight="bold"
          size="md"
          mt={2}
        >
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowLeft size={16} />
            Volver al Dashboard
          </Link>
        </Button>
      </VStack>
    </Box>
  );
}

// Contenido limpio para cuando estás fuera (Pantalla de login o externa)
export function PublicNotFoundContent() {
  return (
    <Flex minH="100vh" bg="#08080a" align="center" justify="center" p={6}>
      <VStack gap={6} textAlign="center" maxW="md">
        <Circle
          size="80px"
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <FileQuestion size={40} color="#eab308" />
        </Circle>
        <VStack gap={2}>
          <Heading as="h2" size="xl" color="yellow.400" fontWeight="bold">
            Ruta Inválida
          </Heading>
          <Text color="gray.400" fontSize="md">
            La dirección ingresada no pertenece al sistema Soland.
          </Text>
        </VStack>
        
        <Button
          asChild
          bg="yellow.400"
          color="black"
          _hover={{ bg: "yellow.500" }}
          fontWeight="bold"
          size="md"
          mt={2}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowLeft size={16} />
            Ir al Inicio
          </Link>
        </Button>
      </VStack>
    </Flex>
  );
}