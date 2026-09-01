"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
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
  AreaChart,
  Area,
} from "recharts";
import { PieChart, Pie } from "recharts";
import { Activity, ArrowRight, Bell, Package, Plus, ShieldCheck, Truck, TriangleAlert, Boxes, ClipboardCheck } from "lucide-react";
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
const RANGE_OPTIONS: Array<"7d" | "30d" | "90d"> = ["7d", "30d", "90d"];

function normalizeColor(val?: string): string {
  if (!val) return "#6b46c1";
  const v = val.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  return v;
}

export function DashboardOverviewClient({ username, level, categories, resumen, errorMessage }: DashboardOverviewClientProps) {
  const { notifications, unreadCount } = useNotifications();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState("Cargando...");

  useEffect(() => {
    setMounted(true);
    setCurrentDate(
      new Intl.DateTimeFormat("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const safeResumenItems = useMemo(() => (Array.isArray(resumen?.items) ? resumen.items : []), [resumen]);
  const hasInventoryData = safeCategories.length > 0 || safeResumenItems.length > 0;

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

  const isDemoInventory = categoryChartData.length === 0;
  const populatedCategoryChartData = useMemo(
    () => isDemoInventory
      ? [
          { name: "Protección personal", cantidad: 68, fill: "#eab308" },
          { name: "Señalización", cantidad: 42, fill: "#38b2ac" },
          { name: "Herramientas", cantidad: 31, fill: "#63b3ed" },
          { name: "Emergencia", cantidad: 18, fill: "#f97316" },
          { name: "Bloqueo", cantidad: 25, fill: "#d53f8c" },
        ]
      : categoryChartData,
    [categoryChartData, isDemoInventory]
  );

  const latestNotifications = notifications.slice(0, 3);

  // Low stock calculation (threshold configurable)
  const LOW_STOCK_THRESHOLD = 5;
  const lowStockItems = useMemo(() => {
    const source = safeResumenItems.length > 0 ? safeResumenItems : safeCategories.map((c) => ({ name: c.name, cantidad: c.cantidad || 0 }));
    return source.filter((it) => (it.cantidad || 0) > 0 && (it.cantidad || 0) <= LOW_STOCK_THRESHOLD);
  }, [safeCategories, safeResumenItems]);
  const lowStockCount = lowStockItems.length || (isDemoInventory ? 3 : 0);

  // Top movements (by cantidad)
  const topMovements = useMemo(() => {
    const source = safeCategories.map((c) => ({ name: c.name, cantidad: c.cantidad || 0 }));
    const sorted = source.sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0)).slice(0, 5);
    return sorted.length > 0 ? sorted : populatedCategoryChartData.slice(0, 5);
  }, [populatedCategoryChartData, safeCategories]);

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
    const base = totalItems || 184;
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

  const safetyTrendData = [
    { label: "Lun", inspecciones: 18, hallazgos: 3 },
    { label: "Mar", inspecciones: 24, hallazgos: 5 },
    { label: "Mié", inspecciones: 21, hallazgos: 2 },
    { label: "Jue", inspecciones: 29, hallazgos: 4 },
    { label: "Vie", inspecciones: 34, hallazgos: 1 },
    { label: "Sáb", inspecciones: 16, hallazgos: 2 },
    { label: "Hoy", inspecciones: 27, hallazgos: 1 },
  ];

  const safetyImages = [
    { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=85", title: "Inspección facial", status: "Verificado" },
    { src: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=900&q=85", title: "Control de EPP", status: "Revisión" },
    { src: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85", title: "Registro de campo", status: "Aprobado" },
  ];

  const operationalUpdates = [
    { time: "08:40", title: "Inspección de EPP completada", detail: "Planta de drenaje · 12 operadores", color: "green.300" },
    { time: "10:15", title: "Reposición solicitada", detail: "Guantes anticorte · 18 unidades", color: "orange.300" },
    { time: "11:30", title: "Vehículo habilitado", detail: "Unidad FL-204 · Inspección aprobada", color: "cyan.300" },
    { time: "13:05", title: "Permiso validado", detail: "Trabajo en caliente · Área norte", color: "yellow.300" },
  ];

  const documentSecurityData = [
    { name: "ART", revisados: 24, pendientes: 4 },
    { name: "VIT", revisados: 18, pendientes: 3 },
    { name: "EPP", revisados: 31, pendientes: 2 },
  ];

  return (
    <Box p={{ base: 4, md: 8 }} bg="#08080a" minH="100vh" color="white" overflowX="hidden">
      {errorMessage && !hasInventoryData && (
        <Box mb={6} p={4} bg="red.950" border="1px solid" borderColor="red.700" borderRadius="xl">
          <Text fontWeight="bold" color="red.200">
            No se pudo cargar el resumen del inventario
          </Text>
          <Text color="red.100" mt={1}>
            {errorMessage}
          </Text>
        </Box>
      )}

      <Box mb={8} p={{ base: 5, md: 7 }} borderRadius="2xl" border="1px solid" borderColor="yellow.400" bg="linear-gradient(115deg, #17181b 0%, #111315 58%, #24200d 100%)" position="relative" overflow="hidden">
        <Box position="absolute" right="-70px" top="-90px" w="240px" h="240px" borderRadius="full" border="1px solid" borderColor="yellow.400" opacity={0.12} />
        <Flex direction={{ base: "column", lg: "row" }} justify="space-between" align={{ base: "start", lg: "center" }} gap={6} position="relative">
          <VStack align="start" gap={3}>
            <Badge colorScheme="yellow" variant="subtle">Panel operativo · {roleLabel}</Badge>
            <Heading as="h1" size={{ base: "lg", md: "xl" }} color="yellow.300">
              Bienvenido de vuelta, {username}
            </Heading>
            <HStack gap={3} wrap="wrap">
              <Text color="yellow.100" fontSize="sm" textTransform="capitalize">{currentDate}</Text>
              <Text color="gray.500">·</Text>
              <Text color="gray.300" fontSize="sm">Resumen en tiempo real</Text>
            </HStack>
            <Text color="gray.300" fontSize="md" maxW="3xl">
              Monitorea stock, alertas y continuidad operativa desde un solo lugar.
            </Text>
          </VStack>
          <HStack gap={3} flexWrap="wrap">
            <NextLink href="/dashboard/stock">
              <Button size="sm" bg="yellow.400" color="black" _hover={{ bg: "yellow.300", transform: "translateY(-2px)" }} transition="all 160ms ease">
                <HStack gap={2}><Boxes size={16} /><Text>Ver inventario</Text><ArrowRight size={15} /></HStack>
              </Button>
            </NextLink>
            <NextLink href="/dashboard/inspeccion">
              <Button size="sm" variant="outline" color="white" borderColor="whiteAlpha.300" _hover={{ bg: "whiteAlpha.100", transform: "translateY(-2px)" }} transition="all 160ms ease">
                <HStack gap={2}><ClipboardCheck size={16} /><Text>Inspecciones</Text></HStack>
              </Button>
            </NextLink>
          </HStack>
        </Flex>
      </Box>

      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", "2xl": "repeat(4, 1fr)" }} gap={4} mb={8} css={{ "& > *": { animation: "dashboardCardIn 420ms ease both", transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease", "&:hover": { transform: "translateY(-4px)", borderColor: "rgba(250, 204, 21, 0.45)", boxShadow: "0 12px 28px rgba(0,0,0,0.24)" } }, "@keyframes dashboardCardIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } } }}>
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
            Stock bajo
          </Text>
          <Text fontSize="3xl" fontWeight="extrabold" color={lowStockCount > 0 ? "orange.300" : "green.300"} mt={3}>
            {lowStockCount}
          </Text>
          <Text color="gray.400" mt={2}>
            {isDemoInventory ? "Alertas simuladas de reposición." : "Categorías que requieren reposición."}
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
            {isDemoInventory ? "Protección personal" : topCategory.name}
          </Text>
          <Text color="gray.400" mt={2}>
            {isDemoInventory ? "68 ítems en demostración." : `${topCategory.cantidad} ítems registrados.`}
          </Text>
        </Box>

        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
            Inspecciones semanales
          </Text>
          <Text fontSize="3xl" fontWeight="extrabold" color="cyan.300" mt={3}>169</Text>
          <Flex align="center" gap={2} mt={2} color="green.300" fontSize="sm">
            <Activity size={15} /> <Text>+12% frente a la semana anterior</Text>
          </Flex>
        </Box>

        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase">
            Cumplimiento EPP
          </Text>
          <Text fontSize="3xl" fontWeight="extrabold" color="green.300" mt={3}>94%</Text>
          <Flex align="center" gap={2} mt={2} color="gray.400" fontSize="sm">
            <ShieldCheck size={15} /> <Text>Meta operativa: 90%</Text>
          </Flex>
        </Box>
      </Grid>

      <Box mb={6} px={1}>
        <Flex align="center" justify="space-between" mb={3}>
          <Box>
            <Text fontWeight="bold" color="white">Pulso operativo</Text>
            <Text fontSize="sm" color="gray.400">Indicadores de seguridad y continuidad de la operación.</Text>
          </Box>
          <Badge colorScheme={isDemoInventory ? "orange" : "green"} variant="subtle">
            {isDemoInventory ? "Datos de demostración" : "Datos en vivo"}
          </Badge>
        </Flex>
        <Grid templateColumns={{ base: "1fr", lg: "1.4fr 1fr" }} gap={6}>
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="semibold" color="white">Inspecciones y hallazgos</Text>
              <Text fontSize="xs" color="gray.500">Últimos 7 días</Text>
            </Flex>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={safetyTrendData}>
                <defs>
                  <linearGradient id="inspectionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} />
                <Legend />
                <Area type="monotone" dataKey="inspecciones" stroke="#22d3ee" fill="url(#inspectionFill)" strokeWidth={2} />
                <Line type="monotone" dataKey="hallazgos" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={5}>
            <Text fontWeight="semibold" color="white" mb={4}>Estado de la operación</Text>
            <VStack align="stretch" gap={4}>
              <Flex justify="space-between" align="center"><HStack gap={3}><ShieldCheck size={18} color="#4ade80" /><Text color="gray.300">EPP verificado</Text></HStack><Text color="green.300" fontWeight="bold">94%</Text></Flex>
              <Flex justify="space-between" align="center"><HStack gap={3}><Truck size={18} color="#60a5fa" /><Text color="gray.300">Vehículos operativos</Text></HStack><Text color="cyan.300" fontWeight="bold">18 / 20</Text></Flex>
              <Flex justify="space-between" align="center"><HStack gap={3}><TriangleAlert size={18} color="#facc15" /><Text color="gray.300">Pendientes de revisión</Text></HStack><Text color="yellow.300" fontWeight="bold">06</Text></Flex>
            </VStack>
          </Box>
        </Grid>
        <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap={4} mt={4}>
          {safetyImages.map((image) => (
            <Box key={image.src} bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" overflow="hidden">
              <Image src={image.src} alt={image.title} w="100%" h="128px" objectFit="cover" bg="#0f0f10" />
              <Flex justify="space-between" align="center" p={3}>
                <Text fontSize="sm" color="gray.200" fontWeight="semibold">{image.title}</Text>
                <Badge colorScheme={image.status === "Revisión" ? "yellow" : "green"} variant="subtle">{image.status}</Badge>
              </Flex>
            </Box>
          ))}
        </Grid>
      </Box>

      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6} alignItems={{ base: "stretch", xl: "start" }}>
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

          {(
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={populatedCategoryChartData} margin={{ left: -20, right: -20, top: 16, bottom: 16 }}>
                <CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 12 }} angle={-20} textAnchor="end" interval={0} height={70} />
                <YAxis stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} />
                <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {populatedCategoryChartData.map((entry, index) => (
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
                {RANGE_OPTIONS.map((r) => (
                  <Button key={r} size="xs" variant={range === r ? "solid" : "outline"} onClick={() => setRange(r)}>
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

          <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap={3} mt={5}>
            <Box bg="#111114" borderRadius="lg" p={3}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Disponible</Text>
              <Text color="green.300" fontWeight="bold" mt={1}>{isDemoInventory ? "184" : totalItems} ítems</Text>
            </Box>
            <Box bg="#111114" borderRadius="lg" p={3}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Por reponer</Text>
              <Text color="orange.300" fontWeight="bold" mt={1}>{lowStockCount} categorías</Text>
            </Box>
            <Box bg="#111114" borderRadius="lg" p={3}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">Cobertura</Text>
              <Text color="cyan.300" fontWeight="bold" mt={1}>21 días</Text>
            </Box>
          </Grid>

          <Box mt={6} pt={5} borderTop="1px solid" borderColor="whiteAlpha.100">
            <Flex justify="space-between" align="center" mb={4}>
              <Box>
                <Text fontWeight="bold" color="white">Actividad de la jornada</Text>
                <Text color="gray.500" fontSize="sm">Eventos registrados durante el turno actual.</Text>
              </Box>
              <Badge colorScheme="cyan" variant="subtle">En seguimiento</Badge>
            </Flex>
            <Grid templateColumns={{ base: "1fr", md: "1.2fr 1fr" }} gap={4}>
              <VStack align="stretch" gap={2}>
                {operationalUpdates.slice(0, 3).map((update) => (
                  <Flex key={update.time} gap={3} align="start" p={3} bg="#111114" borderRadius="lg">
                    <Text color={update.color} fontWeight="bold" fontSize="sm" minW="44px">{update.time}</Text>
                    <Box>
                      <Text color="gray.200" fontWeight="semibold" fontSize="sm">{update.title}</Text>
                      <Text color="gray.500" fontSize="xs" mt={1}>{update.detail}</Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
              <Box bg="#111114" borderRadius="lg" p={4}>
                <Text color="gray.400" fontSize="xs" textTransform="uppercase" fontWeight="bold">Avance diario</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold" mt={2}>27 / 32</Text>
                <Box mt={3} h="8px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
                  <Box h="100%" w="84%" bg="cyan.400" borderRadius="full" />
                </Box>
                <Text color="gray.500" fontSize="xs" mt={2}>84% de inspecciones completadas</Text>
              </Box>
            </Grid>

            <Box mt={4} bg="#111114" borderRadius="lg" p={4}>
              <Flex justify="space-between" align="center" mb={3}>
                <Box>
                  <Text color="white" fontWeight="semibold">Control documental de seguridad</Text>
                  <Text color="gray.500" fontSize="xs" mt={1}>ART, VIT y validaciones EPP del turno</Text>
                </Box>
                <Badge colorScheme="yellow" variant="subtle">63 revisados</Badge>
              </Flex>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={documentSecurityData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} />
                  <Legend />
                  <Bar dataKey="revisados" name="Revisados" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendientes" name="Pendientes" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
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
                    <Pie data={populatedCategoryChartData} dataKey="cantidad" nameKey="name" innerRadius={28} outerRadius={52} paddingAngle={3}>
                      {populatedCategoryChartData.map((entry, idx) => (
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
