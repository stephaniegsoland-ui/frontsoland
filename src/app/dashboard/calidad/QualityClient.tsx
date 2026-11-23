"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Grid, Heading, HStack, Input, Text, Textarea, VStack } from "@chakra-ui/react";
import { ClipboardCheck, Plus, RefreshCw, Search } from "lucide-react";

type QualityRecord = {
  id: string;
  record_type: string;
  title: string;
  description: string;
  area: string | null;
  severity: "Baja" | "Media" | "Alta" | "Crítica";
  status: "Abierta" | "En proceso" | "Cerrada";
  responsible: string | null;
  due_date: string | null;
  created_at: string;
};

const TYPES = ["No conformidad", "Acción correctiva", "Auditoría", "Inspección"];
const STATUSES: QualityRecord["status"][] = ["Abierta", "En proceso", "Cerrada"];
const SEVERITIES: QualityRecord["severity"][] = ["Baja", "Media", "Alta", "Crítica"];

const controlStyles = {
  width: "100%",
  background: "var(--soland-surface-08090a)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "var(--soland-text-primary)",
} as const;

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.detail === "string" ? body.detail : "No se pudo completar la operación.";
}

export default function QualityClient() {
  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quality/records", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      setRecords(await response.json() as QualityRecord[]);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      [record.title, record.description, record.area, record.responsible, record.record_type]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  }, [records, search]);

  const openCount = records.filter((record) => record.status !== "Cerrada").length;
  const criticalCount = records.filter((record) => record.severity === "Crítica" && record.status !== "Cerrada").length;

  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      record_type: String(formData.get("record_type")),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      area: String(formData.get("area") ?? "") || null,
      severity: String(formData.get("severity")),
      responsible: String(formData.get("responsible") ?? "") || null,
      due_date: String(formData.get("due_date") ?? "") || null,
    };

    try {
      const response = await fetch("/api/quality/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await responseError(response));
      form.reset();
      setShowForm(false);
      await loadRecords();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(record: QualityRecord, nextStatus: QualityRecord["status"]) {
    setUpdatingId(record.id);
    setError("");
    try {
      const response = await fetch(`/api/quality/records/${encodeURIComponent(record.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const updated = await response.json() as QualityRecord;
      setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No se pudo actualizar el estado.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Box p={{ base: 4, md: 6 }} color="var(--soland-text-primary)">
      <Flex justify="space-between" align={{ base: "stretch", sm: "center" }} gap={4} direction={{ base: "column", sm: "row" }} mb={5}>
        <Box>
          <HStack gap={2} color="yellow.300" mb={1}>
            <ClipboardCheck size={18} />
            <Text fontSize="sm" fontWeight="bold">SISTEMA DE GESTIÓN</Text>
          </HStack>
          <Heading size="lg">Calidad</Heading>
          <Text color="gray.400" fontSize="sm" mt={1}>No conformidades, auditorías y acciones de mejora.</Text>
        </Box>
        <HStack>
          <Button variant="outline" onClick={() => void loadRecords()} disabled={loading} aria-label="Actualizar registros">
            <RefreshCw size={16} /> Actualizar
          </Button>
          <Button bg="yellow.400" color="black" onClick={() => setShowForm((value) => !value)}>
            <Plus size={17} /> Nuevo registro
          </Button>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }} gap={3} mb={5}>
        {[
          { label: "Registros totales", value: records.length, color: "var(--soland-text-primary)" },
          { label: "Pendientes", value: openCount, color: "orange.300" },
          { label: "Críticos abiertos", value: criticalCount, color: "red.300" },
        ].map((item) => (
          <Flex key={item.label} justify="space-between" align="center" bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" px={4} py={3}>
            <Text color="gray.400" fontSize="xs" fontWeight="bold" textTransform="uppercase">{item.label}</Text>
            <Text fontSize="2xl" fontWeight="bold" color={item.color}>{item.value}</Text>
          </Flex>
        ))}
      </Grid>

      {showForm && (
        <form onSubmit={createRecord}>
        <Box mb={5} p={{ base: 4, md: 5 }} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.200" borderRadius="xl">
          <Heading size="sm" mb={4}>Registrar actividad de calidad</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={3}>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Tipo de registro</Text>
              <select name="record_type" required style={controlStyles}>{TYPES.map((type) => <option key={type}>{type}</option>)}</select>
            </label>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Título</Text>
              <Input name="title" required maxLength={200} placeholder="Ej. Hallazgo en inspección de equipos" />
            </label>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Área / proyecto</Text>
              <Input name="area" maxLength={120} placeholder="Área de trabajo" />
            </label>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Responsable</Text>
              <Input name="responsible" maxLength={120} placeholder="Nombre del responsable" />
            </label>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Prioridad</Text>
              <select name="severity" style={controlStyles}>{SEVERITIES.map((severity) => <option key={severity}>{severity}</option>)}</select>
            </label>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Fecha compromiso</Text>
              <Input name="due_date" type="date" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <Text fontSize="sm" mb={1} color="gray.300">Descripción / acción requerida</Text>
              <Textarea name="description" maxLength={5000} rows={3} placeholder="Describe el hallazgo o la acción a realizar" />
            </label>
          </Grid>
          <HStack mt={4} justify="flex-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" bg="yellow.400" color="black" loading={saving}>Guardar registro</Button>
          </HStack>
        </Box>
        </form>
      )}

      <Flex align="center" gap={2} mb={3} maxW={{ base: "full", md: "420px" }}>
        <Search size={17} color="gray" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, área o responsable" />
      </Flex>

      {error && <Text role="alert" color="red.300" mb={4}>{error}</Text>}
      {loading ? <Text color="gray.400">Cargando registros...</Text> : filteredRecords.length === 0 ? (
        <Box p={8} textAlign="center" bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl">
          <Text color="gray.300" fontWeight="semibold">{search ? "No hay resultados para la búsqueda." : "Todavía no hay registros de calidad."}</Text>
          {!search && <Text color="gray.500" fontSize="sm" mt={1}>Crea un registro para comenzar a dar seguimiento.</Text>}
        </Box>
      ) : (
        <VStack align="stretch" gap={3}>
          {filteredRecords.map((record) => (
            <Box key={record.id} p={4} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl">
              <Flex justify="space-between" align={{ base: "stretch", md: "flex-start" }} gap={3} direction={{ base: "column", md: "row" }}>
                <Box minW={0} flex="1">
                  <HStack gap={2} flexWrap="wrap" mb={1}>
                    <Badge colorPalette={record.severity === "Crítica" || record.severity === "Alta" ? "red" : record.severity === "Media" ? "orange" : "green"}>{record.severity}</Badge>
                    <Badge variant="outline">{record.record_type}</Badge>
                    {record.area && <Text color="gray.500" fontSize="xs">{record.area}</Text>}
                  </HStack>
                  <Text fontWeight="bold">{record.title}</Text>
                  {record.description && <Text color="gray.400" fontSize="sm" mt={1} whiteSpace="pre-wrap">{record.description}</Text>}
                  <Text color="gray.500" fontSize="xs" mt={2}>
                    {record.responsible ? `Responsable: ${record.responsible} · ` : ""}
                    {record.due_date ? `Compromiso: ${new Date(`${record.due_date}T00:00:00`).toLocaleDateString("es-VE")} · ` : ""}
                    Creado: {new Date(record.created_at).toLocaleDateString("es-VE")}
                  </Text>
                </Box>
                <select
                  aria-label={`Estado de ${record.title}`}
                  value={record.status}
                  disabled={updatingId === record.id}
                  onChange={(event) => void changeStatus(record, event.target.value as QualityRecord["status"])}
                  style={{ ...controlStyles, width: "auto", minWidth: "140px", alignSelf: "flex-start" }}
                >
                  {STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
