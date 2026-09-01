"use client";
import Link from "next/link";
import { useActionState } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Button,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import {
  Wrench,
  HelpCircle,
  Shirt,
  Package,
  Eye,
  Monitor,
  BarChart2,
  PieChart,
  ShieldAlert,
  Car,
  ClipboardCheck,
  Settings,
  LucideIcon,
  Trash2,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
} from "@/components/ui/dialog";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/actions/inventario";

const iconMap: Record<string, LucideIcon> = {
  wrench: Wrench,
  help: HelpCircle,
  shirt: Shirt,
  box: Package,
  package: Package,
  eye: Eye,
  monitor: Monitor,
  shield: ShieldAlert,
  car: Car,
  clipboard: ClipboardCheck,
  settings: Settings,
};

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
  color?: string;
}

interface ResumenData {
  items?: ResumenItem[];
}

// 1. Agregamos el permiso a las Props
interface StockClientProps {
  categorias: CategoryRead[];
  resumen: ResumenData;
  canCreateCategory: boolean;
}

export function StockClient({
  categorias,
  resumen,
  canCreateCategory,
}: StockClientProps) {
  const [state, formAction, isPending] = useActionState(
    createCategoryAction,
    null,
  );
  // Prefer counts from resumen.items when available (backend resumen wins)
  const resumenItems = (resumen?.items || []).map((entry: any) => ({
    name: entry.name,
    cantidad: Number(entry.cantidad || 0),
    fill: normalizeColor(entry.fill || entry.color || "#3b82f6"),
  }));

  // Normalize color values to ensure valid hex when possible
  function normalizeColor(val?: string) {
    if (!val) return "#3b82f6";
    const v = val.trim();
    // already a hex with # or rgb/hsl, return as-is
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || /^rgb\(/i.test(v) || /^hsl\(/i.test(v)) return v;
    // plain 6-hex without #
    if (/^[0-9a-f]{6}$/i.test(v)) return `#${v}`;
    // plain 3-hex without #
    if (/^[0-9a-f]{3}$/i.test(v)) return `#${v}`;
    // otherwise return as-is
    return v;
  }

  const totalItems = resumenItems.length
    ? resumenItems.reduce((acc, it) => acc + (it.cantidad || 0), 0)
    : categorias.reduce((acc, cat) => acc + (cat.cantidad || 0), 0);

  const chartDataItems = resumenItems;

  // For categories, merge resumen counts into category list so charts and cards are consistent
  // Build a consistent color map per category (use category color_hex when available)
  const colorMap: Record<string, string> = {};
  categorias.forEach((cat, i) => {
    const raw = cat.color_hex;
    colorMap[cat.name] = normalizeColor(raw || `hsl(${(i * 60) % 360} 70% 50%)`);
  });

  const chartDataCategorias = categorias.map((cat, i) => {
    const match = resumenItems.find((r) => r.name === cat.name);
    return {
      name: cat.name,
      cantidad: match ? match.cantidad : (cat.cantidad || 0),
      fill: colorMap[cat.name] || normalizeColor(match ? match.fill : "#cbd5e1"),
    };
  });

  const maxCategoria = chartDataCategorias.length ? Math.max(...chartDataCategorias.map((c) => c.cantidad || 0)) : 0;
  const maxItem = chartDataItems.length ? Math.max(...chartDataItems.map((c) => c.cantidad || 0)) : 0;

  return (
    <Box p={6} bg="#08080a" minH="100vh">
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <BarChart2 color="#eab308" size={28} />
          <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
            Resumen General del Inventario
          </Text>
        </HStack>

        {/* 2. Contenedor para el botón y el total */}
        <HStack gap={4}>
          {/* EL BOTÓN PROTEGIDO */}
          {canCreateCategory && (
            <DialogRoot>
              <DialogTrigger asChild>
                <Button
                  bg="yellow.400"
                  color="black"
                  size="sm"
                  fontWeight="bold"
                >
                  <Plus size={16} style={{ marginRight: "8px" }} />
                  Nueva Categoría
                </Button>
              </DialogTrigger>

              <DialogContent bg="#18181b" borderColor="yellow.600">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Categoría</DialogTitle>
                </DialogHeader>

                <form
                  action={async (formData) => {
                    await formAction(formData);
                    window.location.reload();
                  }}
                >
                  <DialogBody>
                    <VStack gap={4}>
                      <Input
                        name="name"
                        placeholder="Nombre (Ej: Vehículos)"
                        required
                        bg="black"
                      />
                      <Input
                        name="color_hex"
                        placeholder="Color Hex (Ej: #ff0000)"
                        required
                        bg="black"
                      />
                      <Input
                        name="icon"
                        placeholder="Icono (Ej: car)"
                        bg="black"
                      />
                      {state?.error && (
                        <Text color="red.500" fontSize="sm">
                          {state.error}
                        </Text>
                      )}
                    </VStack>
                  </DialogBody>
                  <DialogFooter>
                    <DialogCloseTrigger />
                    <Button
                      type="submit"
                      bg="yellow.400"
                      color="black"
                      loading={isPending}
                    >
                      Guardar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </DialogRoot>
          )}

          <Box
            bg="whiteAlpha.100"
            px={3}
            py={1}
            borderRadius="md"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Text fontSize="sm" color="gray.300">
              Total:{" "}
              <Text as="span" fontWeight="bold" color="white">
                {totalItems} items
              </Text>
            </Text>
          </Box>
        </HStack>
      </Flex>

      {/* Estadísticas rápidas */}
      <HStack gap={6} mb={6} align="center">
        <Box px={4} py={3} bg="#111" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="xs" color="gray.400">Categorías</Text>
          <Text fontWeight="bold" color="white">{categorias.length}</Text>
        </Box>
        <Box px={4} py={3} bg="#111" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="xs" color="gray.400">Total ítems</Text>
          <Text fontWeight="bold" color="white">{totalItems}</Text>
        </Box>
        <Box px={4} py={3} bg="#111" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="xs" color="gray.400">Top categoría</Text>
          <Text fontWeight="bold" color="white">{categorias.length ? categorias.reduce((a, c) => (c.cantidad || 0) > (a.cantidad || 0) ? c : a).name : '-'}</Text>
        </Box>
      </HStack>

      {/* ================= SECCIÓN 1: TARJETAS DINÁMICAS ================= */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)",
        }}
        gap={6}
        mb={8}
      >
        {categorias.map((cat) => {
          const IconComponent = iconMap[cat.icon.toLowerCase()] || Package;

          return (
            <Box
              key={cat.id}
              bg="#18181b"
              border="1px solid"
              borderColor={cat.color_hex || "yellow.600"}
              borderRadius="xl"
              p={5}
              boxShadow="0 4px 20px rgba(0,0,0,0.5)"
              position="relative"
            >
              {/* BOTÓN DE ELIMINAR (Solo si es Admin/Supervisor) */}
              {canCreateCategory && (
                <DialogRoot>
                  <DialogTrigger asChild>
                    <Button
                      position="absolute"
                      top={3}
                      right={3}
                      variant="ghost"
                      size="sm"
                      px={2}
                      color="red.400"
                      _hover={{ bg: "red.500", color: "white" }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent bg="#18181b" borderColor="red.600">
                    <DialogHeader>
                      <DialogTitle>Eliminar Categoría</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <Text>
                        ¿Estás seguro de que quieres eliminar{" "}
                        <strong>{cat.name}</strong>? Esta acción no se puede
                        deshacer.
                      </Text>
                    </DialogBody>
                    <DialogFooter>
                      {/* SOLUCIÓN AL ICONO/MODAL: Usar ActionTrigger para el botón Cancelar */}
                      <DialogActionTrigger asChild>
                        <Button variant="ghost">Cancelar</Button>
                      </DialogActionTrigger>
                      <Button
                        colorScheme="red"
                        bg="red.600"
                        color="white"
                        onClick={async () => {
                          await deleteCategoryAction(cat.id);
                          window.location.reload();
                        }}
                      >
                        Eliminar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </DialogRoot>
              )}

              <Flex justify="space-between" align="flex-start" mb={2}>
                <IconComponent color={cat.color_hex} size={28} />
                <Box
                  bg="#27272a"
                  px={2}
                  py={0.5}
                  borderRadius="sm"
                  mt={1}
                  mr={8}
                >
                  <Text
                    color="green.400"
                    fontSize="xs"
                    fontWeight="bold"
                    fontFamily="mono"
                  >
                    {cat.cantidad || 0}
                  </Text>
                </Box>
              </Flex>

              <Text
                textAlign="center"
                color="yellow.400"
                fontWeight="bold"
                fontSize="lg"
                mb={4}
              >
                {cat.name}
              </Text>

              {/* SOLUCIÓN AL BOTÓN GESTIONAR: Redirección usando Next.js Link */}
              <Button
                asChild
                w="full"
                bg="whiteAlpha.200"
                color="white"
                _hover={{ bg: "whiteAlpha.300", color: "yellow.400" }}
                size="sm"
              >
                <Link href={`/dashboard/stock/${cat.id}`}>Gestionar</Link>
              </Button>
            </Box>
          );
        })}
      </Grid>

      {/* ================= SECCIÓN 2: GRÁFICOS REALES ================= */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
        {/* Distribución por ítem */}
        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.200" borderRadius="xl" p={5} h="400px">
          <HStack mb={6} gap={2}>
            <PieChart color="#eab308" size={20} />
            <Text color="yellow.400" fontWeight="bold">Distribución de Stock por ítem</Text>
            <Eye color="gray" size={16} />
          </HStack>

          <HStack gap={3} mb={4} flexWrap="wrap">
            {(chartDataItems.slice(0, 6) || []).map((it, index) => (
              <HStack key={`${it.name}-${index}`} gap={2} align="center">
                <Box w="12px" h="12px" borderRadius="sm" bg={normalizeColor(it.fill as string)} border="1px solid rgba(255,255,255,0.06)" />
                <Text fontSize="xs" color="gray.300">{it.name} <Text as="span" color="white">{it.cantidad}</Text></Text>
              </HStack>
            ))}
          </HStack>

          {chartDataItems.length === 0 || totalItems === 0 ? (
            <Box h="240px" display="flex" alignItems="center" justifyContent="center" color="gray.500">No hay datos para mostrar. Agrega ítems para ver la distribución.</Box>
          ) : (
            <ResponsiveContainer width="100%" height="65%">
              <BarChart data={chartDataItems} barCategoryGap="20%" barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={[0, Math.ceil(maxItem * 1.2) || 1]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#555", color: "#fff" }}
                  itemStyle={{ color: "#eab308" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as ResumenItem & { fill?: string };
                    const porcentaje = totalItems ? ((data.cantidad / totalItems) * 100).toFixed(1) : "0.0";
                    return (
                      <Box bg="#18181b" p={3} borderRadius="md" border="1px solid #333">
                        <HStack>
                          <Box w="10px" h="10px" bg={data.fill} />
                          <Text fontWeight="bold">{data.name}</Text>
                        </HStack>
                        <Text color="gray.300">{data.cantidad} items — {porcentaje}%</Text>
                      </Box>
                    );
                  }}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {chartDataItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={normalizeColor(entry.fill as string) || `hsl(${(index * 50) % 360} 75% 55%)`} />
                  ))}
                  <LabelList dataKey="cantidad" position="top" fill="#e6e6e6" style={{ fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* Stock por categoría */}
        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.200" borderRadius="xl" p={5} h="400px">
          <HStack mb={6} gap={2}>
            <BarChart2 color="#eab308" size={20} />
            <Text color="yellow.400" fontWeight="bold">Stock por Area</Text>
            <Eye color="gray" size={16} />
          </HStack>

          <HStack gap={3} mb={4} flexWrap="wrap">
            {(chartDataCategorias || []).slice(0, 6).map((it, index) => (
              <HStack key={`${it.name}-${index}`} gap={2} align="center">
                <Box w="12px" h="12px" borderRadius="sm" bg={normalizeColor(it.fill as string)} border="1px solid rgba(255,255,255,0.06)" />
                <Text fontSize="xs" color="gray.300">{it.name} <Text as="span" color="white">{it.cantidad}</Text></Text>
              </HStack>
            ))}
          </HStack>

          {chartDataCategorias.length === 0 || maxCategoria === 0 ? (
            <Box h="240px" display="flex" alignItems="center" justifyContent="center" color="gray.500">No hay datos por categoría.</Box>
          ) : (
            <ResponsiveContainer width="100%" height="65%">
              <BarChart data={chartDataCategorias} barCategoryGap="20%" barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={[0, Math.ceil(maxCategoria * 1.2) || 1]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#555", color: "#fff" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as { name: string; cantidad: number; fill?: string };
                    const porcentaje = totalItems ? ((data.cantidad / totalItems) * 100).toFixed(1) : "0.0";
                    return (
                      <Box bg="#18181b" p={3} borderRadius="md" border="1px solid #333">
                        <HStack>
                          <Box w="10px" h="10px" bg={data.fill} />
                          <Text fontWeight="bold">{data.name}</Text>
                        </HStack>
                        <Text color="gray.300">{data.cantidad} items — {porcentaje}%</Text>
                      </Box>
                    );
                  }}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {chartDataCategorias.map((entry, index) => (
                    <Cell key={`cell-cat-${index}`} fill={normalizeColor(entry.fill as string) || `hsl(${(index * 80) % 360} 70% 50%)`} />
                  ))}
                  <LabelList dataKey="cantidad" position="top" fill="#e6e6e6" style={{ fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Grid>
    </Box>
  );
}
