"use client";
import React, { useState, useEffect } from "react";
import { Box, Button, Input, Image, Text, SimpleGrid, VStack, HStack, Spinner, Link } from "@chakra-ui/react";

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const buildApiUrl = (path: string) => (apiBase ? `${apiBase}${path}` : path);

function SmallBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Box p={2} bg="#0b0b0c" borderRadius="md">
      <VStack align="stretch">
        {data.map((d) => (
          <Box key={d.label}>
            <Text fontSize="sm" color="gray.300">{d.label} — {d.value.toFixed(2)}</Text>
            <Box height="10px" bg="#1f2937" borderRadius="md" overflow="hidden">
              <Box height="10px" bg="#f6c84a" width={`${(d.value / max) * 100}%`} />
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

export default function AdminRetentionClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [rifSearch, setRifSearch] = useState<string>("");
  const [pendingOnly, setPendingOnly] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [manualFields, setManualFields] = useState({
    supplier_name: "",
    supplier_address: "",
    rif: "",
    total_amount: "",
    retention_amount: "",
    retention_percent: "",
  });
  const [newCompany, setNewCompany] = useState({
    name: "",
    rif: "",
    address: "",
    default_retention_percent: "",
  });

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
  }, []);

  const fetchInvoices = async (rif?: string, pending?: boolean) => {
    try {
      const url = new URL(buildApiUrl(`/api/admin/invoices`), window.location.href);
      if (rif) url.searchParams.set("rif", rif);
      if (pending) url.searchParams.set("status", "pending");
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Error fetching invoices");
      const data = await res.json();
      setInvoices(data || []);
    } catch (e) {
      console.error(e);
      setMessage("No se pudo cargar las facturas.");
    }
  };

  const handleSearchByRif = async () => {
    setMessage(null);
    await fetchInvoices(rifSearch.trim(), pendingOnly);
  };

  const handleTogglePending = async () => {
    setPendingOnly((current) => !current);
    await fetchInvoices(rifSearch.trim(), !pendingOnly);
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(buildApiUrl(`/api/admin/companies`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error fetching companies");
      const data = await res.json();
      setCompanies(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const createCompany = async () => {
    if (!newCompany.name || !newCompany.rif) {
      setMessage("Nombre y RIF son obligatorios para guardar una empresa.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: newCompany.name.trim(),
        rif: newCompany.rif.trim().toUpperCase(),
        address: newCompany.address.trim() || undefined,
        default_retention_percent: newCompany.default_retention_percent
          ? Number(newCompany.default_retention_percent)
          : undefined,
      };
      const res = await fetch(buildApiUrl(`/api/admin/companies`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error creando empresa");
      }
      const created = await res.json();
      setMessage("Empresa guardada correctamente.");
      setNewCompany({ name: "", rif: "", address: "", default_retention_percent: "" });
      await fetchCompanies();
      setSelectedCompanyId(created.id);
    } catch (error) {
      console.error(error);
      setMessage("No se pudo guardar la empresa.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const company = companies.find((item) => item.id === companyId);
    if (!company) return;
    setManualFields((prev) => ({
      ...prev,
      supplier_name: company.name || prev.supplier_name,
      rif: company.rif || prev.rif,
      supplier_address: company.address || prev.supplier_address,
      retention_percent:
        company.default_retention_percent != null
          ? String(company.default_retention_percent)
          : prev.retention_percent,
    }));
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Selecciona una imagen de factura primero.");
      return;
    }
    setMessage(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(buildApiUrl(`/api/admin/invoices/upload`), {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        setMessage(`Error al subir factura: ${res.status} ${txt}`);
        setLoading(false);
        return;
      }
      const invoice = await res.json();
      setMessage("Factura procesada correctamente.");
      setFile(null);
      setPreview(null);
      // if the uploaded invoice RIF matches a saved company, select it
      let matchedCompanyId = null;
      if (invoice.rif && companies.length) {
        const matched = companies.find((c) => (c.rif || "").toUpperCase() === (invoice.rif || "").toUpperCase());
        if (matched) matchedCompanyId = matched.id;
      }
      setSelectedCompanyId(matchedCompanyId);
      setSelectedInvoice({ ...invoice, company_id: matchedCompanyId });
      setManualFields({
        supplier_name: invoice.supplier_name || "",
        supplier_address: invoice.supplier_address || "",
        rif: invoice.rif || "",
        total_amount: invoice.total_amount != null ? String(invoice.total_amount) : "",
        retention_amount: invoice.retention_amount != null ? String(invoice.retention_amount) : "",
        retention_percent: invoice.retention_percent != null ? String(invoice.retention_percent) : "",
      });
      setInvoices((prev) => [invoice, ...prev]);
    } catch (error) {
      console.error(error);
      setMessage("Error al procesar la factura.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCollected = async (id: string, value: boolean) => {
    try {
      const fd = new FormData();
      fd.append("collected", String(value));
      const res = await fetch(buildApiUrl(`/api/admin/invoices/${id}/status`), {
        method: "PATCH",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error actualizando estatus");
      const updated = await res.json();
      setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedInvoice?.id === updated.id) {
        setSelectedInvoice(updated);
      }
    } catch (e) {
      console.error(e);
      setMessage("No se pudo actualizar el estado de retención.");
    }
  };

  const saveInvoiceDetails = async () => {
    if (!selectedInvoice) {
      setMessage("Selecciona primero una factura para guardar los cambios.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("supplier_name", manualFields.supplier_name);
      fd.append("supplier_address", manualFields.supplier_address);
      fd.append("rif", manualFields.rif);
      fd.append("total_amount", manualFields.total_amount);
      fd.append("retention_amount", manualFields.retention_amount);
      fd.append("retention_percent", manualFields.retention_percent);
      if (selectedCompanyId) {
        fd.append("company_id", selectedCompanyId);
      }
      const res = await fetch(buildApiUrl(`/api/admin/invoices/${selectedInvoice.id}/status`), {
        method: "PATCH",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error guardando detalles");
      }
      const updated = await res.json();
      setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedInvoice(updated);
      setMessage("Detalles guardados correctamente.");
    } catch (error) {
      console.error(error);
      setMessage("Error al guardar los detalles de la factura.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setSelectedCompanyId(invoice.company_id || null);
    setManualFields({
      supplier_name: invoice.supplier_name || "",
      supplier_address: invoice.supplier_address || "",
      rif: invoice.rif || "",
      total_amount: invoice.total_amount != null ? String(invoice.total_amount) : "",
      retention_amount: invoice.retention_amount != null ? String(invoice.retention_amount) : "",
      retention_percent: invoice.retention_percent != null ? String(invoice.retention_percent) : "",
    });
    setMessage(null);
  };

  const handleManualFieldChange = (field: string, value: string) => {
    setManualFields((prev) => ({ ...prev, [field]: value }));
  };

  const chartData = () => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      const key = inv.rif || "Sin RIF";
      const val = inv.retention_amount || 0;
      map.set(key, (map.get(key) || 0) + val);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const totalRetention = invoices.reduce((sum, inv) => sum + (inv.retention_amount || 0), 0);
  const rifTotals = invoices.reduce((map, inv) => {
    const key = inv.rif || "Sin RIF";
    map.set(key, (map.get(key) || 0) + (inv.retention_amount || 0));
    return map;
  }, new Map<string, number>());
  const rifTotalsArray = Array.from(rifTotals.entries()) as [string, number][];

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Text fontSize="2xl" mb={4} color="yellow.300">Administración de Facturas y Retenciones</Text>

      <Box bg="#0f0f10" p={5} borderRadius="2xl" mb={6}>
        <Text fontSize="lg" mb={3} color="gray.200">Escanea una factura, deja que el sistema capture el RIF y la retención, y gestiona el cobro automáticamente.</Text>
        <HStack gap={3} flexWrap="wrap" mb={4}>
          <Input
            placeholder="Buscar por RIF"
            value={rifSearch}
            onChange={(event) => setRifSearch(event.target.value.toUpperCase())}
            bg="#0b0b0f"
            color="white"
          />
          <Button colorScheme="yellow" onClick={handleSearchByRif}>
            Buscar RIF
          </Button>
          <Button variant="outline" onClick={() => { setRifSearch(""); setPendingOnly(false); fetchInvoices(); }}>
            Mostrar todos
          </Button>
          <Button colorScheme={pendingOnly ? "green" : "gray"} onClick={handleTogglePending}>
            {pendingOnly ? "Ver todos" : "Solo pendientes"}
          </Button>
        </HStack>
        {rifSearch.trim() && (
          <Text fontSize="sm" mb={3} color="gray.300">
            Mostrando resultados para RIF: <Text as="span" fontWeight="bold" color="yellow.200">{rifSearch.trim()}</Text>
          </Text>
        )}
        <HStack gap={4} flexWrap="wrap" mb={3}>
          <Text fontSize="sm" color="gray.300">
            Retención total mostrada: <Text as="span" fontWeight="bold" color="yellow.200">{totalRetention.toFixed(2)}</Text>
          </Text>
          <Text fontSize="sm" color="gray.300">
            Facturas listadas: <Text as="span" fontWeight="bold" color="yellow.200">{invoices.length}</Text>
          </Text>
        </HStack>
        <Box mb={4} p={3} bg="#111318" borderRadius="xl">
          <Text fontSize="sm" fontWeight="bold" mb={2} color="yellow.300">Totales por RIF</Text>
          {rifTotalsArray.map(([rif, amount]) => (
            <Text key={rif} fontSize="sm" color="gray.300">
              {rif}: <Text as="span" fontWeight="bold" color="yellow.200">{amount.toFixed(2)}</Text>
            </Text>
          ))}
        </Box>
        <HStack gap={3} flexWrap="wrap">
          <Button as="label" bg="#1f2937" _hover={{ bg: "#374151" }}>
            Seleccionar factura
            <Input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setFile(file);
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </Button>
          <Button colorScheme="green" onClick={handleUpload} loading={loading}>
            Subir y extraer datos
          </Button>
        </HStack>

        <Box mt={6} p={4} bg="#111318" borderRadius="2xl" border="1px solid rgba(255,255,255,0.08)">
          <Text fontSize="md" fontWeight="bold" mb={3} color="yellow.300">Buscar RIF en SENIAT</Text>
          <Text fontSize="sm" color="gray.300" mb={3}>
            Usa el buscador oficial sin salir de la aplicación. Si el sitio no carga dentro del panel, abre el enlace en una nueva pestaña y copia el RIF manualmente.
          </Text>
          <Box mb={3} borderRadius="xl" overflow="hidden" border="1px solid rgba(255,255,255,0.08)">
            <iframe
              title="Buscador de RIF SENIAT"
              src="https://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp"
              style={{ width: "100%", minHeight: 420, border: "none", background: "white" }}
            />
          </Box>
          <Text fontSize="xs" color="gray.500" mb={2}>
            Nota: algunos sitios no permiten cargarse dentro de un iframe. Si el panel aparece en blanco, usa el botón para abrir el buscador directamente.
          </Text>
          <Link href="https://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp" target="_blank" rel="noreferrer" _hover={{ textDecoration: "none" }}>
            <Button colorScheme="yellow" variant="solid">
              Abrir buscador en nueva pestaña
            </Button>
          </Link>
        </Box>

        {message && <Text mt={3} color="yellow.200">{message}</Text>}
        {preview && <Image src={preview} alt="Factura seleccionada" mt={4} boxSize="240px" objectFit="contain" borderRadius="xl" />}
      </Box>

      <Box bg="#111318" p={5} borderRadius="2xl" mb={6} border="1px solid rgba(255,255,255,0.08)">
        <Text fontSize="md" fontWeight="bold" mb={4} color="yellow.300">Facturas cargadas</Text>
        {invoices.length === 0 ? (
          <Text color="gray.500">No hay facturas registradas todavía. Sube una factura para ver los detalles aquí.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {invoices.map((inv) => (
              <Box
                key={inv.id}
                bg={selectedInvoice?.id === inv.id ? "rgba(246, 200, 74, 0.15)" : "#0b0b0f"}
                borderRadius="xl"
                border={`1px solid ${selectedInvoice?.id === inv.id ? "#f6c84a" : "rgba(255,255,255,0.08)"}`}
                p={4}
                cursor="pointer"
                onClick={() => handleSelectInvoice(inv)}
              >
                <HStack justify="space-between" align="start">
                      <VStack align="start" gap={1}>
                        <Text fontWeight="bold">{inv.supplier_name || inv.rif || "Proveedor desconocido"}</Text>
                        {inv.company_id ? (
                          <Text color="gray.400" fontSize="sm">
                            Empresa: {(companies.find((c) => c.id === inv.company_id)?.name) || inv.supplier_name}
                          </Text>
                        ) : null}
                        {inv.supplier_address ? <Text color="gray.300" fontSize="sm">{inv.supplier_address}</Text> : null}
                        <Text color="gray.300" fontSize="sm">RIF: {inv.rif || "No detectado"}</Text>
                        <Text color="gray.300" fontSize="sm">Total: {inv.total_amount != null ? inv.total_amount : "N/A"}</Text>
                        <Text color="gray.300" fontSize="sm">Retención: {inv.retention_amount != null ? inv.retention_amount : "N/A"}</Text>
                        <Text color="gray.300" fontSize="sm">Estado: {inv.retention_status || "pending"}</Text>
                      </VStack>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#f6c84a" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(inv.collected)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleCollected(inv.id, e.target.checked);
                      }}
                      style={{ width: 18, height: 18 }}
                    />
                    Cobrado
                  </label>
                </HStack>
                {inv.image_url && <Image src={inv.image_url} alt="Factura" mt={3} borderRadius="xl" boxSize="160px" objectFit="cover" />}
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={6}>
        <Box bg="#0f0f10" p={5} borderRadius="2xl">
          <Text fontSize="md" fontWeight="bold" mb={3} color="yellow.300">Retenciones acumuladas</Text>
          <SmallBarChart data={chartData()} />
        </Box>

        <Box bg="#0f0f10" p={5} borderRadius="2xl">
          <Text fontSize="md" fontWeight="bold" mb={3} color="yellow.300">Factura seleccionada</Text>
          <Text color="gray.300" mb={3}>Puedes corregir los datos detectados y guardar manualmente la información si la extracción no fue precisa. Selecciona una empresa guardada para cargar RIF y datos rápidamente.</Text>
          {!selectedInvoice ? (
            <Text color="gray.500">Selecciona una factura de la lista para editar sus datos.</Text>
          ) : (
            <VStack align="stretch" gap={4}>
              <Box bg="#111318" p={4} borderRadius="xl" border="1px solid rgba(255,255,255,0.08)">
                <Text fontWeight="bold" mb={3} color="yellow.300">Empresa guardada</Text>
                <VStack align="stretch" gap={3} mb={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Seleccionar empresa</Text>
                    <select
                      value={selectedCompanyId || ""}
                      onChange={(e) => handleSelectCompany(e.target.value)}
                      style={{ background: "#0b0b0f", color: "white", padding: "8px", borderRadius: 6 }}
                    >
                      <option value="">-- Ninguna --</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name} — {company.rif}
                        </option>
                      ))}
                    </select>
                  </Box>
                  <Text fontSize="sm" color="gray.400">Si la empresa no está en la lista, agrégala abajo para usarla en futuras retenciones.</Text>
                </VStack>
                <Text fontWeight="bold" mb={3} color="yellow.300">Detalles de factura</Text>
                <VStack align="stretch" gap={3}>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Proveedor / Razón social</Text>
                    <Input
                      value={manualFields.supplier_name}
                      onChange={(e) => handleManualFieldChange("supplier_name", e.target.value)}
                      bg="#0b0b0f"
                      color="white"
                      placeholder="Nombre del proveedor"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Dirección</Text>
                    <Input
                      value={manualFields.supplier_address}
                      onChange={(e) => handleManualFieldChange("supplier_address", e.target.value)}
                      bg="#0b0b0f"
                      color="white"
                      placeholder="Dirección del proveedor"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>RIF</Text>
                    <Input
                      value={manualFields.rif}
                      onChange={(e) => handleManualFieldChange("rif", e.target.value.toUpperCase())}
                      bg="#0b0b0f"
                      color="white"
                      placeholder="J-12345678-9"
                    />
                  </Box>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>Monto total</Text>
                      <Input
                        value={manualFields.total_amount}
                        onChange={(e) => handleManualFieldChange("total_amount", e.target.value)}
                        bg="#0b0b0f"
                        color="white"
                        placeholder="0.00"
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>Retención</Text>
                      <Input
                        value={manualFields.retention_amount}
                        onChange={(e) => handleManualFieldChange("retention_amount", e.target.value)}
                        bg="#0b0b0f"
                        color="white"
                        placeholder="0.00"
                      />
                    </Box>
                  </SimpleGrid>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Porcentaje de retención</Text>
                    <Input
                      value={manualFields.retention_percent}
                      onChange={(e) => handleManualFieldChange("retention_percent", e.target.value)}
                      bg="#0b0b0f"
                      color="white"
                      placeholder="0.00"
                    />
                  </Box>
                  <Button colorScheme="yellow" onClick={saveInvoiceDetails} loading={loading}>
                    Guardar datos manuales
                  </Button>
                </VStack>
              </Box>

              {/* Formulario para agregar empresa guardada */}
              <Box bg="#111318" p={4} borderRadius="xl" border="1px solid rgba(255,255,255,0.06)">
                <Text fontWeight="bold" mb={3} color="yellow.300">Agregar empresa</Text>
                <VStack align="stretch" gap={3}>
                  <Input
                    placeholder="Nombre de la empresa"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany((s) => ({ ...s, name: e.target.value }))}
                    bg="#0b0b0f"
                    color="white"
                  />
                  <Input
                    placeholder="RIF (J-12345678-9)"
                    value={newCompany.rif}
                    onChange={(e) => setNewCompany((s) => ({ ...s, rif: e.target.value.toUpperCase() }))}
                    bg="#0b0b0f"
                    color="white"
                  />
                  <Input
                    placeholder="Dirección (opcional)"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany((s) => ({ ...s, address: e.target.value }))}
                    bg="#0b0b0f"
                    color="white"
                  />
                  <Input
                    placeholder="% retención por defecto (opcional)"
                    value={newCompany.default_retention_percent}
                    onChange={(e) => setNewCompany((s) => ({ ...s, default_retention_percent: e.target.value }))}
                    bg="#0b0b0f"
                    color="white"
                  />
                  <HStack>
                    <Button colorScheme="green" onClick={createCompany} loading={loading}>
                      Guardar empresa
                    </Button>
                    <Button variant="ghost" onClick={() => setNewCompany({ name: "", rif: "", address: "", default_retention_percent: "" })}>
                      Limpiar
                    </Button>
                  </HStack>
                </VStack>
              </Box>

            </VStack>
          )}
        </Box>
      </SimpleGrid>
    </Box>
  );
}
