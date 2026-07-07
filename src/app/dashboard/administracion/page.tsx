"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Box, Text, VStack, HStack, Button, SimpleGrid, IconButton, Badge } from "@chakra-ui/react";
import { Download, Upload, PlusCircle } from "lucide-react";

export default function AdminModulePage() {
  const [overview, setOverview] = useState<{
    total_retentions_month: number;
    pending_amount: number;
    companies_count: number;
    total_peajes?: number;
    invoices_processed?: number;
    retentions_last_7?: number[];
  } | null>(null);

  const [activities, setActivities] = useState<Array<any>>([]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    async function loadOverview() {
      try {
        const r = await fetch(`${apiBase}/api/admin/overview`, { credentials: "include" });
        if (r.ok) {
          const data = await r.json();
          setOverview(data);
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function loadActivities() {
      try {
        const r = await fetch(`${apiBase}/api/admin/activity`, { credentials: "include" });
        if (r.ok) {
          const data = await r.json();
          setActivities(data);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadOverview();
    loadActivities();
  }, []);

  const fmt = (v?: number) =>
    v == null ? "—" : v.toLocaleString("es-VE", { maximumFractionDigits: 2 });

  function MetricCard({ label, value, prefix }: { label: string; value: string | number; prefix?: string }) {
    return (
      <Box bg="#0d0d0d" p={4} borderRadius="md" borderWidth={1} borderColor="whiteAlpha.50">
        <HStack justify="space-between" align="start">
          <Box>
            <Text fontSize="sm" color="gray.400">{label}</Text>
            <Text fontSize="xl" fontWeight="bold" color="yellow.300">{prefix ?? ""}{value}</Text>
          </Box>
          <Badge colorScheme="yellow">Hoy</Badge>
        </HStack>
      </Box>
    );
  }

  function Sparkline({ data }: { data?: number[] }) {
    if (!data || data.length === 0) {
      return <Box height="48px" display="flex" alignItems="center" justifyContent="center" color="gray.500">sin datos</Box>;
    }
    const w = 240;
    const h = 48;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    }).join(" ");
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline fill="none" stroke="#f6e05e" strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Text fontSize="2xl" mb={4} color="yellow.300">Administración</Text>

      <HStack spacing={3} mb={6}>
        <Link href="/dashboard/administracion/retencion">
          <Button leftIcon={<Upload size={16} />} colorScheme="yellow">Subir factura</Button>
        </Link>

        <Link href="/dashboard/administracion/retencion">
          <Button leftIcon={<PlusCircle size={16} />} variant="outline" colorScheme="yellow">Crear empresa</Button>
        </Link>

        <Link href="/dashboard/administracion/retencion?filter=pending">
          <Button variant="ghost" colorScheme="yellow">Ver pendientes</Button>
        </Link>

        <IconButton aria-label="Exportar CSV" icon={<Download size={16} />} colorScheme="yellow" />
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <MetricCard label="Total Retenciones (mes)" value={`Bs. ${fmt(overview?.total_retentions_month)}`} />
        <MetricCard label="Monto Pendiente" value={`Bs. ${fmt(overview?.pending_amount)}`} />
        <MetricCard label="Empresas Guardadas" value={overview?.companies_count ?? "—"} />
      </SimpleGrid>

      <HStack spacing={4} mb={6}>
        <Box flex="1" bg="#0b0b0b" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={2}>Retenciones últimos 7 días</Text>
          <Sparkline data={overview?.retentions_last_7} />
        </Box>

        <Box w="260px">
          <SimpleGrid columns={1} spacing={3}>
            <MetricCard label="Peajes (tot)" value={overview?.total_peajes ?? "—"} />
            <MetricCard label="Facturas procesadas" value={overview?.invoices_processed ?? "—"} />
          </SimpleGrid>
        </Box>
      </HStack>

      <HStack align="start" gap={6}>
        <Box flex="2" bg="#0b0b0b" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={3}>Actividad Reciente</Text>

          <Box as="table" width="100%" sx={{ borderCollapse: "collapse" }}>
            <Box as="thead">
              <Box as="tr">
                <Box as="th" textAlign="left" py={2}>Fecha</Box>
                <Box as="th" textAlign="left" py={2}>Acción</Box>
                <Box as="th" textAlign="left" py={2}>Usuario</Box>
                <Box as="th" textAlign="left" py={2}>Detalle</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {activities.length === 0 ? (
                <Box as="tr">
                  <Box as="td" colSpan={4} color="gray.500" py={2}>Sin actividad reciente</Box>
                </Box>
              ) : (
                activities.map((row: any, i: number) => (
                  <Box as="tr" key={i}>
                    <Box as="td" py={2}>{new Date(row.date).toLocaleString()}</Box>
                    <Box as="td" py={2}>{row.action}</Box>
                    <Box as="td" py={2}>{row.actor ?? "—"}</Box>
                    <Box as="td" py={2}>{row.detail}</Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>

        <VStack flex="1" align="stretch" spacing={4}>
          <Box bg="#0b0b0b" p={4} borderRadius="md">
            <Text fontWeight="bold" mb={2}>Accesos Rápidos</Text>
            <VStack align="start">
              <Link href="/dashboard/administracion/retencion">Ir a Retenciones</Link>
              <Link href="/dashboard/administracion/companies">Gestionar Empresas</Link>
              <Link href="/dashboard/administracion/reports">Reportes y Export</Link>
              <Link href="/dashboard/administracion/import">Importar Masivo</Link>
            </VStack>
          </Box>

          <Box bg="#0b0b0b" p={4} borderRadius="md">
            <Text fontWeight="bold" mb={2}>Ajustes Rápidos</Text>
            <VStack align="start">
              <Link href="/dashboard/administracion/settings">Porcentajes por defecto</Link>
              <Link href="/dashboard/administracion/audit">Ver auditoría</Link>
            </VStack>
          </Box>
        </VStack>
      </HStack>

      <Text mt={6} color="gray.500">Nota: las métricas se obtienen desde el backend.</Text>
    </Box>
  );
}
