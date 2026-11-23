"use client";

import NextLink from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  Boxes,
  ClipboardCheck,
  FileStack,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { Badge, Box, Button, Flex, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { useNotifications } from "@/context/NotificationContext";
import { hasModuleAccess, type ModulePermission } from "@/lib/permissions";
import type { DashboardModuleData } from "@/lib/dashboard-module-data";

interface CategoryRead {
  id: number;
  name: string;
  color_hex: string;
  icon: string;
}

interface ResumenItem {
  id?: string;
  name: string;
  cantidad: number;
  category?: string;
  fill?: string;
}

interface ResumenData {
  items?: ResumenItem[];
}

interface DashboardOverviewClientProps {
  username: string;
  userLevel?: number;
  userPermissions?: string[] | null;
  categories: CategoryRead[];
  resumen: ResumenData;
  errorMessage?: string | null;
  moduleData: DashboardModuleData;
}

const COLORS = ["#facc15", "#38bdf8", "#34d399", "#fb923c", "#c084fc", "#f472b6"];
const LOW_STOCK_THRESHOLD = 5;

function normalizeColor(color: string | undefined, index: number) {
  return color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
    ? color
    : COLORS[index % COLORS.length];
}

const quickLinks: Array<{
  label: string;
  description: string;
  href: string;
  permission: ModulePermission;
  icon: typeof Package;
}> = [
  { label: "Inventario", description: "Productos y existencias", href: "/dashboard/stock", permission: "stock", icon: Package },
  { label: "Procura", description: "Solicitudes y compras", href: "/dashboard/procura", permission: "procura", icon: ShoppingCart },
  { label: "Calidad", description: "Hallazgos y acciones", href: "/dashboard/calidad", permission: "calidad", icon: ClipboardCheck },
  { label: "CAD y planos", description: "Dibujos y archivos técnicos", href: "/dashboard/cad", permission: "cad", icon: FileStack },
  { label: "Vehículos", description: "Estado y registros de flota", href: "/dashboard/vehiculos", permission: "vehiculos", icon: Truck },
];

export function DashboardOverviewClient({
  username,
  userLevel,
  userPermissions,
  categories,
  resumen,
  errorMessage,
  moduleData,
}: DashboardOverviewClientProps) {
  const { unreadCount } = useNotifications();
  const safeCategories = useMemo(() => Array.isArray(categories) ? categories : [], [categories]);
  const inventoryItems = useMemo(
    () => Array.isArray(resumen?.items) ? resumen.items : [],
    [resumen],
  );

  const totalUnits = inventoryItems.reduce(
    (sum, item) => sum + Math.max(0, Number(item.cantidad) || 0),
    0,
  );
  const lowStockItems = useMemo(
    () => inventoryItems
      .filter((item) => Number(item.cantidad) <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => Number(a.cantidad) - Number(b.cantidad)),
    [inventoryItems],
  );
  const outOfStockCount = lowStockItems.filter((item) => Number(item.cantidad) <= 0).length;
  const stockStatus = useMemo(() => {
    let available = 0;
    let low = 0;
    let out = 0;

    inventoryItems.forEach((item) => {
      const quantity = Number(item.cantidad);
      if (!Number.isFinite(quantity)) return;
      if (quantity <= 0) out += 1;
      else if (quantity <= LOW_STOCK_THRESHOLD) low += 1;
      else available += 1;
    });

    return [
      { name: "Disponible", productos: available, fill: "#34d399" },
      { name: "Stock bajo", productos: low, fill: "#fb923c" },
      { name: "Agotado", productos: out, fill: "#f87171" },
    ];
  }, [inventoryItems]);
  const topStockItems = useMemo(
    () => inventoryItems
      .map((item) => ({ ...item, cantidad: Math.max(0, Number(item.cantidad) || 0) }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6),
    [inventoryItems],
  );

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, { name: string; cantidad: number; fill?: string }>();
    inventoryItems.forEach((item) => {
      const name = item.category?.trim() || "Sin categoría";
      const existing = totals.get(name);
      if (existing) {
        existing.cantidad += Math.max(0, Number(item.cantidad) || 0);
      } else {
        totals.set(name, {
          name,
          cantidad: Math.max(0, Number(item.cantidad) || 0),
          fill: item.fill,
        });
      }
    });

    return [...totals.values()]
      .sort((a, b) => b.cantidad - a.cantidad)
      .map((item, index) => ({ ...item, fill: normalizeColor(item.fill, index) }));
  }, [inventoryItems]);
  const visibleCategoryTotals = categoryTotals.slice(0, 6);

  const visibleQuickLinks = userLevel === undefined
    ? []
    : quickLinks.filter(({ permission }) => hasModuleAccess(userLevel, userPermissions, permission));
  const inventoryHasError = Boolean(errorMessage);

  const metrics = [
    {
      label: "Unidades disponibles",
      value: totalUnits,
      detail: "Suma de existencias registradas",
      color: "yellow.300",
      icon: Boxes,
    },
    {
      label: "Productos",
      value: inventoryItems.length,
      detail: "Productos en el inventario",
      color: "cyan.300",
      icon: Package,
    },
    {
      label: "Categorías",
      value: safeCategories.length,
      detail: "Categorías registradas",
      color: "green.300",
      icon: FileStack,
    },
    {
      label: "Stock bajo",
      value: lowStockItems.length,
      detail: `${outOfStockCount} agotados · máximo ${LOW_STOCK_THRESHOLD} unidades`,
      color: lowStockItems.length > 0 ? "orange.300" : "green.300",
      icon: ArrowDownToLine,
    },
    {
      label: "Alertas sin leer",
      value: unreadCount,
      detail: unreadCount > 0 ? "Requieren tu atención" : "No tienes alertas pendientes",
      color: unreadCount > 0 ? "red.300" : "green.300",
      icon: Bell,
    },
  ];

  return (
    <Box
      p={{ base: 4, md: 6, xl: 8 }}
      minH="100vh"
      color="var(--soland-text-primary)"
      backgroundColor="var(--soland-surface-08080a)"
      backgroundImage="var(--soland-dashboard-image-overlay)"
      backgroundPosition="center top"
      backgroundSize="cover"
      backgroundRepeat="no-repeat"
      backgroundAttachment="fixed"
      overflowX="hidden"
    >
      <Box maxW="1600px" mx="auto">
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} mb={6} direction={{ base: "column", md: "row" }}>
          <Box>
            <HStack gap={2} mb={1}>
              <Text fontSize="xs" fontWeight="bold" letterSpacing="0.12em" color="yellow.300" textTransform="uppercase">
                Panel general
              </Text>
              <Badge colorPalette={inventoryHasError ? "red" : "green"} variant="subtle">
                {inventoryHasError ? "Inventario sin conexión" : "Vista actual"}
              </Badge>
            </HStack>
            <Text as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" lineHeight="1.15">
              Resumen de operaciones
            </Text>
            <Text color="gray.400" fontSize="sm" mt={1}>
              Hola, {username}. Revisa existencias y niveles de stock en un solo lugar.
            </Text>
          </Box>
        </Flex>

        {errorMessage && (
          <Flex gap={3} align="flex-start" mb={5} p={4} bg="red.950" border="1px solid" borderColor="red.800" borderRadius="xl">
            <AlertTriangle size={18} color="#fca5a5" />
            <Box>
              <Text fontWeight="bold" color="red.200">No se pudo actualizar el inventario</Text>
              <Text color="red.200" fontSize="sm" mt={1}>{errorMessage}</Text>
            </Box>
          </Flex>
        )}

        <Grid
          templateColumns={{ base: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" }}
          gap={{ base: 2, md: 3 }}
          mb={5}
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Flex
                key={metric.label}
                minW={0}
                align="center"
                gap={3}
                p={{ base: 3, md: 4 }}
                bg="var(--soland-surface-18181b)"
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="xl"
                boxShadow="0 8px 24px rgba(0,0,0,0.12)"
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize={{ base: "36px", md: "42px" }}
                  flexShrink={0}
                  bg="whiteAlpha.100"
                  borderRadius="lg"
                  color={metric.color}
                >
                  <Icon size={19} />
                </Flex>
                <Box minW={0}>
                  <Text fontSize="xs" color="gray.400" fontWeight="semibold" textTransform="uppercase" lineClamp={1}>
                    {metric.label}
                  </Text>
                  <Text fontSize={{ base: "xl", md: "2xl" }} lineHeight="1.1" fontWeight="extrabold" color={metric.color} mt={1}>
                    {metric.value.toLocaleString("es-VE")}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1} lineClamp={1}>
                    {metric.detail}
                  </Text>
                </Box>
              </Flex>
            );
          })}
        </Grid>

        <Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1.4fr) minmax(320px, 1fr)" }} gap={4} mb={4} alignItems="stretch">
          <Box p={{ base: 4, md: 5 }} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl">
            <Flex align="center" justify="space-between" gap={3} mb={4}>
              <Box>
                <Text fontSize="lg" fontWeight="bold">Existencias por categoría</Text>
                <Text color="gray.400" fontSize="sm">Principales categorías por unidades registradas.</Text>
              </Box>
              <Package size={20} color="var(--soland-accent-text)" />
            </Flex>
            {categoryTotals.length === 0 || totalUnits === 0 ? (
              <Flex minH="220px" align="center" justify="center" direction="column" gap={2} textAlign="center">
                <Boxes size={28} color="#718096" />
                <Text color="gray.300" fontWeight="semibold">Todavía no hay existencias para mostrar</Text>
                <Text color="gray.500" fontSize="sm">Cuando registres productos, aquí verás la distribución por categoría.</Text>
                <NextLink href="/dashboard/stock" passHref>
                  <Button mt={2} size="sm" variant="outline" color="yellow.300">
                    Abrir inventario <ArrowRight size={15} />
                  </Button>
                </NextLink>
              </Flex>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(140, visibleCategoryTotals.length * 34 + 34)}>
                <BarChart data={visibleCategoryTotals} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="var(--soland-chart-grid)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="var(--soland-chart-label)" tick={{ fill: "var(--soland-chart-label)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} stroke="var(--soland-chart-label)" tick={{ fill: "var(--soland-chart-label)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("es-VE")} unidades`, "Existencias"]}
                    contentStyle={{ backgroundColor: "var(--soland-surface-0f0f10)", borderColor: "#4a5568", borderRadius: "10px" }}
                  />
                  <Bar dataKey="cantidad" name="Existencias" barSize={22} radius={[0, 6, 6, 0]} isAnimationActive={false}>
                    {visibleCategoryTotals.map((item, index) => (
                      <Cell key={item.name} fill={normalizeColor(item.fill, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>

          <Box p={{ base: 4, md: 5 }} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl">
            <Flex align="center" justify="space-between" gap={3} mb={4}>
              <Box>
                <Text fontSize="lg" fontWeight="bold">Productos por reponer</Text>
                <Text color="gray.400" fontSize="sm">Existencia igual o menor a {LOW_STOCK_THRESHOLD} unidades.</Text>
              </Box>
              <Badge colorPalette={lowStockItems.length > 0 ? "orange" : "green"} variant="subtle">
                {lowStockItems.length} productos
              </Badge>
            </Flex>
            {inventoryHasError ? (
              <Text color="gray.400" fontSize="sm" py={6}>No se pudo consultar el estado del stock.</Text>
            ) : lowStockItems.length === 0 ? (
              <Flex minH="180px" align="center" justify="center" direction="column" gap={2} textAlign="center">
                <Package size={28} color="#4ade80" />
                <Text color="gray.300" fontWeight="semibold">No hay productos por reponer</Text>
                <Text color="gray.500" fontSize="sm">Los productos con 5 unidades o menos aparecerán aquí.</Text>
              </Flex>
            ) : (
              <VStack align="stretch" gap={2}>
                {lowStockItems.slice(0, 6).map((item) => {
                  const quantity = Math.max(0, Number(item.cantidad) || 0);
                  return (
                    <Flex key={item.id ?? `${item.category}-${item.name}`} justify="space-between" align="center" gap={3} p={3} bg="var(--soland-surface-111114)" borderRadius="lg">
                      <Box minW={0}>
                        <Text color="gray.100" fontWeight="semibold" fontSize="sm" lineClamp={1}>{item.name}</Text>
                        <Text color="gray.500" fontSize="xs" mt={1}>{item.category || "Sin categoría"}</Text>
                      </Box>
                      <Badge flexShrink={0} colorPalette={quantity === 0 ? "red" : "orange"} variant="subtle">
                        {quantity === 0 ? "Agotado" : `${quantity} uds.`}
                      </Badge>
                    </Flex>
                  );
                })}
                <NextLink href="/dashboard/stock" passHref>
                  <Button mt={1} size="sm" variant="ghost" color="yellow.300" w="full">
                    Revisar inventario <ArrowRight size={15} />
                  </Button>
                </NextLink>
              </VStack>
            )}
          </Box>
        </Grid>

        <Box p={{ base: 4, md: 5 }} mb={4} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl">
          <Flex align="center" justify="space-between" gap={3} mb={4}>
            <Box>
              <Text fontSize="lg" fontWeight="bold">Registros por módulo</Text>
              <Text color="gray.400" fontSize="sm">Conteo real de registros guardados en los módulos disponibles para tu perfil.</Text>
            </Box>
            <Badge colorPalette="cyan" variant="subtle">{moduleData.modules.length} módulos</Badge>
          </Flex>
          {moduleData.modules.length === 0 ? (
            <Flex minH="180px" align="center" justify="center" textAlign="center">
              <Text color="gray.400" fontSize="sm">No hay datos de módulos disponibles.</Text>
            </Flex>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={moduleData.modules} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid stroke="var(--soland-chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={64}
                  stroke="var(--soland-chart-label)"
                  tick={{ fill: "var(--soland-chart-label)", fontSize: 10 }}
                  tickFormatter={(value: string) => ({
                    "Hoja de tiempo": "Tiempo",
                    "Inspecciones": "Inspección",
                    "Documentos": "Docs.",
                    "Administración": "Admin.",
                    "Chat interno": "Chat",
                  }[value] ?? value)}
                />
                <YAxis type="number" allowDecimals={false} width={38} stroke="var(--soland-chart-label)" tick={{ fill: "var(--soland-chart-label)", fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString("es-VE")} registros`, "Total"]}
                  contentStyle={{ backgroundColor: "var(--soland-surface-0f0f10)", borderColor: "#4a5568", borderRadius: "10px" }}
                />
                <Bar dataKey="count" name="Registros" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {moduleData.modules.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {moduleData.errors.length > 0 && (
            <Text color="orange.200" fontSize="xs" mt={3}>
              No se pudieron consultar: {moduleData.errors.join(", ")}.
            </Text>
          )}
        </Box>

        <Grid templateColumns={{ base: "1fr", xl: "repeat(3, minmax(0, 1fr))" }} gap={4} alignItems="stretch">
          <Box p={{ base: 4, md: 5 }} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl">
            <Flex align="center" justify="space-between" gap={3} mb={4}>
              <Box>
                <Text fontSize="lg" fontWeight="bold">Estado del inventario</Text>
                <Text color="gray.400" fontSize="sm">Cantidad de productos por nivel de existencia.</Text>
              </Box>
              <Boxes size={20} color="var(--soland-accent-text)" />
            </Flex>
            {inventoryHasError ? (
              <Flex minH="220px" align="center" justify="center" textAlign="center">
                <Text color="gray.400" fontSize="sm">No se pudo consultar el estado del inventario.</Text>
              </Flex>
            ) : inventoryItems.length === 0 ? (
              <Flex minH="220px" align="center" justify="center" direction="column" gap={2} textAlign="center">
                <Boxes size={28} color="#718096" />
                <Text color="gray.300" fontWeight="semibold">Todavía no hay productos para mostrar</Text>
                <Text color="gray.500" fontSize="sm">Al registrar productos, aquí verás su estado de stock.</Text>
              </Flex>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stockStatus} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="var(--soland-chart-grid)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="var(--soland-chart-label)" tick={{ fill: "var(--soland-chart-label)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={95} stroke="var(--soland-chart-label)" tick={{ fill: "var(--soland-chart-label)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("es-VE")} productos`, "Cantidad"]}
                    contentStyle={{ backgroundColor: "var(--soland-surface-0f0f10)", borderColor: "#4a5568", borderRadius: "10px" }}
                  />
                  <Bar dataKey="productos" name="Productos" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                    {stockStatus.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>

          <Box p={{ base: 4, md: 5 }} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl">
            <Flex align="center" justify="space-between" gap={3} mb={4}>
              <Box>
                <Text fontSize="lg" fontWeight="bold">Productos con más existencias</Text>
                <Text color="gray.400" fontSize="sm">Unidades registradas por producto.</Text>
              </Box>
              <Package size={20} color="var(--soland-accent-text)" />
            </Flex>
            {inventoryHasError ? (
              <Flex minH="240px" align="center" justify="center" textAlign="center">
                <Text color="gray.400" fontSize="sm">No se pudo consultar el inventario.</Text>
              </Flex>
            ) : topStockItems.length === 0 ? (
              <Flex minH="240px" align="center" justify="center" direction="column" gap={2} textAlign="center">
                <Package size={28} color="#718096" />
                <Text color="gray.300" fontWeight="semibold">Todavía no hay productos para mostrar</Text>
              </Flex>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topStockItems} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke="var(--soland-chart-grid)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="var(--soland-chart-label)" tick={{ fill: "var(--soland-chart-label)", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={125}
                    stroke="var(--soland-chart-label)"
                    tick={{ fill: "var(--soland-chart-label)", fontSize: 11 }}
                    tickFormatter={(value: string) => value.length > 18 ? `${value.slice(0, 18)}…` : value}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("es-VE")} unidades`, "Existencias"]}
                    contentStyle={{ backgroundColor: "var(--soland-surface-0f0f10)", borderColor: "#4a5568", borderRadius: "10px" }}
                  />
                  <Bar dataKey="cantidad" name="Existencias" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                    {topStockItems.map((item, index) => (
                      <Cell key={item.id ?? item.name} fill={normalizeColor(item.fill, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>

          {visibleQuickLinks.length > 0 && (
            <Box p={{ base: 4, md: 5 }} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl">
              <Text fontSize="lg" fontWeight="bold">Accesos rápidos</Text>
              <Text color="gray.400" fontSize="sm" mt={1} mb={4}>Ve directamente a un módulo.</Text>
              <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap={2}>
                {visibleQuickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NextLink key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                      <Flex align="center" gap={3} p={3} h="full" bg="var(--soland-surface-111114)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="lg" _hover={{ borderColor: "yellow.500", bg: "whiteAlpha.100" }}>
                        <Box color="yellow.300"><Icon size={18} /></Box>
                        <Box minW={0}>
                          <Text fontWeight="semibold" fontSize="sm">{link.label}</Text>
                          <Text color="gray.500" fontSize="xs" lineClamp={1}>{link.description}</Text>
                        </Box>
                      </Flex>
                    </NextLink>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
