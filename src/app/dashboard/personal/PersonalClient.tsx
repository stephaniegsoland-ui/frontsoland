"use client";

import { useActionState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Grid,
  Textarea,
} from "@chakra-ui/react";
import { UserPlus } from "lucide-react";
import { createPersonalAction } from "@/actions/personal";

export function PersonalClient() {
  const [state, formAction, isPending] = useActionState(
    createPersonalAction,
    null,
  );

  const modulosIzq = [
    "Vehículos",
    "Stock",
    "Seguridad",
    "Scanner",
    "Consulta IA",
  ];
  const modulosDer = [
    "Personal",
    "Procura",
    "Hoja de Tiempo",
    "Reportes",
    "Configuración",
  ];

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      {/* Contenedor Principal con borde amarillo */}
      <Box
        bg="#18181b"
        p={6}
        borderRadius="xl"
        border="1px solid"
        borderColor="yellow.600"
        maxW="5xl"
        mx="auto"
      >
        <Flex align="center" gap={3} mb={6}>
          <UserPlus color="#eab308" size={24} />
          <Text fontSize="xl" fontWeight="bold" color="yellow.400">
            Registrar Nuevo Personal
          </Text>
          <Button
            size="xs"
            variant="outline"
            borderColor="whiteAlpha.300"
            color="gray.300"
            ml={2}
          >
            Resumen
          </Button>
        </Flex>

        <form action={formAction}>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={6}>
            {/* COLUMNA IZQUIERDA */}
            <Flex direction="column" gap={4}>
              <Input
                name="username"
                placeholder="Nombre de Usuario (Ej: ADMIN o JPEREZ)"
                bg="black"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{
                  borderColor: "yellow.400",
                  boxShadow: "0 0 0 1px #eab308",
                }}
                required
              />
              <Input
                name="nombre_completo"
                placeholder="Nombre Completo"
                bg="black"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{
                  borderColor: "yellow.400",
                  boxShadow: "0 0 0 1px #eab308",
                }}
              />
              <Input
                name="cargo"
                placeholder="Cargo"
                bg="black"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{
                  borderColor: "yellow.400",
                  boxShadow: "0 0 0 1px #eab308",
                }}
              />
              <Box
                as="select"
                name="departamento"
                bg="black"
                color="gray.300"
                p={2}
                borderRadius="md"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{ outline: "none", borderColor: "yellow.400" }}
                w="full"
              >
                <option value="">Departamento</option>
                <option value="operaciones">Operaciones</option>
                <option value="logistica">Logística</option>
                <option value="ti">TI</option>
              </Box>
              <Box
                as="select"
                name="vehiculo"
                bg="black"
                color="gray.300"
                p={2}
                borderRadius="md"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{ outline: "none", borderColor: "yellow.400" }}
                w="full"
              >
                <option value="">Vehículo asignado (opcional)</option>
              </Box>
            </Flex>

            {/* COLUMNA DERECHA */}
            <Flex direction="column" gap={4}>
              <Input
                name="password"
                type="password"
                placeholder="Contraseña (***)"
                bg="black"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{
                  borderColor: "yellow.400",
                  boxShadow: "0 0 0 1px #eab308",
                }}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder="Correo Electrónico (user@example.com)"
                bg="black"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{
                  borderColor: "yellow.400",
                  boxShadow: "0 0 0 1px #eab308",
                }}
                required
              />

              {/* SELECT DEL ROL (Conectado al "level" del esquema) */}
              <Box
                as="select"
                name="rol"
                bg="black"
                color="gray.300"
                p={2}
                borderRadius="md"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{ outline: "none", borderColor: "yellow.400" }}
                w="full"
                required
              >
                <option value="">Rol del sistema</option>
                <option value="1">Administrador (Nivel 1)</option>
                <option value="2">Supervisor (Nivel 2)</option>
                <option value="3">Operador (Nivel 3)</option>
              </Box>

              <Box
                as="select"
                name="tiene_carro"
                bg="black"
                color="gray.300"
                p={2}
                borderRadius="md"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{ outline: "none", borderColor: "yellow.400" }}
                w="full"
              >
                <option value="">¿Tiene carro asignado?</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </Box>

              <Textarea
                name="hoja_vida"
                placeholder="Hoja de Vida (opcional) - Educación, experiencia, habilidades..."
                bg="black"
                border="1px solid"
                borderColor="yellow.600"
                _focus={{
                  borderColor: "yellow.400",
                  boxShadow: "0 0 0 1px #eab308",
                }}
                rows={4}
              />
            </Flex>
          </Grid>

          {/* CHECKBOXES DE PERMISOS MÓDULOS */}
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap={4}
            mb={8}
            px={2}
          >
            <Flex direction="column" gap={3}>
              {modulosIzq.map((mod) => (
                <label
                  key={mod}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      accentColor: "#eab308",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  <Text color="gray.300" fontSize="sm">
                    {mod}
                  </Text>
                </label>
              ))}
            </Flex>
            <Flex direction="column" gap={3}>
              {modulosDer.map((mod) => (
                <label
                  key={mod}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      accentColor: "#eab308",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  <Text color="gray.300" fontSize="sm">
                    {mod}
                  </Text>
                </label>
              ))}
            </Flex>
          </Grid>

          {state?.error && (
            <Text color="red.400" fontSize="sm" mb={4} textAlign="center">
              {state.error}
            </Text>
          )}
          {state?.success && (
            <Text color="green.400" fontSize="sm" mb={4} textAlign="center">
              Personal registrado exitosamente.
            </Text>
          )}

          {/* BOTÓN DE REGISTRO */}
          <Button
            type="submit"
            w="full"
            bg="whiteAlpha.400"
            color="white"
            _hover={{ bg: "yellow.400", color: "black" }}
            py={6}
            loading={isPending}
            display="flex"
            gap={2}
          >
            <UserPlus size={18} /> Registrar Personal
          </Button>
        </form>
      </Box>
    </Box>
  );
}
