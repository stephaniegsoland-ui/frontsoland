"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Box, Heading, VStack, Input, Button, Text, HStack, SimpleGrid, Badge, Flex } from "@chakra-ui/react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Building2, FileText, Search, TrendingUp, AlertTriangle } from "lucide-react";

const demoCompanies = [
  { id: 1, name: "Transportes Sol", rif: "J-12345678", status: "activo", retention_count: 14, documents_pending: 1, updated_at: "2026-07-06" },
  { id: 2, name: "Logística Norte", rif: "J-87654321", status: "pendiente", retention_count: 7, documents_pending: 3, updated_at: "2026-07-05" },
  { id: 3, name: "Distribuidora Vega", rif: "J-11223344", status: "revision", retention_count: 9, documents_pending: 2, updated_at: "2026-07-04" },
];

export default function CompaniesPage() {
  const [name, setName] = useState("");
  const [rif, setRif] = useState("");
  const [companies, setCompanies] = useState<any[]>(demoCompanies);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await fetch("/api/admin/companies", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCompanies(data);
            return;
          }
        }
      } catch (error) {
        console.error(error);
      }
      setCompanies(demoCompanies);
    };

    loadCompanies();
  }, []);

  const create = async () => {
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rif }),
    });
    if (res.ok) {
      const c = await res.json();
      setCompanies((s) => [{ ...c, status: "activo", retention_count: 0, documents_pending: 0, updated_at: new Date().toISOString() }, ...s]);
      setName("");
      setRif("");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Eliminar empresa?")) return;
    await fetch(`/api/admin/companies/${id}`, { method: "DELETE" });
    setCompanies((s) => s.filter((c) => c.id !== id));
  };

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const hayQuery = query.trim().toLowerCase();
      if (!hayQuery) return true;
      return (c.name || "").toLowerCase().includes(hayQuery) || (c.rif || "").toLowerCase().includes(hayQuery);
    });
  }, [companies, query]);

  const metrics = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === "activo").length;
    const pending = companies.filter((c) => c.status === "pendiente").length;
    const revision = companies.filter((c) => c.status === "revision").length;
    const docs = companies.reduce((sum, c) => sum + (c.documents_pending || 0), 0);
    const retentions = companies.reduce((sum, c) => sum + (c.retention_count || 0), 0);

    return { total, active, pending, revision, docs, retentions };
  }, [companies]);

  const chartData = [
    { name: "Activas", value: metrics.active },
    { name: "Pendientes", value: metrics.pending },
    { name: "Revisión", value: metrics.revision },
  ];

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="md" mb={2}>Gestión de Empresas</Heading>
      <Text color="gray.400" mb={6}>Centraliza información operativa, documentos y seguimiento del estado de cada empresa.</Text>

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <Building2 size={18} color="#f6e05e" />
            <Badge colorScheme="green">Activas</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.total}</Text>
          <Text color="gray.400" fontSize="sm">Empresas registradas</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <TrendingUp size={18} color="#f6e05e" />
            <Badge colorScheme="yellow">Proceso</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.retentions}</Text>
          <Text color="gray.400" fontSize="sm">Retenciones asociadas</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <FileText size={18} color="#f6e05e" />
            <Badge colorScheme="orange">Documentos</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.docs}</Text>
          <Text color="gray.400" fontSize="sm">Pendientes por revisar</Text>
        </Box>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <AlertTriangle size={18} color="#f6e05e" />
            <Badge colorScheme="red">Atención</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.pending}</Text>
          <Text color="gray.400" fontSize="sm">Empresas con seguimiento pendiente</Text>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6} mb={6}>
        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <Heading size="sm" mb={4}>Registro rápido</Heading>
          <VStack align="stretch" gap={3}>
            <Box>
              <Text fontSize="sm" mb={1} color="gray.300">Nombre</Text>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Transporte del Sur" />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} color="gray.300">RIF</Text>
              <Input value={rif} onChange={(e) => setRif(e.target.value)} placeholder="J-00000000" />
            </Box>
            <Button onClick={create} colorScheme="yellow">Crear empresa</Button>
          </VStack>
        </Box>

        <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
          <Heading size="sm" mb={4}>Distribución por estado</Heading>
          <Box height="220px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="#f6e05e" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#fb923c" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </SimpleGrid>

      <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
        <HStack justify="space-between" mb={3} flexWrap="wrap">
          <Heading size="sm">Empresas registradas</Heading>
          <HStack width={{ base: "100%", md: "280px" }}>
            <Search size={16} color="#f6e05e" />
            <Input size="sm" placeholder="Buscar por nombre o RIF" value={query} onChange={(e) => setQuery(e.target.value)} />
          </HStack>
        </HStack>

        <VStack align="stretch" gap={3}>
          {filtered.map((c) => (
            <Box key={c.id} borderTop="1px solid rgba(255,255,255,0.06)" pt={3}>
              <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={2}>
                <Box>
                  <Text fontWeight="bold">{c.name}</Text>
                  <Text fontSize="sm" color="gray.400">{c.rif}</Text>
                </Box>
                <HStack flexWrap="wrap" gap={2}>
                  <Badge colorScheme={c.status === "activo" ? "green" : c.status === "pendiente" ? "red" : "orange"}>{c.status}</Badge>
                  <Text fontSize="sm" color="gray.400">Retenciones: {c.retention_count || 0}</Text>
                  <Text fontSize="sm" color="gray.400">{new Date(c.updated_at || Date.now()).toLocaleDateString("es-VE")}</Text>
                </HStack>
                <HStack gap={2}>
                  <Button size="sm" colorScheme="yellow" asChild>
                    <Link href={`/dashboard/administracion/companies/${c.id}/edit`}>Editar</Link>
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => remove(c.id)}>Eliminar</Button>
                </HStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
