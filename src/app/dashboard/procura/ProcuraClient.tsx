"use client";

import React from "react";
import { useActionState } from "react";
import type { UserRead } from "@/actions/auth";
import {
  Box,
  Button,
  Flex,
  Grid,
  Input,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { createProcuraAction, updateProcuraStatusAction } from "@/actions/procura";
import { ProcuraStats } from "./ProcuraStats";

interface ProcuraItem {
  id: string;
  requester_id?: string;
  requester_name?: string;
  usage?: string;
  notes?: string;
  requested_at?: string;
  status?: string;
  items?: Array<{
    name?: string;
    quantity?: number;
  }>;
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
}

interface ProcuraClientProps {
  procuras?: ProcuraItem[];
  stockItems?: StockItem[];
  error?: string;
  currentUser?: UserRead | null;
}

type Notification = {
  type: "success" | "error";
  message: string;
};

export function ProcuraClient({ procuras = [], stockItems = [], error, currentUser }: ProcuraClientProps) {
  const [createState, createAction, createPending] = useActionState(createProcuraAction, null);
  const [statusState, statusAction, statusPending] = useActionState(updateProcuraStatusAction, null);
  const [notification, setNotification] = React.useState<Notification | null>(null);
  const [form, setForm] = React.useState({ usage: "", notes: "" });
  const [items, setItems] = React.useState<{ name: string; qty: number }[]>([{ name: "", qty: 1 }]);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 8;

  React.useEffect(() => {
    if (createState?.success) {
      setNotification({ type: "success", message: "Solicitud creada con éxito." });
      setForm({ usage: "", notes: "" });
      setItems([{ name: "", qty: 1 }]);
    }

    if (createState?.error) {
      setNotification({ type: "error", message: createState.error });
    }
  }, [createState]);

  React.useEffect(() => {
    if (statusState?.success) {
      setNotification({ type: "success", message: "Estado de la solicitud actualizado." });
    }

    if (statusState?.error) {
      setNotification({ type: "error", message: statusState.error });
    }
  }, [statusState]);

  function updateForm<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addItemRow() {
    setItems((prev) => [...prev, { name: "", qty: 1 }]);
  }

  function updateItem(index: number, field: "name" | "qty", value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === "qty" ? Number(value) : String(value) } : item,
      ),
    );
  }

  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function normalizeStatus(status: string | undefined) {
    const value = (status || "").toLowerCase();
    if (/pending|pendiente/.test(value)) return "pending";
    if (/progress|progreso|aprobada|approved/.test(value)) return "in_progress";
    if (/completed|terminado|done/.test(value)) return "completed";
    return value || "pending";
  }

  function getStatusLabel(status: string | undefined) {
    switch (normalizeStatus(status)) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En progreso";
      case "completed":
        return "Finalizado";
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      default:
        return status || "Pendiente";
    }
  }

  function getBadgeColor(status: string | undefined) {
    switch (normalizeStatus(status)) {
      case "pending":
        return "yellow";
      case "in_progress":
        return "blue";
      case "completed":
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  }

  function validateBeforeSubmit() {
    if (!form.usage.trim()) return "Ingrese el uso del material solicitado.";
    const validItems = items.filter((item) => item.name.trim() && item.qty > 0);
    if (validItems.length === 0) return "Agrega al menos un material con cantidad válida.";
    return null;
  }

  const filteredProcuras = procuras.filter((procura) => {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    return (
      (procura.usage || "").toLowerCase().includes(lowerQuery) ||
      (procura.requester_name || "").toLowerCase().includes(lowerQuery) ||
      (procura.status || "").toLowerCase().includes(lowerQuery) ||
      (procura.items || []).some((item) => (item.name || "").toLowerCase().includes(lowerQuery))
    );
  });

  const pagedProcuras = filteredProcuras.slice(page * pageSize, (page + 1) * pageSize);
  const totalMaterials = procuras.reduce(
    (sum, procura) => sum + (procura.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) ?? 0),
    0,
  );

  const isAdminOrSupervisor = currentUser?.is_superuser || (currentUser?.level != null && currentUser.level <= 2);

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Box maxW="7xl" mx="auto">
        <ProcuraStats procuras={procuras} />
        <Flex direction={{ base: "column", lg: "row" }} gap={6} mt={6}>
          <Box flex="1" bg="#18181b" p={6} borderRadius="3xl" border="1px solid" borderColor="yellow.600">
            <Text fontSize="2xl" fontWeight="bold" color="yellow.400" mb={2}>
              Nueva solicitud de material
            </Text>
            <Text color="gray.400" mb={6}>
              Registra tu pedido con material, cantidad y uso. Solo verás tus propias solicitudes.
            </Text>

            <Box>
              <form
                action={createAction}
                onSubmit={(event) => {
                  const errorMessage = validateBeforeSubmit();
                  if (errorMessage) {
                    event.preventDefault();
                    setNotification({ type: "error", message: errorMessage });
                  }
                }}
              >
                <Grid templateColumns={{ base: "1fr" }} gap={4}>
                  <Input
                    name="usage"
                    placeholder="Uso / proyecto"
                    bg="black"
                    value={form.usage}
                    onChange={(event) => updateForm("usage", event.target.value)}
                  />
                  <Input
                    name="notes"
                    placeholder="Notas (opcional)"
                    bg="black"
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                  />
                </Grid>

                <Box mt={6}>
                  <Text color="gray.300" mb={3} fontWeight="semibold">
                    Materiales solicitados
                  </Text>
                  <VStack align="stretch" gap={3}>
                    {items.map((item, index) => (
                      <Flex key={index} gap={2} align="flex-start" wrap="wrap">
                        <Input
                          name="item_name"
                          placeholder="Material"
                          bg="black"
                          value={item.name}
                          onChange={(event) => updateItem(index, "name", event.target.value)}
                          list={`stock-items-${index}`}
                        />
                        <Input
                          name="item_qty"
                          type="number"
                          placeholder="Cantidad"
                          bg="black"
                          value={item.qty}
                          min={1}
                          max={9999}
                          onChange={(event) => updateItem(index, "qty", Number(event.target.value))}
                          w={{ base: "100%", sm: "120px" }}
                        />
                        <Button type="button" size="sm" colorScheme="red" onClick={() => removeItemRow(index)}>
                          Eliminar
                        </Button>
                        <datalist id={`stock-items-${index}`}>
                          {stockItems.map((stockItem) => (
                            <option key={stockItem.id} value={stockItem.name} />
                          ))}
                        </datalist>
                      </Flex>
                    ))}
                  </VStack>
                  <Button type="button" mt={3} size="sm" variant="outline" onClick={addItemRow}>
                    + Agregar material
                  </Button>
                </Box>

                {(notification || error || createState?.success || statusState?.success) && (
                  <Box
                    mt={5}
                    p={4}
                    borderRadius="xl"
                    bg={notification?.type === "success" || createState?.success || statusState?.success ? "green.900/20" : "red.900/20"}
                    border="1px solid"
                    borderColor={notification?.type === "success" || createState?.success || statusState?.success ? "green.500/30" : "red.500/30"}
                  >
                    <Text color={notification?.type === "success" || createState?.success || statusState?.success ? "green.300" : "red.300"}>
                      {notification?.message || createState?.error || statusState?.error || error || "Solicitud creada con éxito."}
                    </Text>
                  </Box>
                )}

                <Button mt={6} type="submit" w="full" bg="yellow.400" color="black" _hover={{ bg: "yellow.500" }} py={5} loading={createPending}>
                  Crear solicitud de material
                </Button>
              </form>
            </Box>
          </Box>

          <Box flex="1.2" bg="#18181b" p={6} borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.100">
            <Text fontSize="2xl" fontWeight="bold" mb={2}>
              Tus solicitudes
            </Text>
            <Text color="gray.400" mb={4}>
              Este listado contiene solo tus solicitudes de material.
            </Text>

            <Input
              placeholder="Buscar por uso, estado o material"
              bg="#10101a"
              borderColor="#2d2d2d"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />

            <Box mt={6} bg="#0b0b0c" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
              <Text color="gray.400" fontSize="sm" mb={3}>
                Resumen
              </Text>
              <Flex gap={3} wrap="wrap">
                <Box flex="1" minW="120px" p={3} bg="#121212" borderRadius="2xl">
                  <Text color="gray.400" fontSize="xs">
                    Solicitudes
                  </Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">
                    {procuras.length}
                  </Text>
                </Box>
                <Box flex="1" minW="120px" p={3} bg="#121212" borderRadius="2xl">
                  <Text color="gray.400" fontSize="xs">
                    Materiales totales
                  </Text>
                  <Text color="white" fontSize="2xl" fontWeight="bold">
                    {totalMaterials}
                  </Text>
                </Box>
              </Flex>
            </Box>

            <Box mt={5} bg="#0b0b0c" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
              <VStack align="stretch" gap={3}>
                {pagedProcuras.length > 0 ? (
                  pagedProcuras.map((procura) => (
                    <Box key={procura.id} borderTop="1px solid rgba(255,255,255,0.08)" pt={3}>
                      <Text fontWeight="semibold">Solicitud {procura.id}</Text>
                      <Text color="gray.400" fontSize="xs">
                        {procura.requester_name || currentUser?.username || "Tú"}
                      </Text>
                      <VStack align="flex-start" gap={1} mt={2}>
                        {(procura.items || []).length > 0 ? (
                          procura.items!.map((item, index) => (
                            <Text key={index} color="white">
                              {item.name || "Material"} - {item.quantity ?? 0}
                            </Text>
                          ))
                        ) : (
                          <Text color="gray.500">Sin materiales</Text>
                        )}
                      </VStack>
                      <Flex justify="space-between" align="center" mt={2} wrap="wrap" gap={2}>
                        <Text color="gray.400">Uso: {procura.usage || "-"}</Text>
                      <Badge colorScheme={getBadgeColor(procura.status)} variant="subtle" py={2} px={3} borderRadius="full">
                        {getStatusLabel(procura.status)}
                      </Badge>
                      {procura.notes ? (
                        <Text color="gray.400" fontSize="sm">Notas: {procura.notes}</Text>
                      ) : null}
                      {isAdminOrSupervisor ? (
                        <Box mt={3} p={3} bg="#121212" borderRadius="2xl">
                          <Text color="gray.300" fontSize="sm" mb={2}>Actualizar estado</Text>
                          <form action={statusAction}>
                            <input type="hidden" name="request_id" value={procura.id} />
                            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                              <Input
                                name="status"
                                placeholder="Estado"
                                bg="black"
                                list={`procura-statuses-${procura.id}`}
                              />
                              <Input
                                name="notes"
                                placeholder="Notas (opcional)"
                                bg="black"
                              />
                            </Grid>
                            <datalist id={`procura-statuses-${procura.id}`}>
                              <option value="pending" />
                              <option value="in_progress" />
                              <option value="completed" />
                              <option value="approved" />
                              <option value="rejected" />
                            </datalist>
                            <Button mt={3} size="sm" type="submit" loading={statusPending}>
                              Guardar estado
                            </Button>
                          </form>
                        </Box>
                      ) : null}
                      </Flex>
                      <Text color="gray.400" fontSize="sm" mt={1}>
                        {procura.requested_at ? new Date(procura.requested_at).toLocaleDateString("es-PE") : "-"}
                      </Text>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" py={4} textAlign="center">
                    {currentUser ? "No hay solicitudes de material para este usuario." : "Inicia sesión para ver tus solicitudes."}
                  </Text>
                )}
              </VStack>
            </Box>

            <Flex gap={2} mt={5} justify="flex-end" align="center" flexWrap="wrap">
              <Button size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                Anterior
              </Button>
              <Button size="sm" onClick={() => setPage((current) => current + 1)} disabled={(page + 1) * pageSize >= filteredProcuras.length}>
                Siguiente
              </Button>
              <Text color="gray.400">{filteredProcuras.length} resultados</Text>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
