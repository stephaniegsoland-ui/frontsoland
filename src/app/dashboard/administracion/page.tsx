"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Badge,
  Flex,
  Grid,
  Stack,
} from "@chakra-ui/react";

type OverviewData = {
  total_retentions_month: number;
  pending_amount: number;
  companies_count: number;
  total_peajes?: number;
  invoices_processed?: number;
  retentions_last_7?: number[];
  retentions_trend?: Array<{ date: string; value: number }>;
};

const fallbackOverview: OverviewData = {
  total_retentions_month: 1865000,
  pending_amount: 482300,
  companies_count: 14,
  total_peajes: 38,
  invoices_processed: 126,
  retentions_last_7: [120, 180, 160, 210, 240, 200, 280],
};

const fallbackActivities = [
  { date: "2026-09-12T08:15:00.000Z", action: "Empresa actualizada", actor: "María P.", detail: "Transportes del Sur" },
  { date: "2026-09-11T22:15:00.000Z", action: "Retención aprobada", actor: "Sistema", detail: "Factura 00388" },
  { date: "2026-09-11T15:15:00.000Z", action: "Peaje administrativo", actor: "Jorge R.", detail: "Ruta Norte - 4 cargas" },
  { date: "2026-09-11T10:15:00.000Z", action: "Documento cargado", actor: "Contabilidad", detail: "Planilla de retenciones" },
];

export default function AdminModulePage() {
  const [overview, setOverview] = useState<OverviewData | null>(fallbackOverview);
  const [activities, setActivities] = useState<Array<any>>(fallbackActivities);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [filter, setFilter] = useState<"all" | "retention" | "company" | "peaje">("all");

  useEffect(() => {
    async function loadOverview() {
      try {
        const r = await fetch("/api/admin/overview", {
          credentials: "include",
          cache: "no-store",
        });
        if (r.ok) {
          const data = await r.json();
          setOverview({ ...fallbackOverview, ...data });
        }
      } catch (e) {
        console.error("admin overview error", e);
      }
    }

    async function loadActivities() {
      try {
        const r = await fetch("/api/admin/activity", {
          credentials: "include",
          cache: "no-store",
        });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data) && data.length > 0) setActivities(data);
        }
      } catch (e) {
        console.error("admin activity error", e);
      }
    }

    loadOverview();
    loadActivities();
  }, []);

  const fmt = (v?: number) =>
    v == null ? "—" : v.toLocaleString("es-VE", { maximumFractionDigits: 2 });

  const moduleCards = [
    { title: "Empresas asociadas", desc: "Alta, edición y seguimiento de alianzas comerciales.", href: "/dashboard/administracion/companies", tone: "yellow" },
    { title: "Retenciones", desc: "Facturas, pagos pendientes y seguimiento mensual.", href: "/dashboard/administracion/retencion", tone: "orange" },
    { title: "Peajes administrativos", desc: "Control de peajes y registros operativos.", href: "/dashboard/administracion/peaje", tone: "green" },
    { title: "Hoja de tiempo", desc: "Aprobación y control del tiempo del personal administrativo.", href: "/dashboard/administracion/tiempo", tone: "blue" },
  ];

  const chartData = useMemo(() => {
    const trend = overview?.retentions_trend ?? [];
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const realData = trend.slice(-days).map((item) => ({
      label: new Date(`${item.date}T12:00:00`).toLocaleDateString("es-VE", {
        day: "2-digit",
        month: range === "90d" ? "short" : "2-digit",
      }),
      value: Number(item.value || 0),
    }));

    if (realData.length > 0) return realData;
    return (range === "7d" ? fallbackOverview.retentions_last_7 ?? [] : []).map((value, index) => ({
      label: String(index + 1),
      value,
    }));
  }, [overview, range]);

  const progressData = useMemo(() => {
    const empresas = Math.min(100, ((overview?.companies_count ?? 0) / 20) * 100);
    const pendientes = Math.min(100, ((overview?.pending_amount ?? 0) / 1000000) * 100);
    const retenciones = Math.min(100, ((overview?.total_retentions_month ?? 0) / 3000000) * 100);
    return [
      { label: "Empresas", value: Math.round(empresas), color: "#f6e05e" },
      { label: "Pendientes", value: Math.round(pendientes), color: "#fbbf24" },
      { label: "Retenciones", value: Math.round(retenciones), color: "#34d399" },
    ];
  }, [overview]);

  const filteredActivities = useMemo(() => {
    return activities.filter((row) => {
      if (filter === "all") return true;
      if (filter === "retention") return /retenci|factur|pago|pendiente/i.test(row.action || row.detail || "");
      if (filter === "company") return /empresa|alianza|cliente/i.test(row.action || row.detail || "");
      if (filter === "peaje") return /peaje|ruta|vehicul|carga/i.test(row.action || row.detail || "");
      return true;
    });
  }, [activities, filter]);

  const handleExportCsv = () => {
    const rows = [
      ["fecha", "accion", "actor", "detalle"],
      ...filteredActivities.map((row) => [
        new Date(row.date).toLocaleString("es-VE"),
        row.action ?? "",
        row.actor ?? "",
        row.detail ?? "",
      ]),
    ];

    const csv = rows.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `administracion-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  function MetricCard({ label, value, prefix, badge = "Hoy" }: { label: string; value: string | number; prefix?: string; badge?: string }) {
    return (
      <Box bg="#0d0d0d" p={4} borderRadius="xl" borderWidth={1} borderColor="whiteAlpha.100" boxShadow="sm">
        <HStack justify="space-between" align="start">
          <Box>
            <Text fontSize="sm" color="gray.400">{label}</Text>
            <Text fontSize="xl" fontWeight="bold" color="yellow.300" mt={2}>{prefix ?? ""}{value}</Text>
          </Box>
          <Badge colorScheme="yellow" variant="subtle">{badge}</Badge>
        </HStack>
      </Box>
    );
  }

  function Sparkline({ data }: { data?: number[] }) {
    if (!data || data.length === 0) {
      return <Box height="60px" display="flex" alignItems="center" justifyContent="center" color="gray.500">sin datos</Box>;
    }

    const w = 620;
    const h = 120;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline fill="none" stroke="#f6e05e" strokeWidth={3} points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }} bg="#08080a" minH="100vh" color="white">
      <Flex direction={{ base: "column", md: "row" }} align={{ base: "flex-start", md: "center" }} justify="space-between" gap={4} mb={6}>
        <Box>
          <Text fontSize="sm" color="yellow.300" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
            Administración
          </Text>
          <Text fontSize="3xl" fontWeight="bold" mt={1}>Panel operativo</Text>
        </Box>

        <HStack gap={3} wrap="wrap">
          <Link href="/dashboard/administracion/retencion">
            <Button colorScheme="yellow">Subir factura</Button>
          </Link>
          <Link href="/dashboard/administracion/companies">
            <Button variant="outline" colorScheme="yellow">Nueva empresa</Button>
          </Link>
          <Link href="/dashboard/administracion/pendientes">
            <Button variant="ghost" colorScheme="yellow">Ver pendientes</Button>
          </Link>
        </HStack>
      </Flex>

      <Flex justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
        <HStack gap={2}>
          {(["7d", "30d", "90d"] as const).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={range === item ? "solid" : "outline"}
              colorScheme="yellow"
              onClick={() => setRange(item)}
            >
              {item === "7d" ? "7 días" : item === "30d" ? "30 días" : "90 días"}
            </Button>
          ))}
        </HStack>

        <HStack gap={3}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              background: "#111214",
              color: "white",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "8px",
              padding: "8px 10px",
            }}
          >
            <option value="all">Todo</option>
            <option value="retention">Retenciones</option>
            <option value="company">Empresas</option>
            <option value="peaje">Peajes</option>
          </select>

          <Button colorScheme="yellow" variant="outline" onClick={handleExportCsv}>Exportar CSV</Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4} mb={6}>
        <MetricCard label="Retenciones del mes" value={`Bs. ${fmt(overview?.total_retentions_month)}`} />
        <MetricCard label="Monto pendiente" value={`Bs. ${fmt(overview?.pending_amount)}`} />
        <MetricCard label="Empresas registradas" value={overview?.companies_count ?? "—"} />
        <MetricCard label="Facturas procesadas" value={overview?.invoices_processed ?? "—"} />
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6} mb={6}>
        <Box bg="#0c0c0d" p={4} borderRadius="xl" borderWidth={1} borderColor="whiteAlpha.100">
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold" fontSize="lg">Tendencia de retenciones</Text>
            <Badge colorScheme="green">+12.4%</Badge>
          </Flex>
          <Sparkline data={chartData.map((d) => d.value)} />
          <HStack mt={3} gap={3} wrap="wrap">
            {chartData.map((d) => (
              <Box key={d.label} textAlign="center">
                <Text fontSize="xs" color="gray.500">{d.label}</Text>
                <Text fontSize="sm" color="gray.200">{d.value}</Text>
              </Box>
            ))}
          </HStack>
        </Box>

        <Box bg="#0c0c0d" p={4} borderRadius="xl" borderWidth={1} borderColor="whiteAlpha.100">
          <Text fontWeight="bold" mb={3}>Estado operativo</Text>
          <VStack align="stretch" gap={4}>
            {progressData.map((item) => (
              <Box key={item.label}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.300">{item.label}</Text>
                  <Text fontSize="sm" color="gray.400">{item.value}%</Text>
                </Flex>
                <Box bg="whiteAlpha.100" borderRadius="full" overflow="hidden" height="10px">
                  <Box height="100%" width={`${item.value}%`} bg={item.color} borderRadius="full" />
                </Box>
              </Box>
            ))}
          </VStack>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={6} mb={6}>
        <Box bg="#0c0c0d" p={4} borderRadius="xl" borderWidth={1} borderColor="whiteAlpha.100">
          <Text fontWeight="bold" fontSize="lg" mb={4}>Submódulos de administración</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {moduleCards.map((card) => (
              <Link key={card.title} href={card.href}>
                <Box
                  bg="#121214"
                  borderRadius="lg"
                  p={4}
                  borderWidth={1}
                  borderColor={card.tone === "yellow" ? "yellow.500/40" : card.tone === "orange" ? "orange.500/40" : card.tone === "green" ? "green.500/40" : "blue.500/40"}
                  _hover={{ transform: "translateY(-1px)", borderColor: "whiteAlpha.200" }}
                  transition="all 0.2s ease"
                >
                  <Badge colorScheme={card.tone} variant="subtle" mb={2}>{card.title}</Badge>
                  <Text color="gray.300" fontSize="sm">{card.desc}</Text>
                </Box>
              </Link>
            ))}
          </SimpleGrid>
        </Box>

        <Box bg="#0c0c0d" p={4} borderRadius="xl" borderWidth={1} borderColor="whiteAlpha.100">
          <Text fontWeight="bold" fontSize="lg" mb={4}>Accesos rápidos</Text>
          <Stack gap={3}>
            <Link href="/dashboard/administracion/companies"><Button variant="outline" w="full">Gestionar empresas</Button></Link>
            <Link href="/dashboard/administracion/retencion"><Button variant="outline" w="full">Revisar retenciones</Button></Link>
            <Link href="/dashboard/administracion/pendientes"><Button variant="outline" w="full">Pendientes del mes</Button></Link>
            <Link href="/dashboard/administracion/peaje"><Button variant="outline" w="full">Panel peajes</Button></Link>
          </Stack>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1.7fr 1fr" }} gap={6}>
        <Box bg="#0c0c0d" p={4} borderRadius="xl" borderWidth={1} borderColor="whiteAlpha.100">
          <Text fontWeight="bold" fontSize="lg" mb={4}>Actividad reciente</Text>
          <VStack align="stretch" gap={3}>
            {filteredActivities.length === 0 ? (
              <Text color="gray.500">Sin actividad reciente para este filtro</Text>
            ) : (
              filteredActivities.map((row: any, index: number) => (
                <Box key={`${row.action}-${index}`} bg="#121214" borderRadius="lg" p={3} borderWidth={1} borderColor="whiteAlpha.100">
                  <Text fontSize="sm" color="gray.400">{new Date(row.date).toLocaleString("es-VE")}</Text>
                  <Text fontWeight="bold" mt={1}>{row.action}</Text>
                  <Text fontSize="sm" color="gray.300">{row.actor ?? "—"} • {row.detail}</Text>
                </Box>
              ))
            )}
          </VStack>
        </Box>

        <Box bg="#0c0c0d" p={4} borderRadius="xl" borderWidth={1} borderColor="whiteAlpha.100">
          <Text fontWeight="bold" fontSize="lg" mb={4}>Resumen del área</Text>
          <VStack align="stretch" gap={4}>
            <Box bg="#121214" p={3} borderRadius="lg">
              <Text fontSize="sm" color="gray.400">Peajes del vehículo</Text>
              <Text fontSize="2xl" fontWeight="bold" color="yellow.300">{overview?.total_peajes ?? 0}</Text>
            </Box>
            <Box bg="#121214" p={3} borderRadius="lg">
              <Text fontSize="sm" color="gray.400">Empresas activas</Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.300">{overview?.companies_count ?? 0}</Text>
            </Box>
            <Box bg="#121214" p={3} borderRadius="lg">
              <Text fontSize="sm" color="gray.400">Monto pendiente</Text>
              <Text fontSize="2xl" fontWeight="bold" color="orange.300">Bs. {fmt(overview?.pending_amount)}</Text>
            </Box>
          </VStack>
        </Box>
      </Grid>
    </Box>
  );
}
