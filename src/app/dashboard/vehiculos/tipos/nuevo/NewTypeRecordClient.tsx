"use client";

import { useActionState } from "react";
import { Box, Flex, Text, Button, Input, VStack, HStack, SimpleGrid } from "@chakra-ui/react";
import { ArrowLeft, Save, Settings2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createTypeRecordAction } from "@/actions/vehiculos";

export function NewTypeRecordClient() {
  const [state, formAction, isPending] = useActionState(createTypeRecordAction, null);

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Flex justify="space-between" align="center" mb={8} maxW="3xl" mx="auto">
        <HStack gap={4}>
          <Button asChild variant="ghost" color="gray.400" _hover={{ color: "yellow.400", bg: "whiteAlpha.100" }} px={2}>
            <Link href="/dashboard/vehiculos"><ArrowLeft size={20} /></Link>
          </Button>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" color="gray.500">Configuración de Flota</Text>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Crear <Text as="span" color="yellow.400">Tipo de Registro</Text>
            </Text>
          </VStack>
        </HStack>
      </Flex>
    
      <Box bg="#18181b" p={8} borderRadius="2xl" border="1px solid" borderColor="yellow.600" boxShadow="0 10px 30px rgba(0,0,0,0.5)" maxW="3xl" mx="auto">
        <form action={formAction}>
          <VStack gap={6} align="stretch">
            
            <HStack mb={2} gap={2}>
              <Settings2 size={18} color="#eab308" />
              <Text fontWeight="bold" color="gray.300" fontSize="sm" textTransform="uppercase">Definición del Evento</Text>
            </HStack>

            <Box>
              <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Nombre del Tipo (Ej: Cambio de Llantas)</Text>
              <Input name="name" placeholder="Nombre..." bg="black" border="1px solid" borderColor="whiteAlpha.300" _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} required />
            </Box>

            <SimpleGrid columns={2} gap={6}>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Color Identificador (Hex)</Text>
                <Flex gap={2}>
                  <Input type="color" name="color_hex" defaultValue="#eab308" w="60px" p={1} bg="black" border="1px solid" borderColor="whiteAlpha.300" cursor="pointer" />
                  <Text color="gray.400" fontSize="sm" alignSelf="center">Selecciona un color</Text>
                </Flex>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Ícono del Sistema</Text>
                <select
                  name="icon"
                  defaultValue="tool"
                  style={{
                    background: "black",
                    color: "white",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.24)",
                    width: "100%",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="tool">Herramienta (Mantenimiento)</option>
                  <option value="alert-circle">Alerta (Incidente)</option>
                  <option value="clipboard-check">Chequeo (Revisión)</option>
                  <option value="send">Envío (Entrega)</option>
                </select>
              </Box>
            </SimpleGrid>

            {state?.error && (
              <Flex bg="red.900/40" color="red.200" p={3} borderRadius="md" align="center" gap={2} border="1px solid" borderColor="red.700">
                <AlertCircle size={18} />
                <Text fontSize="sm">{state.error}</Text>
              </Flex>
            )}

            {state?.success && (
              <Text color="green.400" fontSize="sm" textAlign="center">Tipo de registro guardado exitosamente.</Text>
            )}

            <Button type="submit" bg="yellow.400" color="black" fontWeight="bold" _hover={{ bg: "yellow.500" }} display="flex" gap={2} py={6} loading={isPending} mt={4}>
              <Save size={18} /> Guardar Tipo de Registro
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}