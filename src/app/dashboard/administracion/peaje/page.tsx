"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Box, Heading, VStack, Input, Button, Text, HStack, SimpleGrid, Badge, Textarea } from "@chakra-ui/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$|\/$/, "") || "http://localhost:8000";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CircleDollarSign, FileText, Truck, AlertCircle } from "lucide-react";

const demoPeajes = [
  { id: 1, driver: "Carlos Rojas", amount: 240, created_at: "2026-07-06", status: "aprobado", notes: "Ruta Norte" },
  { id: 2, driver: "Marlon Pérez", amount: 180, created_at: "2026-07-05", status: "pendiente", notes: "Peaje de retorno" },
  { id: 3, driver: "Carlos Rojas", amount: 310, created_at: "2026-07-04", status: "aprobado", notes: "Tramo central" },
];

export default function PeajePage() {
  const [driver, setDriver] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [peajes, setPeajes] = useState<any[]>(demoPeajes);

  const submit = async () => {
    const form = new FormData();
    form.append("driver", driver);
    form.append("amount", amount);
    form.append("notes", notes);
    if (file) form.append("file", file);
    await fetch("/api/admin/peaje", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    setPeajes((s) => [{ id: Date.now(), driver, amount: Number(amount || 0), created_at: new Date().toISOString(), status: "pendiente", notes }, ...s]);
    setDriver("");
    setAmount("");
    setNotes("");
    setFile(null);
  };

  const loadLocalVehiclePeajes = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("vehiculoPeajeSubmissions");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const mergePeajes = (localItems: any[], fetchedItems: any[]) => {
    const existingIds = new Set(fetchedItems.map((item) => item.id));
    const mergedLocal = localItems.filter((item) => !existingIds.has(item.id));
    return [...mergedLocal, ...fetchedItems];
  };

  useEffect(() => {
    const loadPeajes = async () => {
      const localPeajes = loadLocalVehiclePeajes();
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/peaje`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPeajes(mergePeajes(localPeajes, data));
            return;
          }
        }
      } catch (error) {
        console.error(error);
      }
      setPeajes(mergePeajes(localPeajes, demoPeajes));
    };

    const handleStorage = () => {
      const localPeajes = loadLocalVehiclePeajes();
      setPeajes((current) => mergePeajes(localPeajes, current));
    };

    window.addEventListener("storage", handleStorage);
    loadPeajes();
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const metrics = useMemo(() => {
    const totalAmount = peajes.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = peajes.filter((p) => p.status === "pendiente").length;
    const approved = peajes.filter((p) => p.status === "aprobado").length;
    const average = peajes.length ? totalAmount / peajes.length : 0;
    const driverTotals = peajes.reduce<Record<string, number>>((acc, p) => {
      acc[p.driver] = (acc[p.driver] || 0) + Number(p.amount || 0);
      return acc;
    }, {});

    const chartData = Object.entries(driverTotals).map(([name, value]) => ({ name, value }));
    return { totalAmount, pending, approved, average, chartData };
  }, [peajes]);

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="md" mb={2}>Control de peajes</Heading>
      <Text color="gray.400" mb={6}>Registra, revisa y analiza los gastos de peaje por chofer y por periodo.</Text>

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><CircleDollarSign size={18} color="#f6e05e" /><Badge colorScheme="green">Monto</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">Bs. {metrics.totalAmount.toLocaleString("es-VE")}</Text>
          <Text color="gray.400" fontSize="sm">Total del periodo</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><Truck size={18} color="#f6e05e" /><Badge colorScheme="yellow">Choferes</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">{new Set(peajes.map((p) => p.driver)).size}</Text>
          <Text color="gray.400" fontSize="sm">Registrados</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><AlertCircle size={18} color="#f6e05e" /><Badge colorScheme="red">Pendientes</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.pending}</Text>
          <Text color="gray.400" fontSize="sm">Por aprobar</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}><FileText size={18} color="#f6e05e" /><Badge colorScheme="blue">Promedio</Badge></HStack>
          <Text fontSize="2xl" fontWeight="bold">Bs. {Math.round(metrics.average).toLocaleString("es-VE")}</Text>
          <Text color="gray.400" fontSize="sm">Por registro</Text>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6} mb={6}>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <Heading size="sm" mb={4}>Registrar nuevo peaje</Heading>
          <VStack align="stretch" gap={3}>
            <Box>
              <Text fontSize="sm" mb={1} color="gray.300">Chofer</Text>
              <Input value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Nombre del chofer" />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} color="gray.300">Monto</Text>
              <Input value={amount} type="number" onChange={(e) => setAmount(e.target.value)} placeholder="Ej. 250" />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} color="gray.300">Notas</Text>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} minH="96px" placeholder="Detalle del peaje o peaje" />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} color="gray.300">Adjuntar factura</Text>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Box>
            <Button colorScheme="yellow" onClick={submit}>Guardar peaje</Button>
          </VStack>
        </Box>

        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <Heading size="sm" mb={4}>Gasto por chofer</Heading>
          <Box height="240px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(value) => `Bs. ${value}`} />
                <Bar dataKey="value" fill="#f6e05e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </SimpleGrid>

      <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
        <Heading size="sm" mb={3}>Últimos registros</Heading>
        <VStack align="stretch" gap={3}>
          {peajes.map((p) => (
            <Box key={p.id} borderTop="1px solid rgba(255,255,255,0.06)" pt={2}>
              <Text fontWeight="bold">{p.driver}</Text>
              <Text fontSize="sm" color="gray.400">Bs. {Number(p.amount || 0).toLocaleString("es-VE")}</Text>
              <HStack gap={2} mt={1}>
                <Badge colorScheme={p.status === "aprobado" ? "green" : "orange"}>{p.status}</Badge>
                <Text fontSize="sm" color="gray.400">{new Date(p.created_at || Date.now()).toLocaleDateString("es-VE")}</Text>
              </HStack>
              <Text fontSize="sm" color="gray.400" mt={1}>{p.notes || "—"}</Text>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
