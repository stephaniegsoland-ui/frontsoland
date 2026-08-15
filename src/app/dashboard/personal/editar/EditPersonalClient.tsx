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
  Badge,
  Image,
} from "@chakra-ui/react";
import { UserCog, ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { updatePersonalAction } from "@/actions/personal";

interface UserRead {
  id: string;
  username: string;
  email: string;
  level: number | string | boolean;
  is_active: boolean | number;
  is_superuser: boolean;
  is_verified: boolean;
  photo_path?: string | null;
  nombre_completo?: string | null;
  cargo?: string | null;
  hoja_vida?: string | null;
  password?: string | null;
}

interface EditPersonalProps {
  user: UserRead;
}

export function EditPersonalClient({ user }: EditPersonalProps) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user.photo_path ? `${BACKEND_URL}${user.photo_path}` : null
  );

  // 3. Vinculamos de manera segura el ID del usuario actual a la Server Action
  const updateActionWithId = updatePersonalAction.bind(null, user.id);
  const [state, formAction, isPending] = useActionState(
    updateActionWithId,
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

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      setPhotoPreview(URL.createObjectURL(selectedFile));
    }
  };

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Box
        bg="#18181b"
        p={6}
        borderRadius="xl"
        border="1px solid"
        borderColor="yellow.600"
        maxW="5xl"
        mx="auto"
      >
        {/* HEADER */}
        <Flex justify="space-between" align="center" mb={6}>
          <HStack gap={3}>
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
            <UserCog color="#eab308" size={24} />
            <Text fontSize="xl" fontWeight="bold" color="yellow.400">
              Editar Personal:{" "}
              <Text as="span" color="white">
                {user.username}
              </Text>
            </Text>
          </HStack>

          <Badge
            bg={user.is_active ? "green.500/20" : "whiteAlpha.200"}
            color={user.is_active ? "green.400" : "gray.400"}
            px={3}
            py={1}
            borderRadius="md"
            border="1px solid"
            borderColor={user.is_active ? "green.500/50" : "whiteAlpha.300"}
          >
            {user.is_active ? "Usuario Activo" : "Usuario Inactivo"}
          </Badge>
        </Flex>

        {/* 4. Conectamos la acción al formulario */}
        <form action={formAction}>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={6}>
            {/* COLUMNA IZQUIERDA */}
            <Flex direction="column" gap={4}>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Nombre de Usuario
                </Text>
                <Input
                  name="username"
                  defaultValue={user.username}
                  bg="black"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _focus={{
                    borderColor: "yellow.400",
                    boxShadow: "0 0 0 1px #eab308",
                  }}
                  required
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Nombre Completo
                </Text>
                <Input
                  name="nombre_completo"
                  defaultValue={user.nombre_completo ?? ""}
                  placeholder="No registrado"
                  bg="black"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _focus={{
                    borderColor: "yellow.400",
                    boxShadow: "0 0 0 1px #eab308",
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Cargo
                </Text>
                <Input
                  name="cargo"
                  defaultValue={user.cargo ?? ""}
                  placeholder="Cargo del empleado"
                  bg="black"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _focus={{
                    borderColor: "yellow.400",
                    boxShadow: "0 0 0 1px #eab308",
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Estado del Usuario
                </Text>
                <select
                  name="is_active"
                  defaultValue={user.is_active ? "true" : "false"}
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
                  <option value="true">Activo (Permitir acceso)</option>
                  <option value="false">Inactivo (Bloquear acceso)</option>
                </select>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Foto del trabajador
                </Text>
                <Input
                  type="file"
                  name="photo_data"
                  accept="image/*"
                  bg="black"
                  color="white"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <Box mt={4} borderRadius="xl" overflow="hidden" border="1px solid" borderColor="whiteAlpha.100">
                    <Image src={photoPreview} alt="Vista previa de la foto" width="100%" height="auto" />
                  </Box>
                ) : (
                  <Text color="gray.500" mt={3}>
                    Sube una foto del trabajador para mejorar el reconocimiento facial.
                  </Text>
                )}
              </Box>
            </Flex>

            {/* COLUMNA DERECHA */}
            <Flex direction="column" gap={4}>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Correo Electrónico
                </Text>
                <Input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  bg="black"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _focus={{
                    borderColor: "yellow.400",
                    boxShadow: "0 0 0 1px #eab308",
                  }}
                  required
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Nueva Contraseña (Dejar en blanco para no cambiar)
                </Text>
                <Input
                  name="password"
                  type="password"
                  placeholder="***"
                  bg="black"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _focus={{
                    borderColor: "yellow.400",
                    boxShadow: "0 0 0 1px #eab308",
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Rol del Sistema
                </Text>
                <select
                  name="rol"
                  defaultValue={String(user.level)}
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
                  required
                >
                  <option value="1">Administrador (Nivel 1)</option>
                  <option value="2">Supervisor (Nivel 2)</option>
                  <option value="3">Operador (Nivel 3)</option>
                </select>
              </Box>
              <Textarea
                name="hoja_vida"
                defaultValue={user.hoja_vida ?? ""}
                placeholder="Actualizar Hoja de Vida..."
                bg="black"
                border="1px solid"
                borderColor="whiteAlpha.300"
                _focus={{
                  borderColor: "yellow.400",
                  boxShadow: "0 0 0 1px #eab308",
                }}
                rows={2}
                mt={4}
              />
            </Flex>
          </Grid>

          {/* CHECKBOXES DE PERMISOS MÓDULOS */}
          <Text fontSize="xs" color="gray.500" mb={3} ml={1}>
            Permisos de Módulos
          </Text>
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap={4}
            mb={8}
            px={2}
            p={4}
            border="1px dashed"
            borderColor="whiteAlpha.200"
            borderRadius="md"
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

          {/* 5. Renderizado de Errores y Mensajes Exitosos */}
          {state?.error && (
            <Flex
              bg="red.900/40"
              color="red.200"
              p={3}
              mb={4}
              borderRadius="md"
              align="center"
              gap={2}
              border="1px solid"
              borderColor="red.700"
            >
              <AlertCircle size={18} />
              <Text fontSize="sm">{state.error}</Text>
            </Flex>
          )}

          {state?.success && (
            <Text color="green.400" fontSize="sm" mb={4} textAlign="center">
              Cambios guardados con éxito en la base de datos.
            </Text>
          )}

          {/* BOTONES DE ACCIÓN */}
          <HStack gap={4}>
            <Button
              asChild
              flex={1}
              variant="ghost"
              color="gray.400"
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
            >
              <Link href="/dashboard/personal">Cancelar</Link>
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
              <Save size={18} /> Guardar Cambios
            </Button>
          </HStack>
        </form>
      </Box>
    </Box>
  );
}
