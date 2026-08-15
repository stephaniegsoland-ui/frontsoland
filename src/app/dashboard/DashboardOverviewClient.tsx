"use client";

import NextLink from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { PieChart, Pie } from "recharts";
import { Bell, Package, ArrowRight, Plus } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

interface CategoryRead {
  id: number;
  name: string;
  color_hex: string;
  icon: string;
  cantidad?: number;
}

interface ResumenItem {
  name: string;
  cantidad: number;
  fill?: string;
}

interface ResumenData {
  items?: ResumenItem[];
}

interface DashboardOverviewClientProps {
  username: string;
  level: number;
  categories: CategoryRead[];
  resumen: ResumenData;
  errorMessage?: string | null;
}

const AVAILABLE_COLORS = [
  "#f6ad55",
  "#38b2ac",
  "#63b3ed",
  "#d53f8c",
  "#faf089",
  "#fd7d14",
];

function normalizeColor(val?: string): string {
  if (!val) return "#6b46c1";
  const v = val.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  return v;
}

export function DashboardOverviewClient({ username, level, categories, resumen, errorMessage }: DashboardOverviewClientProps) {
  const { notifications, unreadCount } = useNotifications();

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeResumenItems = Array.isArray(resumen?.items) ? resumen.items : [];

  const totalItems = useMemo(
    () =>
      safeResumenItems.reduce((sum, item) => sum + (item.cantidad || 0), 0) ||
      safeCategories.reduce((sum, cat) => sum + (cat.cantidad || 0), 0),
    [safeCategories, safeResumenItems]
  );

  const roleLabel = level === 1 ? "Administrador" : level === 2 ? "Supervisor" : "Operador";

  const topCategory = useMemo(() => {
    const sorted = [...(safeResumenItems.length > 0 ? safeResumenItems : safeCategories.map((cat) => ({ name: cat.name, cantidad: cat.cantidad || 0, fill: normalizeColor(cat.color_hex) })))]
      .sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0));
    return sorted[0] || { name: "Sin categorías", cantidad: 0, fill: "#718096" };
  }, [safeCategories, safeResumenItems]);

  const categoryChartData = useMemo(
    () =>
      (safeResumenItems.length > 0 ? safeResumenItems : safeCategories.map((cat) => ({ name: cat.name, cantidad: cat.cantidad || 0, fill: normalizeColor(cat.color_hex) })))
        .map((item, index) => ({
          ...item,
          fill: normalizeColor(item.fill || AVAILABLE_COLORS[index % AVAILABLE_COLORS.length]),
        })),
    [safeCategories, safeResumenItems]
  );

  const latestNotifications = notifications.slice(0, 3);

  // Low stock calculation (threshold configurable)
  const LOW_STOCK_THRESHOLD = 5;
  const lowStockItems = useMemo(() => {
    const source = safeResumenItems.length > 0 ? safeResumenItems : safeCategories.map((c) => ({ name: c.name, cantidad: c.cantidad || 0 }));
    return source.filter((it) => (it.cantidad || 0) > 0 && (it.cantidad || 0) <= LOW_STOCK_THRESHOLD);
  }, [safeCategories, safeResumenItems]);

  // Top movements (by cantidad)
  const topMovements = useMemo(() => {
    const source = safeCategories.map((c) => ({ name: c.name, cantidad: c.cantidad || 0 }));
    return source.sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0)).slice(0, 5);
  }, [safeCategories]);

  // Critical alerts
  const criticalAlerts = notifications.filter((n) => n.type === "error");

  const securitySummary = useMemo(() => {
    if (criticalAlerts.length > 0) {
      return {
        title: "Revisión urgente",
        message: "Hay alertas críticas. Prioriza la verificación de EPP, operadores y tareas pendientes.",
      };
    }
    if (unreadCount > 0) {
      return {
        title: "Revisión recomendada",
        message: "Tienes notificaciones sin leer. Revisa el estado de seguridad y el stock antes de continuar.",
      };
    }
    return {
      title: "Todo en orden",
      message: "Sin alertas críticas. Mantén seguimiento de EPP, stock y flota para evitar incidencias.",
    };
  }, [criticalAlerts.length, unreadCount]);

  // Date range selector for trend (7,30,90 days)
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");

  // Generate a simple synthetic trend based on current totals to show on the chart
  const trendData = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const base = totalItems || 1;
    const points = Math.min(12, Math.ceil(days / Math.max(1, Math.round(days / 12))));
    const arr = Array.from({ length: points }, (_, i) => {
      const factor = 0.6 + (i / Math.max(1, points - 1)) * 0.8; // spread
      return {
        label: `${i + 1}`,
        total: Math.max(0, Math.round(base * factor * (0.6 + (Math.sin(i) + 1) * 0.2))),
      };
    });
    return arr;
  }, [range, totalItems]);

  return (
    <Box p={8} bg="#08080a" minH="100vh" color="white">
      {errorMessage && (
        <Box mb={6} p={4} bg="red.950" border="1px solid" borderColor="red.700" borderRadius="xl">
          <Text fontWeight="bold" color="red.200">
            No se pudo cargar el resumen del inventario
          </Text>
          <Text color="red.100" mt={1}>
            {errorMessage}
          </Text>
        </Box>
      )}

      <VStack align="start" gap={3} mb={8}>
        <Heading as="h1" size="xl" color="yellow.400">
          Bienvenido de vuelta, {username}
        </Heading>
        <Text color="gray.300" fontSize="sm" fontWeight="medium">
          Rol: {roleLabel}
        </Text>
        <Text color="gray.400" fontSize="md" maxW="3xl">
          Este es tu tablero principal. Aquí monitoreas el stock, recibes alertas rápidas y accedes a los módulos más importantes.
        </Text>
      </VStack>

      <Grid templateColumns={{ base: "1fr", md: "repeat(6, 1fr)" }} gap={4} mb={8}>
        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
            Ítems en stock
          </Text>
          <Text fontSize="3xl" fontWeight="extrabold" color="white" mt={3}>
            {totalItems}
          </Text>
          <Text color="gray.400" mt={2}>
            Total acumulado en todas las categorías.
          </Text>
        </Box>

        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
            Categorías activas
          </Text>
          <Text fontSize="3xl" fontWeight ="extrabold" color="yellow.400" mt={3}>
            {safeCategories.length}
          </Text>
          <Text color="gray.400" mt={2}>
            Secciones disponibles en tu inventario.
          </Text>
        </Box>

        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
            Alertas no leídas
          </Text>
          <Text fontSize="3xl" fontWeight="extrabold" color={unreadCount > 0 ? "red.400" : "green.400"} mt={3}>
            {unreadCount}
          </Text>
          <Text color="gray.400" mt={2}>
            {unreadCount > 0 ? "Revisa las últimas notificaciones." : "No hay alertas pendientes."}
          </Text>
        </Box>

        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
            Top categoría
          </Text>
          <Text fontSize="3xl" fontWeight="extrabold" color="yellow.400" mt={3}>
            {topCategory.name}
          </Text>
          <Text color="gray.400" mt={2}>
            {topCategory.cantidad} ítems registrados.
          </Text>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6}>
        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={6}>
          <Flex align="center" justify="space-between" mb={4}>
            <HStack gap={3}>
              <Package color="#eab308" size={20} />
              <Box>
                <Text fontWeight="bold" color="white">
                  Inventario por categoría
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Evolución de existencias por área.
                </Text>
              </Box>
            </HStack>
            <Badge colorScheme="yellow" variant="solid">
              Actualizado
            </Badge>
          </Flex>

          {categoryChartData.length === 0 ? (
            <Box py={16} textAlign="center" color="gray.500">
              Aún no hay datos de inventario.
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryChartData} margin={{ left: -20, right: -20, top: 16, bottom: 16 }}>
                <CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 12 }} angle={-20} textAnchor="end" interval={0} height={70} />
                <YAxis stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} />
                <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cat-cell-${index}`} fill={entry.fill || AVAILABLE_COLORS[index % AVAILABLE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <Box mt={6}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="bold" color="white">Tendencia de stock</Text>
              <HStack gap={2}>
                {["7d", "30d", "90d"].map((r) => (
                  <Button key={r} size="xs" variant={range === (r as any) ? "solid" : "outline"} onClick={() => setRange(r as any)}>
                    {r}
                  </Button>
                ))}
              </HStack>
            </Flex>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={trendData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} />
                <Line type="monotone" dataKey="total" stroke="#f6ad55" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={6}>
          <Flex align="center" justify="space-between" mb={4}>
            <HStack gap={3}>
              <Bell color="#eab308" size={20} />
              <Box>
                <Text fontWeight="bold" color="white">
                  Alertas recientes
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Últimas entradas de notificaciones y tareas.
                </Text>
              </Box>
            </HStack>
            <Badge colorScheme={unreadCount > 0 ? "red" : "green"} variant="solid">
              {unreadCount > 0 ? "Pendientes" : "Sin alertas"}
            </Badge>
          </Flex>

          <VStack gap={3} align="stretch">
            {latestNotifications.length === 0 ? (
              <Box p={4} bg="#111" borderRadius="xl">
                <Text color="gray.400">No hay alertas nuevas. El sistema está estable.</Text>
              </Box>
            ) : (
              latestNotifications.map((item) => (
                <Box key={item.id} p={4} bg="#111" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="bold" color="white">
                      {item.title}
                    </Text>
                    <Badge colorScheme={item.type === "error" ? "red" : item.type === "success" ? "green" : "yellow"}>
                      {item.type}
                    </Badge>
                  </Flex>
                  <Text color="gray.300" fontSize="sm">{item.message}</Text>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {new Date(item.createdAt).toLocaleString("es-PE")}
                  </Text>
                </Box>
              ))
            )}
          </VStack>

          <Box mt={4}>
            <Text fontWeight="bold" color="white" mb={2}>Top 5 movimientos</Text>
            <VStack align="stretch" gap={2}>
              {topMovements.map((m) => (
                <Box key={m.name} p={2} bg="#0b0b0c" borderRadius="md" display="flex" justifyContent="space-between">
                  <Text color="gray.200">{m.name}</Text>
                  <Text color="gray.400">{m.cantidad}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          {criticalAlerts.length > 0 && (
            <Box mt={4}>
              <Text fontWeight="bold" color="red.300" mb={2}>Alertas críticas</Text>
              <VStack align="stretch" gap={2}>
                {criticalAlerts.slice(0,3).map((a) => (
                  <Box key={a.id} p={3} bg="#2a0b0b" borderRadius="md">
                    <Text fontWeight="bold" color="red.200">{a.title}</Text>
                    <Text color="gray.300" fontSize="sm">{a.message}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          <Box mt={4} p={4} bg="#0b0b0c" borderRadius="xl">
            <Text fontWeight="bold" color="white" mb={3}>Consejos y resumen de módulos</Text>
            <Flex direction={{ base: "column", md: "row" }} gap={4}>
              <Box flexBasis={{ base: "100%", md: "38%" }} h="140px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChartData} dataKey="cantidad" nameKey="name" innerRadius={28} outerRadius={52} paddingAngle={3}>
                      {categoryChartData.map((entry, idx) => (
                        <Cell key={`pie-${idx}`} fill={entry.fill || AVAILABLE_COLORS[idx % AVAILABLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <VStack align="start" gap={3} flex="1">
                <Box bg="#121216" border="1px solid" borderColor={criticalAlerts.length > 0 ? "red.700" : "yellow.700"} p={3} borderRadius="lg" w="100%">
                  <Text fontWeight="semibold" color={criticalAlerts.length > 0 ? "red.300" : "yellow.300"}>{securitySummary.title}</Text>
                  <Text color="gray.300" fontSize="sm" mt={1}>{securitySummary.message}</Text>
                </Box>

                <Box>
                  <Text fontWeight="semibold" color="yellow.300">Consejos EPP</Text>
                  <Box as="ul" ml={4} color="gray.300" pl={3}>
                    <Box as="li">Revisa los EPP faltantes reportados en la inspección.</Box>
                    <Box as="li">Verifica operadores que no coincidan con el registro fotográfico.</Box>
                    <Box as="li">Reporta equipos dañados y no los uses.</Box>
                  </Box>
                </Box>

                <Box>
                  <Text fontWeight="semibold" color="yellow.300">Consejos de conducción</Text>
                  <Box as="ul" ml={4} color="gray.300" pl={3}>
                    <Box as="li">Mantén distancia y respeta límites de velocidad.</Box>
                    <Box as="li">Realiza inspecciones diarias de vehículo.</Box>
                    <Box as="li">Evita distracciones y maniobras bruscas.</Box>
                  </Box>
                </Box>

                <HStack gap={2} pt={1}>
                  <NextLink href="/dashboard/seguridad-epp" passHref>
                    <Button size="sm" colorScheme="yellow">
                      <Box as="span" mr={2}><Plus size={14} /></Box>
                      Ver EPP
                    </Button>
                  </NextLink>
                  <NextLink href="/dashboard/vehiculos" passHref>
                    <Button size="sm" variant="outline">
                      Flota
                    </Button>
                  </NextLink>
                </HStack>
              </VStack>
            </Flex>
          </Box>

          <Box my={5} h="1px" bg="whiteAlpha.200" />

          <Flex direction="column" gap={3}>
            <Text fontSize="sm" color="gray.400" fontWeight="bold">
              Acciones rápidas
            </Text>
            
            <NextLink href="/dashboard/stock" passHref>
              <Button size="sm" colorScheme="yellow" variant="solid">
                Ver stock
                <Box as="span" ml={2}><ArrowRight size={16} /></Box>
              </Button>
            </NextLink>
            <NextLink href="/dashboard/procura" passHref>
              <Button size="sm" colorScheme="gray" variant="outline">
                Ir a Procura
              </Button>
            </NextLink>
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
}
