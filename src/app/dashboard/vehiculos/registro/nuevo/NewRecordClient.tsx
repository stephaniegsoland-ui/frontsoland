"use client";

import { useActionState, useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  SimpleGrid,
  Textarea,
  Grid,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Save,
  ClipboardList,
  AlertCircle,
  History,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  createFleetRecordAction,
  getVehicleRecordAction,
} from "@/actions/vehiculos";

interface VehicleRead {
  id: string;
  license_plate: string;
  model: string;
}

interface TypeRecordRead {
  id: number;
  name: string;
  color_hex?: string;
  icon?: string;
}

interface RecordDetails {
  notas?: string;
  // Aquí podrás agregar más campos en el futuro (ej: costo?: number, taller?: string)
  [key: string]: unknown; // Permite otros campos si el backend manda más cosas, pero de forma segura
}

interface FleetRecordRead {
  id: string;
  date: string;
  km: number;
  type_record: TypeRecordRead;
  details: RecordDetails; // 👈 Reemplazamos el 'any' por nuestra interfaz segura
}

interface NewRecordProps {
  vehiculos: VehicleRead[];
  tipos: TypeRecordRead[];
}

export function NewRecordClient({ vehiculos, tipos }: NewRecordProps) {
  const searchParams = useSearchParams();
  const typeIdParam = searchParams.get("type_id");

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState(typeIdParam || "");

  const [history, setHistory] = useState<FleetRecordRead[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const currentTypeId = typeIdParam || selectedTypeId;

  const actionWithId = createFleetRecordAction.bind(null, selectedVehicleId);
  const [state, formAction, isPending] = useActionState(actionWithId, null);

  useEffect(() => {
    async function fetchHistory() {
      if (!selectedVehicleId) {
        setHistory([]);
        return;
      }
      setIsLoadingHistory(true);

      try {
        const data = await getVehicleRecordAction(
          selectedVehicleId,
          currentTypeId,
        );

        if (Array.isArray(data)) {
          setHistory(data);
        } else if (data && Array.isArray(data.records)) {
          setHistory(data.records);
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Falló la petición del historial:", error);
        setHistory([]);
      }

      setIsLoadingHistory(false);
    }

    fetchHistory();
  }, [selectedVehicleId, currentTypeId, state?.success]);

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      {/* ================= HEADER ================= */}
      <Flex justify="space-between" align="center" mb={8} maxW="5xl" mx="auto">
        <HStack gap={4}>
          <Button
            asChild
            variant="ghost"
            color="gray.400"
            _hover={{ color: "yellow.400", bg: "whiteAlpha.100" }}
            px={2}
          >
            <Link href="/dashboard/vehiculos">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" color="gray.500">
              Historial Operativo
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Gestión de{" "}
              <Text as="span" color="yellow.400">
                Registros
              </Text>
            </Text>
          </VStack>
        </HStack>
      </Flex>

      <VStack gap={8} maxW="5xl" mx="auto" align="stretch">
        {/* ================= FORMULARIO (ARRIBA) ================= */}
        <Box
          bg="#18181b"
          p={8}
          borderRadius="2xl"
          border="1px solid"
          borderColor="yellow.600"
          boxShadow="0 10px 30px rgba(0,0,0,0.5)"
        >
          <form action={formAction}>
            {/* Campo oculto si el tipo viene forzado por URL */}
            {typeIdParam && (
              <input type="hidden" name="type_id" value={selectedTypeId} />
            )}

            <VStack gap={6} align="stretch">
              <HStack mb={2} gap={2}>
                <ClipboardList size={18} color="#eab308" />
                <Text
                  fontWeight="bold"
                  color="gray.300"
                  fontSize="sm"
                  textTransform="uppercase"
                >
                  Añadir Nuevo Evento
                </Text>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                    Vehículo Involucrado
                  </Text>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
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
                    <option value="">Selecciona un vehículo...</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate} - {v.model}
                      </option>
                    ))}
                  </select>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                    Tipo de Registro
                  </Text>
                  <select
                    name={typeIdParam ? undefined : "type_id"}
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value)}
                    disabled={!!typeIdParam}
                    style={{
                      background: typeIdParam ? "#27272a" : "black",
                      color: typeIdParam ? "#a1a1aa" : "white",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.24)",
                      width: "100%",
                      fontSize: "14px",
                      outline: "none",
                      cursor: typeIdParam ? "not-allowed" : "pointer",
                    }}
                    required
                  >
                    <option value="">Selecciona el evento...</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Box>
              </SimpleGrid>

              <Box>
                <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                  Kilometraje al momento del evento
                </Text>
                <Input
                  name="km"
                  type="number"
                  placeholder="Ej: 45200"
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
                  Observaciones
                </Text>
                <Textarea
                  name="notas"
                  placeholder="Escribe aquí los detalles..."
                  bg="black"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  _focus={{
                    borderColor: "yellow.400",
                    boxShadow: "0 0 0 1px #eab308",
                  }}
                  rows={3}
                />
              </Box>

              {/* Mensajes de feedback */}
              {state?.error && (
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
                  <Text fontSize="sm">{state.error}</Text>
                </Flex>
              )}

              {state?.success && (
                <Text color="green.400" fontSize="sm" textAlign="center">
                  Registro agregado exitosamente.
                </Text>
              )}

              <Button
                type="submit"
                disabled={!selectedVehicleId}
                bg="yellow.400"
                color="black"
                fontWeight="bold"
                _hover={{ bg: "yellow.500" }}
                display="flex"
                gap={2}
                py={6}
                loading={isPending}
              >
                <Save size={18} /> Guardar Registro
              </Button>
            </VStack>
          </form>
        </Box>

        {/* ================= TABLA DE HISTORIAL (ABAJO) ================= */}
        {selectedVehicleId && (
          <Box
            bg="#18181b"
            p={6}
            borderRadius="xl"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <HStack mb={4} gap={2}>
              <History size={18} color="#3b82f6" />
              <Text fontWeight="bold" color="white" fontSize="lg">
                Historial del Vehículo
              </Text>
            </HStack>

            {isLoadingHistory ? (
              <Flex justify="center" p={8}>
                <Spinner color="yellow.400" />
              </Flex>
            ) : (
              <Box
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                overflow="hidden"
              >
                <Grid
                  templateColumns="1fr 1.5fr 1fr 2fr"
                  px={6}
                  py={3}
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
                    Fecha
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.400"
                    textTransform="uppercase"
                  >
                    Tipo Evento
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.400"
                    textTransform="uppercase"
                  >
                    Kilometraje
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.400"
                    textTransform="uppercase"
                  >
                    Notas
                  </Text>
                </Grid>

                <VStack align="stretch" gap={0}>
                  {history.length > 0 ? (
                    history.map((record, i) => (
                      <Grid
                        key={record.id}
                        templateColumns="1fr 1.5fr 1fr 2fr"
                        px={6}
                        py={4}
                        bg="black"
                        borderBottom={
                          i === history.length - 1 ? "none" : "1px solid"
                        }
                        borderColor="whiteAlpha.100"
                        alignItems="center"
                      >
                        <Text fontSize="sm" color="gray.300">
                          {new Date(record.date).toLocaleDateString()}
                        </Text>
                        <Box>
                          <Badge
                            bg="whiteAlpha.200"
                            color={
                              record.type_record?.color_hex || "yellow.400"
                            }
                            px={2}
                            py={1}
                            borderRadius="sm"
                          >
                            {record.type_record?.name || "Desconocido"}
                          </Badge>
                        </Box>
                        <Text fontSize="sm" fontFamily="mono" color="white">
                          {record.km} km
                        </Text>
                        <Text fontSize="xs" color="gray.400" truncate>
                          {record.details?.notas || "Sin observaciones"}
                        </Text>
                      </Grid>
                    ))
                  ) : (
                    <Box textAlign="center" py={8} bg="black">
                      <Text color="gray.500" fontSize="sm">
                        No hay registros previos para este vehículo.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
}
