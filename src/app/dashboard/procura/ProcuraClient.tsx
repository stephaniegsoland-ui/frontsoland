"use client";

import React from "react";
import { useActionState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Grid,
  Textarea,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { Plus, List } from "lucide-react";
import { createProcuraAction } from "@/actions/procura";

interface ProcuraItem {
  id: string;
  reference?: string;
  supplier?: string;
  description?: string;
  use?: string;
  requester_name?: string;
  requester_department?: string;
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  category_id: number;
}

interface ProcuraClientProps {
  procuras?: ProcuraItem[];
  stockItems?: StockItem[];
  error?: string;
}

export function ProcuraClient({ procuras, stockItems, error }: ProcuraClientProps) {
  const [state, formAction, isPending] = useActionState(createProcuraAction, null);
  const [items, setItems] = React.useState([
    { name: "", qty: 1, id: "" },
  ]);

  function addItemRow() {
    setItems((s) => [...s, { name: "", qty: 1, id: "" }]);
  }

  function removeItemRow(index: number) {
    setItems((s) => s.filter((_, i) => i !== index));
  }

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Box bg="#18181b" p={6} borderRadius="xl" border="1px solid" borderColor="yellow.600" maxW="5xl" mx="auto">
        <Flex align="center" gap={3} mb={4}>
          <List color="#eab308" size={22} />
          <Text fontSize="xl" fontWeight="bold" color="yellow.400">Solicitud de Materiales (Procura)</Text>
          <Button size="xs" variant="outline" borderColor="whiteAlpha.300" color="gray.300" ml={2}>Resumen</Button>
        </Flex>

        <form action={formAction}>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mb={4}>
            <Input name="reference" placeholder="Referencia (opcional)" bg="black" />
            <Input name="supplier" placeholder="Proveedor" bg="black" />
            <Input name="usage" placeholder="Uso de la solicitud" bg="black" />
            <Textarea name="description" placeholder="Descripción" bg="black" />
          </Grid>

          <Text color="gray.300" mb={2}>Artículos solicitados</Text>

          <VStack align="start" gap={2} mb={4}>
            {items.map((it, idx) => (
              <HStack key={idx} gap={2} w="full">
                <Box flex={1}>
                  <Input
                    name="item_name"
                    placeholder="Nombre del ítem"
                    bg="black"
                    defaultValue={it.name}
                    list={`stock-items-${idx}`}
                  />
                  {stockItems && (
                    <datalist id={`stock-items-${idx}`}>
                      {stockItems.map((item) => (
                        <option key={item.id} value={item.name} />
                      ))}
                    </datalist>
                  )}
                </Box>
                <Input name="item_qty" placeholder="Cantidad" bg="black" type="number" defaultValue={it.qty} min={1} />
                <Button size="sm" colorScheme="red" onClick={() => removeItemRow(idx)}>Eliminar</Button>
              </HStack>
            ))}
            <Button size="sm" onClick={addItemRow} leftIcon={<Plus size={14} />}>Agregar ítem</Button>
          </VStack>

          <Text color="gray.300" mb={2}>Atributos adicionales</Text>
          <VStack align="start" gap={2} mb={4}>
            <HStack gap={2}>
              <Input name="attr_keys" placeholder="Clave (Ej: unidad)" bg="black" />
              <Input name="attr_values" placeholder="Valor (Ej: caja)" bg="black" />
            </HStack>
            <Text fontSize="sm" color="gray.400">Puedes enviar múltiples pares `attr_keys`/`attr_values` repitiendo los inputs.</Text>
          </VStack>

          {error && (
            <Text color="red.400" mb={3}>{error}</Text>
          )}
          {state?.error && <Text color="red.400" mb={3}>{state.error}</Text>}
          {state?.success && <Text color="green.400" mb={3}>Solicitud creada.</Text>}

          <Button type="submit" w="full" bg="whiteAlpha.400" color="white" _hover={{ bg: "yellow.400", color: "black" }} py={4} loading={isPending}>
            <Plus size={16} style={{ marginRight: 8 }} /> Crear Solicitud
          </Button>
        </form>

        <Box mt={6}>
          <Text fontSize="lg" fontWeight="bold" mb={3}>Solicitudes recientes</Text>
          {procuras === undefined && (
            <Box mt={4}>
              <Text color="red.300" mb={2}>Parece que no estás autenticado o hubo un error al cargar las procuras.</Text>
              <HStack gap={2}>
                <Button size="sm" onClick={() => (window.location.href = "/")}>Iniciar sesión</Button>
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
              </HStack>
            </Box>
          )}
          {procuras?.length === 0 && (
            <Text color="gray.400">No hay solicitudes registradas.</Text>
          )}
          {procuras?.map((p) => (
            <Box key={p.id} bg="#0b0b0c" p={3} borderRadius="md" mb={2} border="1px solid" borderColor="whiteAlpha.50">
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="bold">{p.reference || p.id}</Text>
                <Text color={p.status === "pending" ? "yellow.300" : p.status === "available" ? "green.300" : "red.300"} fontSize="sm">
                  {p.status}
                </Text>
              </Flex>
              <Text color="gray.300">{p.description}</Text>
              <Text color="gray.400" fontSize="sm">Proveedor: {p.supplier || "-"}</Text>
              <Text color="gray.400" fontSize="sm">Uso: {p.usage || "-"}</Text>
              <Text color="gray.400" fontSize="sm">Solicitado por: {p.requester_name || "Campo"}</Text>
              <Text color="gray.400" fontSize="sm">Departamento: {p.requester_department || "Sin departamento"}</Text>
              <Text color="gray.400" fontSize="sm">Fecha: {new Date(p.requested_at).toLocaleString()}</Text>
              {p.items?.map((item, index) => (
                <Box key={index} mt={2} p={2} bg="#121212" borderRadius="md">
                  <Text fontWeight="bold" color="white">{item.name || "Sin nombre"}</Text>
                  <Text fontSize="sm" color="gray.300">Cantidad: {item.quantity} — Stock: {item.available_quantity ?? 0}</Text>
                  <Text fontSize="sm" color={item.status === "available" ? "green.300" : item.status === "insufficient" ? "yellow.300" : "red.300"}>
                    Estado: {item.status}
                  </Text>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
