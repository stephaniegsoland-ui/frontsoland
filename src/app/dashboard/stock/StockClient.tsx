"use client";
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
  const totalItems = categorias.reduce(
    (acc, cat) => acc + (cat.cantidad || 0),
    0,
  );

  const chartDataItems = (resumen?.items || []).map((entry: ResumenItem) => ({
    ...entry,
    fill: entry.color || "#3b82f6",
  }));

  const chartDataCategorias = categorias.map((cat) => ({
    name: cat.name,
    cantidad: cat.cantidad || 0,
    fill: cat.color_hex || "#cbd5e1",
  }));

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
                      top={2}
                      right={2}
                      variant="ghost"
                      size="xs"
                      color="red.400"
                      _hover={{ bg: "whiteAlpha.100", color: "red.300" }}
                    >
                      <Trash2 size={16} />
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
                      <DialogCloseTrigger asChild>
                        <Button variant="ghost">Cancelar</Button>
                      </DialogCloseTrigger>
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
                <IconComponent color={cat.color_hex} size={24} />
                <Box bg="#27272a" px={2} py={0.5} borderRadius="sm">
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

              <Button
                w="full"
                bg="whiteAlpha.200"
                color="white"
                _hover={{ bg: "whiteAlpha.300" }}
                size="sm"
              >
                Gestionar
              </Button>
            </Box>
          );
        })}
      </Grid>

      {/* ================= SECCIÓN 2: GRÁFICOS REALES ================= */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
        <Box
          bg="#18181b"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="xl"
          p={5}
          h="400px"
        >
          <HStack mb={6} gap={2}>
            <PieChart color="#eab308" size={20} />
            <Text color="yellow.400" fontWeight="bold">
              Distribución de Stock por ítem
            </Text>
            <Eye color="gray" size={16} />
          </HStack>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartDataItems}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#555",
                  color: "#fff",
                }}
                itemStyle={{ color: "#eab308" }}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box
          bg="#18181b"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="xl"
          p={5}
          h="400px"
        >
          <HStack mb={6} gap={2}>
            <BarChart2 color="#eab308" size={20} />
            <Text color="yellow.400" fontWeight="bold">
              Stock por Area
            </Text>
            <Eye color="gray" size={16} />
          </HStack>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartDataCategorias}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#333"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#555",
                  color: "#fff",
                }}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Grid>
    </Box>
  );
}
