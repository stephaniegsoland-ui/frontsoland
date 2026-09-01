"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { AlertTriangle, Building2, FileText, Search, TrendingUp } from "lucide-react";

const toApiUrl = (path: string) => path;

const emptyCompanyForm = {
  name: "",
  rif: "",
  address: "",
  phone: "",
  email: "",
  contact_name: "",
  status: "activo",
  default_retention_percent: "0",
};

type CompanyRecord = {
  id: string;
  name?: string;
  rif?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  status?: string;
  default_retention_percent?: number | string;
  retention_count?: number;
  retentions?: Array<{
    id: string;
    description?: string;
    amount?: number | string;
    percent?: number | string;
    status?: string;
    due_date?: string | null;
  }>;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [retentionForm, setRetentionForm] = useState({
    description: "",
    amount: "",
    percent: "",
    status: "pendiente",
    due_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch(toApiUrl("/api/admin/companies/"), {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
          setCompanies([]);
          return;
        }
        const text = await response.text().catch(() => "");
        console.warn("No se pudo cargar las empresas:", response.status, text);
        setError("No se pudo cargar la lista de empresas. Verifica que el backend esté levantado.");
        setCompanies([]);
        return;
      }
      const data = await response.json();
      setCompanies(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de empresas. Verifica que el backend esté levantado.");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyDetails = async (companyId: string) => {
    try {
      const response = await fetch(toApiUrl(`/api/admin/companies/${companyId}`), {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Error cargando empresa");
      }
      const data = await response.json();
      setSelectedCompany(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información detallada de la empresa.");
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      void loadCompanyDetails(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const filteredCompanies = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) => {
      const text = `${company.name ?? ""} ${company.rif ?? ""} ${company.contact_name ?? ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [companies, query]);

  const metrics = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((company) => company.status === "activo").length;
    const pending = companies.filter((company) => company.status === "pendiente").length;
    const revision = companies.filter((company) => company.status === "revision").length;
    const retentions = companies.reduce((sum, company) => sum + (company.retention_count || company.retentions?.length || 0), 0);
    return { total, active, pending, revision, retentions };
  }, [companies]);

  const chartData = [
    { name: "Activas", value: metrics.active },
    { name: "Pendientes", value: metrics.pending },
    { name: "Revisión", value: metrics.revision },
  ];

  const createCompany = async () => {
    if (!companyForm.name.trim() || !companyForm.rif.trim()) {
      setError("Nombre y RIF son obligatorios para registrar la empresa.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(toApiUrl("/api/admin/companies/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: companyForm.name.trim(),
          rif: companyForm.rif.trim(),
          address: companyForm.address.trim() || null,
          phone: companyForm.phone.trim() || null,
          email: companyForm.email.trim() || null,
          contact_name: companyForm.contact_name.trim() || null,
          status: companyForm.status,
          default_retention_percent: Number(companyForm.default_retention_percent || 0),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "No se pudo crear la empresa");
      }

      const created = await response.json();
      setCompanyForm(emptyCompanyForm);
      setError(null);
      setSelectedCompanyId(created.id);
      await loadCompanies();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo guardar la empresa.");
    } finally {
      setLoading(false);
    }
  };

  const createRetention = async () => {
    if (!selectedCompanyId || !retentionForm.description.trim()) {
      setError("Selecciona una empresa y escribe una descripción para la retención.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(toApiUrl(`/api/admin/companies/${selectedCompanyId}/retentions`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          company_id: selectedCompanyId,
          description: retentionForm.description.trim(),
          amount: Number(retentionForm.amount || 0),
          percent: Number(retentionForm.percent || 0),
          status: retentionForm.status,
          due_date: retentionForm.due_date || null,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "No se pudo crear la retención");
      }

      setRetentionForm({
        description: "",
        amount: "",
        percent: "",
        status: "pendiente",
        due_date: "",
      });
      setError(null);
      await loadCompanyDetails(selectedCompanyId);
      await loadCompanies();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo guardar la retención.");
    } finally {
      setLoading(false);
    }
  };

  const removeCompany = async (companyId: string) => {
    if (!confirm("¿Deseas eliminar esta empresa?")) return;
    try {
      const response = await fetch(toApiUrl(`/api/admin/companies/${companyId}`), {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar la empresa");
      }
      setCompanies((current) => current.filter((company) => company.id !== companyId));
      if (selectedCompanyId === companyId) {
        setSelectedCompanyId(null);
        setSelectedCompany(null);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo eliminar la empresa.");
    }
  };

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="md" mb={2}>Gestión de Empresas Asociadas</Heading>
      <Text color="gray.400" mb={6}>
        Registra empresas, busca su contacto y revisa cuántas retenciones están pendientes o activas.
      </Text>

      {error && (
        <Box mb={5} p={3} borderRadius="md" bg="red.950" border="1px solid" borderColor="red.700">
          <Text color="red.200">{error}</Text>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <Building2 size={18} color="#f6e05e" />
            <Badge colorScheme="green">Activas</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.total}</Text>
          <Text color="gray.400" fontSize="sm">Empresas registradas</Text>
        </Box>
        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <TrendingUp size={18} color="#f6e05e" />
            <Badge colorScheme="yellow">Proceso</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.retentions}</Text>
          <Text color="gray.400" fontSize="sm">Retenciones asociadas</Text>
        </Box>
        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <FileText size={18} color="#f6e05e" />
            <Badge colorScheme="orange">Por revisar</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.pending}</Text>
          <Text color="gray.400" fontSize="sm">Empresas en seguimiento</Text>
        </Box>
        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={2}>
            <AlertTriangle size={18} color="#f6e05e" />
            <Badge colorScheme="red">Atención</Badge>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold">{metrics.revision}</Text>
          <Text color="gray.400" fontSize="sm">En revisión</Text>
        </Box>
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", xl: "1.1fr 1.3fr" }} gap={6} mb={6}>
        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <Heading size="sm" mb={4}>Registrar empresa</Heading>
          <VStack align="stretch" gap={3}>
            <Input value={companyForm.name} onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre de la empresa" />
            <Input value={companyForm.rif} onChange={(e) => setCompanyForm((prev) => ({ ...prev, rif: e.target.value }))} placeholder="RIF o documento fiscal" />
            <Input value={companyForm.contact_name} onChange={(e) => setCompanyForm((prev) => ({ ...prev, contact_name: e.target.value }))} placeholder="Contacto principal" />
            <Input value={companyForm.phone} onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Teléfono" />
            <Input value={companyForm.email} onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Correo electrónico" />
            <Input value={companyForm.address} onChange={(e) => setCompanyForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Dirección" />
            <select value={companyForm.status} onChange={(e) => setCompanyForm((prev) => ({ ...prev, status: e.target.value }))} style={{ background: "#0b0b0c", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "12px", width: "100%" }}>
              <option value="activo">Activo</option>
              <option value="pendiente">Pendiente</option>
              <option value="revision">Revisión</option>
            </select>
            <Input value={companyForm.default_retention_percent} onChange={(e) => setCompanyForm((prev) => ({ ...prev, default_retention_percent: e.target.value }))} placeholder="Porcentaje de retención por defecto" type="number" step="0.01" />
            <Button onClick={createCompany} colorScheme="yellow" loading={loading}>
              Guardar empresa
            </Button>
          </VStack>
        </Box>

        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <Heading size="sm" mb={4}>Distribución por estado</Heading>
          <SimpleGrid columns={3} gap={3} height="220px" alignItems="end">
            {chartData.map((item) => (
              <Box key={item.name} display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Box
                  w="100%"
                  maxW="120px"
                  h={`${Math.max(40, (item.value / Math.max(1, metrics.total || 1)) * 180)}px`}
                  bg={item.name === "Activas" ? "#f6e05e" : item.name === "Pendientes" ? "#f59e0b" : "#fb923c"}
                  borderRadius="md  md 0 0"
                />
                <Text fontSize="sm" color="gray.300">{item.name}</Text>
                <Text fontWeight="bold">{item.value}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "0.95fr 1.35fr" }} gap={6}>
        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <HStack justify="space-between" mb={3}>
            <Heading size="sm">Empresas registradas</Heading>
            <HStack w={{ base: "100%", md: "220px" }}>
              <Search size={16} color="#f6e05e" />
              <Input size="sm" placeholder="Buscar por nombre o RIF" value={query} onChange={(e) => setQuery(e.target.value)} />
            </HStack>
          </HStack>

          <VStack align="stretch" gap={3}>
            {filteredCompanies.length === 0 && (
              <Text color="gray.400">No hay empresas que coincidan con la búsqueda.</Text>
            )}

            {filteredCompanies.map((company) => (
              <Box key={company.id} p={3} borderRadius="md" bg="#0c0d0e" border="1px solid" borderColor="whiteAlpha.100">
                <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={2}>
                  <Box>
                    <Text fontWeight="bold">{company.name}</Text>
                    <Text fontSize="sm" color="gray.400">{company.rif || "Sin RIF"}</Text>
                  </Box>
                  <HStack gap={2} flexWrap="wrap">
                    <Badge colorScheme={company.status === "activo" ? "green" : company.status === "pendiente" ? "yellow" : "orange"}>{company.status}</Badge>
                    <Text fontSize="sm" color="gray.400">Retenciones: {company.retention_count || company.retentions?.length || 0}</Text>
                  </HStack>
                </Flex>
                <HStack mt={2} justify="space-between" wrap="wrap">
                  <Text fontSize="sm" color="gray.300">Contacto: {company.contact_name || "Sin contacto"}</Text>
                  <HStack gap={2}>
                    <Button size="sm" variant="outline" colorScheme="yellow" onClick={() => setSelectedCompanyId(company.id)}>
                      Ver
                    </Button>
                    <Button size="sm" colorScheme="red" variant="ghost" onClick={() => removeCompany(company.id)}>
                      Eliminar
                    </Button>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        <Box bg="#111214" p={4} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          {selectedCompany ? (
            <VStack align="stretch" gap={5}>
              <HStack justify="space-between" align="center" wrap="wrap">
                <Box>
                  <Heading size="sm">{selectedCompany.name}</Heading>
                  <Text color="gray.400">{selectedCompany.rif || "Sin RIF"}</Text>
                </Box>
                <Badge colorScheme={selectedCompany.status === "activo" ? "green" : selectedCompany.status === "pendiente" ? "yellow" : "orange"}>
                  {selectedCompany.status}
                </Badge>
              </HStack>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                <Box bg="#0c0d0e" p={3} borderRadius="md">
                  <Text color="gray.400" fontSize="sm">Contacto</Text>
                  <Text fontWeight="bold">{selectedCompany.contact_name || "Sin contacto"}</Text>
                </Box>
                <Box bg="#0c0d0e" p={3} borderRadius="md">
                  <Text color="gray.400" fontSize="sm">Teléfono</Text>
                  <Text fontWeight="bold">{selectedCompany.phone || "Sin teléfono"}</Text>
                </Box>
                <Box bg="#0c0d0e" p={3} borderRadius="md">
                  <Text color="gray.400" fontSize="sm">Correo</Text>
                  <Text fontWeight="bold">{selectedCompany.email || "Sin correo"}</Text>
                </Box>
                <Box bg="#0c0d0e" p={3} borderRadius="md">
                  <Text color="gray.400" fontSize="sm">Dirección</Text>
                  <Text fontWeight="bold">{selectedCompany.address || "Sin dirección"}</Text>
                </Box>
              </Grid>

              <Box bg="#0c0d0e" p={3} borderRadius="md">
                <Text color="gray.400" fontSize="sm">Retenciones totales</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {selectedCompany.retention_count ?? selectedCompany.retentions?.length ?? 0}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  % por defecto: {selectedCompany.default_retention_percent ?? 0}%
                </Text>
              </Box>

              <Box bg="#0c0d0e" p={3} borderRadius="md">
                <Heading size="sm" mb={3}>Registrar retención</Heading>
                <VStack align="stretch" gap={3}>
                  <Input value={retentionForm.description} onChange={(e) => setRetentionForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descripción de la retención" />
                  <HStack gap={3}>
                    <Input value={retentionForm.amount} onChange={(e) => setRetentionForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="Monto" type="number" step="0.01" />
                    <Input value={retentionForm.percent} onChange={(e) => setRetentionForm((prev) => ({ ...prev, percent: e.target.value }))} placeholder="%" type="number" step="0.01" />
                  </HStack>
                  <HStack gap={3}>
                    <select value={retentionForm.status} onChange={(e) => setRetentionForm((prev) => ({ ...prev, status: e.target.value }))} style={{ background: "#0b0b0c", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "12px", width: "100%" }}>
                      <option value="pendiente">Pendiente</option>
                      <option value="pagada">Pagada</option>
                      <option value="aprobada">Aprobada</option>
                    </select>
                    <Input value={retentionForm.due_date} onChange={(e) => setRetentionForm((prev) => ({ ...prev, due_date: e.target.value }))} type="date" />
                  </HStack>
                  <Button onClick={createRetention} colorScheme="yellow" loading={loading}>
                    Guardar retención
                  </Button>
                </VStack>
              </Box>

              <Box bg="#0c0d0e" p={3} borderRadius="md">
                <Heading size="sm" mb={3}>Listado de retenciones</Heading>
                <VStack align="stretch" gap={2}>
                  {selectedCompany.retentions?.length ? (
                    selectedCompany.retentions?.map((retention) => (
                      <Box key={retention.id} p={2} borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
                        <HStack justify="space-between" align="center" wrap="wrap">
                          <Text fontWeight="bold">{retention.description}</Text>
                          <Badge colorScheme={retention.status === "pagada" ? "green" : retention.status === "aprobada" ? "blue" : "yellow"}>{retention.status}</Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.400">
                          Monto: {retention.amount ?? 0} · %: {retention.percent ?? 0}%
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Vence: {retention.due_date ? new Date(retention.due_date).toLocaleDateString("es-VE") : "Sin fecha"}
                        </Text>
                      </Box>
                    ))
                  ) : (
                    <Text color="gray.400">No hay retenciones registradas para esta empresa.</Text>
                  )}
                </VStack>
              </Box>
            </VStack>
          ) : (
            <Text color="gray.400">Selecciona una empresa para ver su detalle y retenciones.</Text>
          )}
        </Box>
      </Grid>
    </Box>
  );
}
