"use client";

import { useActionState, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Grid,
  Textarea,
  HStack,
  Image,
  VStack,
} from "@chakra-ui/react";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPersonalAction } from "@/actions/personal";
import { MODULE_OPTIONS } from "@/lib/permissions";

export function PersonalClient() {
  const [state, formAction, isPending] = useActionState(
    createPersonalAction,
    null,
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);


  const modulosIzq = MODULE_OPTIONS.slice(0, 5);
  const modulosDer = MODULE_OPTIONS.slice(5);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      setPhotoPreview(URL.createObjectURL(selectedFile));
    } else {
      setPhotoPreview(null);
    }
  };

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
        <Flex justify="space-between" align="center" mb={6}>
          <HStack gap={4}>
            <Button
              asChild
              variant="ghost"
              color="gray.400"
              _hover={{ color: "yellow.400", bg: "whiteAlpha.100" }}
              px={2}
            >
              <Link href="/dashboard/personal">
                <ArrowLeft size={20} />
              </Link>
            </Button>
            <Flex align="center" gap={3}>
              <UserPlus color="#eab308" size={24} />
              <Text fontSize="xl" fontWeight="bold" color="yellow.400">
                Registrar Nuevo Personal
              </Text>
            </Flex>
          </HStack>

          <Button
            size="xs"
            variant="outline"
            borderColor="whiteAlpha.300"
            color="gray.300"
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
              <select
                name="departamento"
                style={{
                  background: "black",
                  color: "gray",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ca8a04",
                  width: "100%",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="">Departamento</option>
                <option value="operaciones">Operaciones</option>
                <option value="logistica">Logística</option>
                <option value="ti">TI</option>
              </select>
              <select
                name="vehiculo"
                style={{
                  background: "black",
                  color: "gray",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ca8a04",
                  width: "100%",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="">Vehículo asignado (opcional)</option>
              </select>
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
              <select
                name="rol"
                style={{
                  background: "black",
                  color: "gray",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ca8a04",
                  width: "100%",
                  fontSize: "14px",
                  outline: "none",
                }}
                required
              >
                <option value="">Rol del sistema</option>
                <option value="1">Administrador (Nivel 1)</option>
                <option value="2">Supervisor (Nivel 2)</option>
                <option value="3">Operador (Nivel 3)</option>
              </select>

              <select
                name="tiene_carro"
                style={{
                  background: "black",
                  color: "gray",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ca8a04",
                  width: "100%",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="">¿Tiene carro asignado?</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>

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

          <Box bg="#101014" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100" mb={8}>
            <Text mb={3} fontWeight="bold" color="white">
              Foto del trabajador
            </Text>
            <Input type="file" name="photo_data" accept="image/*" onChange={handlePhotoChange} bg="black" color="white" />
            {photoPreview ? (
              <Box mt={4} borderRadius="xl" overflow="hidden" border="1px solid" borderColor="whiteAlpha.100">
                <Image src={photoPreview} alt="Foto del trabajador" width="100%" height="auto" />
              </Box>
            ) : (
              <Text color="gray.500" mt={3}>
                Selecciona una foto para cargar al perfil del trabajador.
              </Text>
            )}
          </Box>

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
                  key={mod.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    name="permissions"
                    value={mod.key}
                    type="checkbox"
                    style={{
                      accentColor: "#eab308",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  <Text color="gray.300" fontSize="sm">
                    {mod.label}
                  </Text>
                </label>
              ))}
            </Flex>
            <Flex direction="column" gap={3}>
              {modulosDer.map((mod) => (
                <label
                  key={mod.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    name="permissions"
                    value={mod.key}
                    type="checkbox"
                    style={{
                      accentColor: "#eab308",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  <Text color="gray.300" fontSize="sm">
                    {mod.label}
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
