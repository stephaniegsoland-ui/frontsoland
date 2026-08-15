"use client";

import { useActionState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Grid,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Truck,
  Save,
  CarFront,
  Gauge,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { createVehicleAction } from "@/actions/vehiculos";

export function NewVehiclesClient({ users = [] }: { users?: Array<{ id: string; username?: string; email?: string }> }) {
  const today = new Date().toISOString().split("T")[0];

  const [state, formAction, isPending] = useActionState(createVehicleAction, null)

return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      
      {/* ================= HEADER ================= */}
      <Flex justify="space-between" align="center" mb={8} maxW="4xl" mx="auto">
        <HStack gap={4}>
          <Button asChild variant="ghost" color="gray.400" _hover={{ color: "yellow.400", bg: "whiteAlpha.100" }} px={2}>
            <Link href="/dashboard/vehiculos"><ArrowLeft size={20} /></Link>
          </Button>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" color="gray.500">Gestión de Flota</Text>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Registrar <Text as="span" color="yellow.400">Nuevo Vehículo</Text>
            </Text>
          </VStack>
        </HStack>
      </Flex>

      {/* ================= FORMULARIO PRINCIPAL ================= */}
      <Box bg="#18181b" p={8} borderRadius="2xl" border="1px solid" borderColor="yellow.600" boxShadow="0 10px 30px rgba(0,0,0,0.5)" maxW="4xl" mx="auto">
        
        {/* Usamos formAction aquí */}
        <form action={formAction}>
          <VStack gap={8} align="stretch">
            
            <Box>
              <HStack mb={4} gap={2}>
                <CarFront size={18} color="#eab308" />
                <Text fontWeight="bold" color="gray.300" fontSize="sm" textTransform="uppercase" letterSpacing="wider">
                  Información Técnica
                </Text>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Placa / Patente</Text>
                  <Input name="license_plate" placeholder="Ej: ABC-123" bg="black" border="1px solid" borderColor="whiteAlpha.300" _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} textTransform="uppercase" required />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Marca y Modelo</Text>
                  <Input name="model" placeholder="Ej: Toyota Hilux 2024" bg="black" border="1px solid" borderColor="whiteAlpha.300" _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} required />
                </Box>
              </SimpleGrid>
            </Box>

            <Box>
              <HStack mb={4} gap={2}>
                <Gauge size={18} color="#eab308" />
                <Text fontWeight="bold" color="gray.300" fontSize="sm" textTransform="uppercase" letterSpacing="wider">
                  Estado Operativo
                </Text>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Kilometraje Actual</Text>
                  <Input name="km_actual" type="number" defaultValue={0} bg="black" border="1px solid" borderColor="whiteAlpha.300" _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} />
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Estado Inicial</Text>
                  <select
                    name="status"
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
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Fecha de Registro</Text>
                  <Input name="register_date" type="date" defaultValue={today} bg="black" border="1px solid" borderColor="whiteAlpha.300" _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} colorScheme="dark" />
                </Box>
              </SimpleGrid>
            </Box>

            <Box>
              <HStack mb={4} gap={2}>
                <User size={18} color="#eab308" />
                <Text fontWeight="bold" color="gray.300" fontSize="sm" textTransform="uppercase" letterSpacing="wider">
                  Asignación de Personal
                </Text>
              </HStack>

              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>Responsable (Opcional)</Text>
                <select
                  name="user_id"
                  defaultValue=""
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
                  <option value="">-- Sin responsable --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username || u.email || u.id}</option>
                  ))}
                </select>
              </Box>
            </Box>

            {/* Renderizado de Errores */}
            {state?.error && (
              <Flex bg="red.900" color="red.200" p={3} borderRadius="md" align="center" gap={2} border="1px solid" borderColor="red.700">
                <AlertCircle size={18} />
                <Text fontSize="sm" fontWeight="medium">{state.error}</Text>
              </Flex>
            )}

            <HStack gap={4} pt={4}>
              <Button asChild flex={1} variant="ghost" color="gray.400" _hover={{ bg: "whiteAlpha.100", color: "white" }}>
                <Link href="/dashboard/vehiculos">Cancelar</Link>
              </Button>
              
              <Button 
                type="submit" 
                flex={2} 
                bg="yellow.400" 
                color="black" 
                fontWeight="bold"
                _hover={{ bg: "yellow.500" }}
                display="flex"
                gap={2}
                py={6}
                loading={isPending}
              >
                <Save size={18} />
                Guardar Vehículo
              </Button>
            </HStack>

          </VStack>
        </form>
      </Box>
    </Box>
  );
}