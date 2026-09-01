"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Box, Heading, VStack, Text, Button, HStack, SimpleGrid, Badge, ProgressRoot } from "@chakra-ui/react";
import { AlertCircle, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";

const demoPendientes = [
  { id: 1, title: "Factura pendiente de revisión", client_name: "Transportes Sol", status: "abierto", priority: "alta", due_date: "2026-07-08", type: "retención" },
  { id: 2, title: "Documento incompleto", client_name: "Logística Norte", status: "en_proceso", priority: "media", due_date: "2026-07-09", type: "empresa" },
  { id: 3, title: "Peaje por aprobar", client_name: "Distribuidora Vega", status: "resuelto", priority: "baja", due_date: "2026-07-04", type: "peaje" },
];

export default function PendientesPage() {
  const [pendientes, setPendientes] = useState<any[]>(demoPendientes);

  useEffect(() => {
    const loadPendientes = async () => {
      try {
        const res = await fetch("/api/admin/activity", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((item: any, index: number) => ({
              id: item.id ?? index + 1,
              title: item.detail || item.action || "Registro pendiente",
              client_name: item.actor || "—",
              status: item.status || "abierto",
              priority: item.priority || "media",
              due_date: item.date || new Date().toISOString(),
              type: item.type || "general",
            }));
            setPendientes(mapped);
            return;
          }
        }
      } catch (error) {
        console.error(error);
      }
      setPendientes(demoPendientes);
    };

    loadPendientes();
  }, []);

  const markResolved = async (id: number) => {
    await fetch(`/api/invoices/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "resolved" }),
    });
    setPendientes((s) => s.map((p) => (p.id === id ? { ...p, status: "resuelto" } : p)));
  };

  const metrics = useMemo(() => {
    const total = pendientes.length;
    const abiertos = pendientes.filter((p) => p.status !== "resuelto").length;
    const resueltos = total - abiertos;
    const critical = pendientes.filter((p) => p.priority === "alta").length;
    const completion = total ? Math.round((resueltos / total) * 100) : 0;
    return { total, abiertos, resueltos, critical, completion };
  }, [pendientes]);

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="md" mb={2}>Pendientes generales</Heading>
      <Text color="gray.400" mb={6}>Prioriza tareas, revisa estatus y acelera el cierre de los puntos abiertos.</Text>

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><AlertCircle size={18} color="#f6e05e" /><Badge colorScheme="red">Abiertos</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.abiertos}</Text>
          <Text color="gray.400" fontSize="sm">Requieren atención</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><CheckCircle2 size={18} color="#f6e05e" /><Badge colorScheme="green">Resueltos</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.resueltos}</Text>
          <Text color="gray.400" fontSize="sm">Cerrados hasta ahora</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><Clock3 size={18} color="#f6e05e" /><Badge colorScheme="orange">Alta prioridad</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.critical}</Text>
          <Text color="gray.400" fontSize="sm">Con seguimiento urgente</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><FileCheck2 size={18} color="#f6e05e" /><Badge colorScheme="blue">Progreso</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.completion}%</Text>
          <ProgressRoot value={metrics.completion} colorScheme="yellow" mt={2} />
        </Box>
      </SimpleGrid>

      <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
        <Heading size="sm" mb={3}>Lista de pendientes</Heading>
        <VStack align="stretch" gap={3}>
          {pendientes.map((p) => (
            <Box key={p.id} borderTop="1px solid rgba(255,255,255,0.06)" pt={2}>
              <Text fontWeight="bold">{p.title}</Text>
              <Text fontSize="sm" color="gray.400">Cliente: {p.client_name} • Tipo: {p.type}</Text>
              <HStack gap={2} mt={1}>
                <Badge colorScheme={p.priority === "alta" ? "red" : p.priority === "media" ? "orange" : "green"}>{p.priority}</Badge>
                <Text fontSize="sm" color="gray.400">Vence: {new Date(p.due_date || Date.now()).toLocaleDateString("es-VE")}</Text>
              </HStack>
              <HStack gap={2} mt={2}>
                <Button size="sm" colorScheme="yellow" onClick={() => window.location.href = `/dashboard/administracion/retencion?invoice=${p.id}`}>Revisar</Button>
                <Button size="sm" colorScheme="green" onClick={() => markResolved(p.id)} disabled={p.status === "resuelto"}>Marcar resuelto</Button>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
