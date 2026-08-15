"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Text,
  HStack,
  VStack,
  Button,
  Badge,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Shield, Thermometer, Clock, MapPin } from "lucide-react";

const COLORS = ["#f6ad55", "#38b2ac", "#63b3ed", "#d53f8c"];

export function VehicleMonitorClient() {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  // Synthetic demo data — replace with backend calls if desired
  const kpi = {
    totalKmToday: 124,
    fuelAvg: 8.6,
    tripsToday: 5,
    pendingMaintenance: 2,
  };

  const trendData = useMemo(() => {
    const pts = range === "7d" ? 7 : 30;
    return Array.from({ length: pts }, (_, i) => ({
      day: `D${i + 1}`,
      km: Math.round(50 + Math.sin(i / 2) * 12 + i * 2),
    }));
  }, [range]);

  const statusPie = useMemo(
    () => [
      { name: "Operativo", value: 18 },
      { name: "Mantenimiento", value: 2 },
      { name: "Inactivo", value: 1 },
    ],
    []
  );

  const drivingTips = [
    "Mantén siempre la distancia de seguridad.",
    "Realiza la inspección visual antes de iniciar el turno.",
    "Evita uso de móvil y distracciones al conducir.",
    "Respeta los límites de velocidad y señales.",
  ];

  const router = useRouter();

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <HStack justify="space-between" align="start" mb={6}>
        <VStack align="start" gap={4}>
          <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
            Monitor de Vehículo
          </Text>
          <Text color="gray.400">Indicadores y consejos para conductores</Text>
        </VStack>
        <Button onClick={() => router.push('/dashboard/vehiculos')} size="sm" variant="ghost" color="gray.300" _hover={{ color: "yellow.400" }}>
          Ver Vehículos
        </Button>
      </HStack>

      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
        <Box bg="#18181b" p={4} borderRadius="lg">
          <HStack>
            <Thermometer color="#eab308" />
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.400">KM hoy</Text>
              <Text fontSize="2xl" fontWeight="bold">{kpi.totalKmToday}</Text>
            </VStack>
          </HStack>
        </Box>

        <Box bg="#18181b" p={4} borderRadius="lg">
          <HStack>
            <Clock color="#eab308" />
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.400">Viajes hoy</Text>
              <Text fontSize="2xl" fontWeight="bold">{kpi.tripsToday}</Text>
            </VStack>
          </HStack>
        </Box>

        <Box bg="#18181b" p={4} borderRadius="lg">
          <HStack>
            <MapPin color="#eab308" />
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.400">Consumo promedio</Text>
              <Text fontSize="2xl" fontWeight="bold">{kpi.fuelAvg} L/100km</Text>
            </VStack>
          </HStack>
        </Box>

        <Box bg="#18181b" p={4} borderRadius="lg">
          <HStack>
            <Shield color="#eab308" />
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="gray.400">Mantenimientos</Text>
              <Text fontSize="2xl" fontWeight="bold">{kpi.pendingMaintenance}</Text>
            </VStack>
          </HStack>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        <Box bg="#18181b" p={4} borderRadius="xl">
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="bold">Tendencia de kilómetros</Text>
            <HStack>
              <Button size="xs" variant={range === "7d" ? "solid" : "outline"} onClick={() => setRange("7d")}>7d</Button>
              <Button size="xs" variant={range === "30d" ? "solid" : "outline"} onClick={() => setRange("30d")}>30d</Button>
            </HStack>
          </HStack>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="km" stroke="#f6ad55" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box bg="#18181b" p={4} borderRadius="xl">
          <Text fontWeight="bold" mb={3}>Estado de la flota</Text>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60}>
                {statusPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6} mt={6}>
        <Box bg="#18181b" p={4} borderRadius="xl">
          <Text fontWeight="bold" mb={3}>Consejos de seguridad vial</Text>
          <VStack align="start" gap={3}>
            {drivingTips.map((t, i) => (
              <Box key={i} bg="#0b0b0c" p={3} borderRadius="md">
                <Text color="gray.200">{t}</Text>
              </Box>
            ))}
          </VStack>
        </Box>

        <Box bg="#18181b" p={4} borderRadius="xl">
          <Text fontWeight="bold" mb={3}>Alertas rápidas</Text>
          <VStack align="start" gap={2}>
            <Box bg="#2a0b0b" p={3} borderRadius="md">
              <Text color="red.200" fontWeight="bold">Revisión pendiente</Text>
              <Text color="gray.300" fontSize="sm">Aceite y frenos - 1200 km restantes</Text>
            </Box>
            <Box bg="#111" p={3} borderRadius="md">
              <Text color="yellow.300" fontWeight="bold">Recordatorio</Text>
              <Text color="gray.300" fontSize="sm">Completa la inspección pre‑turno antes de salir.</Text>
            </Box>
          </VStack>
        </Box>
      </Grid>
    </Box>
  );
}
