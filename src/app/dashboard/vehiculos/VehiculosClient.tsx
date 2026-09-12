"use client";

import { useState, useTransition } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Grid,
  HStack,
  VStack,
  Badge,
  Dialog,
  Input,
} from "@chakra-ui/react";
import {
  Edit,
  Truck,
  Send,
  ClipboardCheck,
  Wrench,
  AlertCircle,
  ShieldUser,
  LucideIcon,
  Package,
  Settings2,
} from "lucide-react";
import { updateVehicleAction } from "@/actions/vehiculos";
import Link from "next/link";
import { useRouter } from "next/navigation";

const iconMap: Record<string, LucideIcon> = {
  truck: Truck,
  send: Send,
  clipboard: ClipboardCheck,
  wrench: Wrench,
  alert: AlertCircle,
  tool: Wrench,
  package: Package,
};

interface VehicleRead {
  id: string;
  license_plate: string;
  model: string;
  km_actual: number;
  status: string;
  register_date: string;
  user_id: string | null;
}

interface TypeRecordRead {
  id: number;
  name: string;
  color_hex: string;
  icon: string;
}

interface UserRead {
  id: string;
  email: string;
}

interface VehiculosClientProps {
  initialVehicles: VehicleRead[];
  typeRecords: TypeRecordRead[];
  users: UserRead[];
  userLevel: number;
}

export function VehiculosClient({
  initialVehicles,
  typeRecords,
  users,
  userLevel,
}: VehiculosClientProps) {
  const usersList = Array.isArray(users) ? users : users ? Object.values(users as any) : [];
  const safeInitialVehicles = Array.isArray(initialVehicles) ? initialVehicles : [];
  const safeTypeRecords = Array.isArray(typeRecords) ? typeRecords : [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleRead | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const [filtro, setFiltro] = useState("todos");

  const filteredVehicles = safeInitialVehicles.filter((v) => {
    if (filtro === "todos") return true;
    return v.status?.toLowerCase() === filtro.toLowerCase();
  });

  const getAssignedUserDisplay = (userId: string | null) => {
    if (!userId) return "Sin asignar";
    const user = usersList.find((u) => (u as UserRead).id === userId);
    return user ? (user as UserRead).email : "Usuario desconocido";
  };

  const router = useRouter();

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      {/* ================= HEADER ================= */}
      <Flex justify="space-between" align="center" mb={8}>
        <HStack gap={3}>
          <Truck color="#eab308" size={28} />
          <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
            Gestión de Flota - Resumen
          </Text>
        </HStack>
        <HStack gap={4}>
          <Button
            onClick={() => router.push('/dashboard/vehiculos/monitor')}
            size="sm"
            bg="whiteAlpha.100"
            color="gray.300"
            border="1px solid"
            borderColor="whiteAlpha.200"
            _hover={{ bg: "whiteAlpha.200" }}
          >
            Monitor
          </Button>

          {userLevel <= 2 && (
            <Button
              asChild
              size="sm"
              bg="whiteAlpha.100"
              color="gray.300"
              border="1px solid"
              borderColor="yellow.600"
              _hover={{
                bg: "yellow.400",
                color: "black",
                borderColor: "yellow.400",
              }}
              display="flex"
              gap={2}
            >
              <Link href="/dashboard/vehiculos/tipos/nuevo">
                <Settings2 size={16} /> Crear Tipo de Registro
              </Link>
            </Button>
          )}

          <Box
            bg="whiteAlpha.100"
            px={3}
            py={1}
            borderRadius="md"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Text
              fontSize="xs"
              color="gray.300"
              fontWeight="bold"
              textTransform="uppercase"
            >
              Flota Activa
            </Text>
          </Box>
        </HStack>
      </Flex>

      {/* ================= SECCIÓN 1: TARJETAS DINÁMICAS (KPI) ================= */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
        gap={6}
        mb={10}
      >
        {/* Tarjeta Base: Control de Vehículos */}
        <Box
          bg="#18181b"
          p={5}
          borderRadius="xl"
          border="1px solid"
          borderColor="yellow.600"
          position="relative"
          boxShadow="0 4px 20px rgba(0,0,0,0.3)"
        >
          <Badge
            position="absolute"
            top={3}
            right={3}
            bg="whiteAlpha.200"
            color="#3b82f6"
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="sm"
          >
            {initialVehicles.length}
          </Badge>
          <Box mb={2}>
            <Truck color="#3b82f6" size={24} />
          </Box>
          <Text
            textAlign="center"
            color="yellow.400"
            fontWeight="bold"
            fontSize="md"
            mb={4}
          >
            Vehículos
          </Text>
          <Button
            asChild
            w="full"
            size="sm"
            bg="whiteAlpha.200"
            color="gray.300"
            _hover={{ bg: "whiteAlpha.300" }}
          >
            <Link href="/dashboard/vehiculos/nuevo">Gestionar</Link>
          </Button>
        </Box>

        {/* Tarjetas inyectadas dinámicamente usando TypeRecordRead */}
        {typeRecords.map((type) => {
          const IconComponent =
            iconMap[type.icon.toLowerCase()] || ClipboardCheck;

          return (
            <Box
              key={type.id}
              bg="#18181b"
              p={5}
              borderRadius="xl"
              border="1px solid"
              borderColor="yellow.600"
              position="relative"
              boxShadow="0 4px 20px rgba(0,0,0,0.3)"
            >
              <Box mb={2}>
                <IconComponent color={type.color_hex || "#eab308"} size={24} />
              </Box>
              <Text
                textAlign="center"
                color="yellow.400"
                fontWeight="bold"
                fontSize="md"
                mb={4}
              >
                {type.name}
              </Text>
              <Button
                asChild
                w="full"
                size="sm"
                bg="whiteAlpha.200"
                color="gray.300"
                _hover={{ bg: "whiteAlpha.300" }}
              >
                <Link
                  href={`/dashboard/vehiculos/registro/nuevo?type_id=${type.id}`}
                >
                  Gestionar
                </Link>
              </Button>
            </Box>
          );
        })}
      </Grid>

      {/* ================= SECCIÓN 2: TABLA DE VEHÍCULOS ================= */}
      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <HStack gap={2}>
            <ShieldUser color="#3b82f6" size={20} />
            <Text color="yellow.400" fontWeight="bold" fontSize="lg">
              ADMIN - Gestión de Vehículos
            </Text>
          </HStack>

          <Box w="150px">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={{
                background: "black",
                color: "#cbd5e1",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                width: "100%",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="todos" style={{ background: "#18181b" }}>
                Todos
              </option>
              <option value="activo" style={{ background: "#18181b" }}>
                Activos
              </option>
              <option value="mantenimiento" style={{ background: "#18181b" }}>
                Mantenimiento
              </option>
              <option value="inactivo" style={{ background: "#18181b" }}>
                Inactivos
              </option>
            </select>
          </Box>
        </Flex>

        <Box
          bg="#18181b"
          borderRadius="xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          overflow="hidden"
        >
          {/* Header de la tabla adaptado con una columna extra para Acciones */}
          <Grid
            templateColumns="1.2fr 2fr 1fr 1.5fr 1fr 1fr 0.5fr"
            px={6}
            py={4}
            bg="#27272a"
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
            >
              Placa
            </Text>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
            >
              Modelo
            </Text>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
            >
              KM Actual
            </Text>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
            >
              Encargado
            </Text>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
            >
              Estado
            </Text>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
            >
              Registro
            </Text>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
              textAlign="center"
            >
              Ajustes
            </Text>
          </Grid>

          <VStack align="stretch" gap={0}>
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehiculo, index) => (
                <Grid
                  key={vehiculo.id}
                  templateColumns="1.2fr 2fr 1fr 1.5fr 1fr 1fr 0.5fr"
                  px={6}
                  py={4}
                  bg="black"
                  borderBottom={
                    index === filteredVehicles.length - 1 ? "none" : "1px solid"
                  }
                  borderColor="whiteAlpha.100"
                  alignItems="center"
                  _hover={{ bg: "whiteAlpha.50" }}
                  transition="background 0.2s"
                >
                  <Text fontWeight="bold" color="white" fontSize="sm">
                    {vehiculo.license_plate}
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    {vehiculo.model}
                  </Text>
                  <Text color="yellow.400" fontFamily="mono" fontSize="sm">
                    {vehiculo.km_actual}
                  </Text>
                  <Text color="gray.400" fontSize="sm" truncate>
                    {getAssignedUserDisplay(vehiculo.user_id)}
                  </Text>
                  <Box>
                    <Badge
                      bg={
                        vehiculo.status?.toLowerCase() === "activo"
                          ? "green.500"
                          : "orange.500"
                      }
                      color="white"
                      variant="solid"
                      px={2}
                      borderRadius="sm"
                      fontSize="2xs"
                    >
                      {vehiculo.status}
                    </Badge>
                  </Box>
                  <Text color="gray.500" fontSize="sm">
                    {vehiculo.register_date}
                  </Text>

                  {/* Botón de Editar */}
                  <Flex justify="center">
                    <Button
                      size="sm"
                      variant="ghost"
                      color="yellow.400"
                      _hover={{ bg: "whiteAlpha.200" }}
                      onClick={() => {
                        setEditingVehicle(vehiculo);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                  </Flex>
                </Grid>
              ))
            ) : (
              <Box textAlign="center" py={12} bg="black">
                <Text color="gray.500" fontSize="sm">
                  No hay vehículos registrados bajo este criterio.
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Box>

      {/* ================= DIALOG DE EDICIÓN (CHAKRA V3) ================= */}
      <Dialog.Root
        open={isDialogOpen}
        onOpenChange={(e) => setIsDialogOpen(e.open)}
      >
        <Dialog.Backdrop backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="#18181b"
            border="1px solid"
            borderColor="yellow.600"
            color="white"
            borderRadius="xl"
            p={4}
          >
            <Dialog.Header>
              <Dialog.Title color="yellow.400" fontSize="xl" fontWeight="bold">
                Editar Vehículo
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger
              position="absolute"
              top={4}
              right={4}
              color="gray.400"
              _hover={{ color: "white" }}
            />

            <Dialog.Body pb={6} mt={4}>
              {editingVehicle && (
                <form
                  action={(formData) => {
                    startTransition(async () => {
                      setErrorMsg("");
                      const res = await updateVehicleAction(
                        editingVehicle.id,
                        formData,
                      );
                      if (res?.error) {
                        setErrorMsg(res.error);
                      } else {
                        window.location.reload(); // Recargamos para reflejar los cambios de inmediato
                      }
                    });
                  }}
                >
                  <VStack gap={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>
                        Placa
                      </Text>
                      <Input
                        name="license_plate"
                        defaultValue={editingVehicle.license_plate}
                        bg="black"
                        border="1px solid"
                        borderColor="whiteAlpha.300"
                        _focus={{ borderColor: "yellow.400" }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>
                        Modelo
                      </Text>
                      <Input
                        name="model"
                        defaultValue={editingVehicle.model}
                        bg="black"
                        border="1px solid"
                        borderColor="whiteAlpha.300"
                        _focus={{ borderColor: "yellow.400" }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>
                        Kilometraje Actual
                      </Text>
                      <Input
                        name="km_actual"
                        type="number"
                        defaultValue={editingVehicle.km_actual}
                        bg="black"
                        border="1px solid"
                        borderColor="whiteAlpha.300"
                        _focus={{ borderColor: "yellow.400" }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>
                        Estado
                      </Text>
                      <select
                        name="status"
                        defaultValue={editingVehicle.status}
                        style={{
                          width: "100%",
                          padding: "8px",
                          background: "black",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          outline: "none",
                          color: "white",
                        }}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>
                        Conductor Asignado
                      </Text>
                      <select
                        name="user_id"
                        defaultValue={editingVehicle.user_id || ""}
                        style={{
                          width: "100%",
                          padding: "8px",
                          background: "black",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          outline: "none",
                          color: "white",
                        }}
                      >
                        <option value="">-- Sin asignar --</option>
                        {usersList.map((u) => (
                          <option key={(u as UserRead).id} value={(u as UserRead).id}>
                            {(u as UserRead).email}{" "}
                          </option>
                        ))}
                      </select>
                    </Box>

                    {errorMsg && (
                      <Flex
                        bg="red.900/40"
                        color="red.200"
                        p={3}
                        borderRadius="md"
                        align="center"
                        gap={2}
                        border="1px solid"
                        borderColor="red.700"
                      >
                        <AlertCircle size={18} />
                        <Text fontSize="sm">{errorMsg}</Text>
                      </Flex>
                    )}

                    <Button
                      type="submit"
                      bg="yellow.400"
                      color="black"
                      loading={isPending}
                      mt={4}
                      _hover={{ bg: "yellow.500" }}
                      fontWeight="bold"
                    >
                      Guardar Cambios
                    </Button>
                  </VStack>
                </form>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
