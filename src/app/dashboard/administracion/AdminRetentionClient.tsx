"use client";
import React, { useState, useEffect } from "react";
import { Box, Button, Input, Image, Text, SimpleGrid, VStack, HStack, Grid, Flex, Spinner, Link } from "@chakra-ui/react";

type InvoiceRow = {
  id: string;
  company_id?: string | null;
  supplier_name?: string;
  supplier_address?: string;
  rif?: string;
  total_amount?: number | string;
  taxable_base?: number | string;
  iva_amount?: number | string;
  retention_amount?: number | string;
  retention_percent?: number | string;
  collected?: boolean;
  retention_status?: string;
  image_url?: string;
};

const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const parseNumericValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const cleaned = String(value).trim().replace(/\s+/g, "");
  if (!cleaned) return 0;

  const normalized = cleaned
    .replace(/\u00A0/g, "")
    .replace(/[^0-9,.-]/g, "");

  if (!normalized || normalized === "." || normalized === "," || normalized === "-" || normalized === "--") return 0;

  if (normalized.includes(",") && normalized.includes(".")) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    const withoutThousands = normalized.replace(new RegExp(`\\${thousandsSeparator}`, "g"), "");
    return Number(withoutThousands.replace(decimalSeparator, "."));
  }

  if (normalized.includes(",") && !normalized.includes(".")) {
    const parts = normalized.split(",");
    if (parts.length > 2) {
      return Number(parts.join("."));
    }
    const [integerPart, decimalPart] = parts;
    const decimalDigits = decimalPart?.length ?? 0;
    if (decimalDigits <= 2) return Number(`${integerPart}.${decimalPart}`);
    return Number(integerPart.replace(/\./g, ""));
  }

  return Number(normalized);
};

const buildApiUrl = (path: string) => path.startsWith("/static/") ? `${backendUrl}${path}` : path;

export default function AdminRetentionClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [collectedInvoices, setCollectedInvoices] = useState<InvoiceRow[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; rif?: string; name?: string; address?: string; default_retention_percent?: number | string; }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [rifSearch, setRifSearch] = useState<string>("");
  const [pendingOnly, setPendingOnly] = useState<boolean>(false);
  const [collectedOnly, setCollectedOnly] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [manualFields, setManualFields] = useState({
    supplier_name: "",
    supplier_address: "",
    rif: "",
    total_amount: "",
    taxable_base: "",
    iva_amount: "",
    retention_amount: "",
    retention_percent: "",
  });
  const [newCompany, setNewCompany] = useState({
    name: "",
    rif: "",
    address: "",
    default_retention_percent: "",
  });
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null);

  const fetchInvoices = async (rif?: string, pending?: boolean, collected?: boolean) => {
    try {
      const url = new URL("/api/admin/invoices", window.location.origin);
      if (rif) url.searchParams.set("rif", rif);
      if (pending) url.searchParams.set("status", "pending");
      if (collected) url.searchParams.set("status", "collected");
      const res = await fetch(url.toString(), {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setMessage("Tu sesión ha expirado. Inicia sesión nuevamente.");
          setInvoices([]);
          return;
        }
        const text = await res.text().catch(() => "");
        console.warn("Error fetching invoices:", res.status, text);
        setMessage("No se pudo cargar las facturas.");
        setInvoices([]);
        return;
      }

      const data = await res.json();
      setInvoices(data || []);
    } catch (e) {
      console.error(e);
      setMessage("No se pudo cargar las facturas.");
      setInvoices([]);
    }
  };

  const fetchCollectedInvoices = async (rif?: string) => {
    try {
      const url = new URL("/api/admin/invoices", window.location.origin);
      url.searchParams.set("status", "collected");
      if (rif) url.searchParams.set("rif", rif);
      const res = await fetch(url.toString(), {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setMessage("Tu sesión ha expirado. Inicia sesión nuevamente.");
          setCollectedInvoices([]);
          return;
        }
        const text = await res.text().catch(() => "");
        console.warn("Error fetching collected invoices:", res.status, text);
        setCollectedInvoices([]);
        return;
      }

      const data = await res.json();
      setCollectedInvoices(data || []);
    } catch (e) {
      console.error(e);
      setCollectedInvoices([]);
    }
  };

  const handleSearchByRif = async () => {
    setMessage(null);
    if (collectedOnly) {
      await fetchCollectedInvoices(rifSearch.trim());
      return;
    }
    await fetchInvoices(rifSearch.trim(), true);
  };

  const handleTogglePending = async () => {
    setPendingOnly((current) => !current);
    setCollectedOnly(false);
    await fetchInvoices(rifSearch.trim(), true, false);
  };

  const handleToggleCollected = async () => {
    setCollectedOnly((current) => !current);
    setPendingOnly(false);
    if (!collectedOnly) {
      await fetchCollectedInvoices(rifSearch.trim());
    } else {
      await fetchInvoices(rifSearch.trim(), true, false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setMessage("Tu sesión ha expirado. Inicia sesión nuevamente.");
          setCompanies([]);
          return;
        }
        const text = await res.text().catch(() => "");
        console.warn("Error fetching companies:", res.status, text);
        setCompanies([]);
        return;
      }

      const data = await res.json();
      setCompanies(data || []);
    } catch (e) {
      console.error(e);
      setCompanies([]);
    }
  };

  useEffect(() => {
    void fetchInvoices(undefined, true);
    void fetchCollectedInvoices();
    void fetchCompanies();
  }, []);

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
        headers: {
          "Content-Type": "application/json",
        },
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
      setCompanyDialogOpen(false);
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
        cache: "no-store",
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
      setEditorDialogOpen(true);
      const computedRetention = getComputedRetention(invoice);
      const normalizedInvoice = {
        ...invoice,
        retention_amount: computedRetention,
      };

      setManualFields({
        supplier_name: normalizedInvoice.supplier_name || "",
        supplier_address: normalizedInvoice.supplier_address || "",
        rif: normalizedInvoice.rif || "",
        total_amount: normalizedInvoice.total_amount != null ? String(normalizedInvoice.total_amount) : "",
        taxable_base: normalizedInvoice.taxable_base != null ? String(normalizedInvoice.taxable_base) : "",
        iva_amount: normalizedInvoice.iva_amount != null ? String(normalizedInvoice.iva_amount) : "",
        retention_amount: normalizedInvoice.retention_amount != null ? String(normalizedInvoice.retention_amount) : "",
        retention_percent: normalizedInvoice.retention_percent != null ? String(normalizedInvoice.retention_percent) : "",
      });
      setInvoices((prev) => [normalizedInvoice, ...prev]);
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
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error actualizando estatus");
      const updated = await res.json();
      if (value) {
        setInvoices((prev) => prev.filter((item) => item.id !== updated.id));
        setCollectedInvoices((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      } else {
        setCollectedInvoices((prev) => prev.filter((item) => item.id !== updated.id));
        setInvoices((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
      }
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
      const total = parseNumericValue(manualFields.total_amount);
      const iva = parseNumericValue(manualFields.iva_amount);
      const retentionPercent = parseNumericValue(manualFields.retention_percent);
      const explicitRetention = parseNumericValue(manualFields.retention_amount);
      const taxableBase = parseNumericValue(
        manualFields.taxable_base ||
        (total > 0 && iva > 0 ? String(total - iva) : manualFields.total_amount || "0")
      );
      const computedRetention = explicitRetention > 0
        ? explicitRetention
        : (iva > 0 && retentionPercent > 0 ? iva * (retentionPercent / 100) : 0);

      const fd = new FormData();
      fd.append("supplier_name", manualFields.supplier_name);
      fd.append("supplier_address", manualFields.supplier_address);
      fd.append("rif", manualFields.rif);
      fd.append("total_amount", String(total || 0));
      fd.append("taxable_base", String(taxableBase || 0));
      fd.append("iva_amount", String(iva || 0));
      fd.append("retention_amount", String(computedRetention));
      fd.append("retention_percent", String(retentionPercent));
      if (selectedCompanyId) {
        fd.append("company_id", selectedCompanyId);
      }
      const res = await fetch(buildApiUrl(`/api/admin/invoices/${selectedInvoice.id}/status`), {
        method: "PATCH",
        body: fd,
        credentials: "include",
        cache: "no-store",
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

  const handleSelectInvoice = (invoice: InvoiceRow) => {
    setSelectedInvoice(invoice);
    setEditorDialogOpen(true);
    setSelectedCompanyId(invoice.company_id || null);
    setManualFields({
      supplier_name: invoice.supplier_name || "",
      supplier_address: invoice.supplier_address || "",
      rif: invoice.rif || "",
      total_amount: invoice.total_amount != null ? String(invoice.total_amount) : "",
      taxable_base: invoice.taxable_base != null ? String(invoice.taxable_base) : "",
      iva_amount: invoice.iva_amount != null ? String(invoice.iva_amount) : "",
      retention_amount: invoice.retention_amount != null ? String(invoice.retention_amount) : "",
      retention_percent: invoice.retention_percent != null ? String(invoice.retention_percent) : "",
    });
    setMessage(null);
  };

  const handleManualFieldChange = (field: string, value: string) => {
    setManualFields((prev) => ({ ...prev, [field]: value }));
  };

  const formatMoney = (value: number) => Number(value).toFixed(2);

  const getAmountToCancel = (fields = manualFields) => {
    const total = parseNumericValue(fields.total_amount);
    const iva = parseNumericValue(fields.iva_amount);
    const retentionPercent = parseNumericValue(fields.retention_percent);
    const explicitRetention = parseNumericValue(fields.retention_amount);
    const taxableBase = parseNumericValue(
      fields.taxable_base ||
      (total > 0 && iva > 0 ? String(total - iva) : fields.total_amount || "0")
    );

    const retention = explicitRetention > 0
      ? explicitRetention
      : (iva > 0 && retentionPercent > 0 ? iva * (retentionPercent / 100) : 0);

    return Number((taxableBase + (iva - retention)).toFixed(2));
  };

  const getAutoRetention = (fields = manualFields) => {
    const iva = parseNumericValue(fields.iva_amount);
    const retentionPercent = parseNumericValue(fields.retention_percent);
    if (iva <= 0 || retentionPercent <= 0) return 0;
    return Number((iva * (retentionPercent / 100)).toFixed(2));
  };

  const getComputedRetention = (invoice: Partial<InvoiceRow>) => {
    const total = parseNumericValue(invoice?.total_amount ?? 0);
    const iva = parseNumericValue(invoice?.iva_amount ?? 0);
    const pct = parseNumericValue(invoice?.retention_percent ?? 0);
    const explicit = parseNumericValue(invoice?.retention_amount ?? 0);
    if (explicit > 0) return explicit;
    if (iva > 0 && pct > 0) return iva * (pct / 100);
    if (total > 0 && pct > 0) return total * (pct / 100);
    return 0;
  };

  const totalRetention = invoices.reduce((sum, inv) => sum + getComputedRetention(inv), 0);
  const collectedRetention = collectedInvoices.reduce((sum, inv) => sum + getComputedRetention(inv), 0);
  const totalInvoiceCount = invoices.length + collectedInvoices.length;
  const collectedShare = totalInvoiceCount > 0 ? (collectedInvoices.length / totalInvoiceCount) * 100 : 0;
  const rifTotals = invoices.reduce((map, inv) => {
    const key = inv.rif || "Sin RIF";
    map.set(key, (map.get(key) || 0) + parseNumericValue(inv.retention_amount));
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
          <Button variant="outline" onClick={() => { setRifSearch(""); setPendingOnly(true); setCollectedOnly(false); fetchInvoices(undefined, true); }}>
            Mostrar todos
          </Button>
          <Button colorScheme={pendingOnly ? "green" : "gray"} onClick={handleTogglePending}>
            {pendingOnly ? "Pendientes" : "Ver pendientes"}
          </Button>
          <Button colorScheme={collectedOnly ? "blue" : "gray"} onClick={handleToggleCollected}>
            {collectedOnly ? "Cobradas" : "Ver cobradas"}
          </Button>
        </HStack>
        {rifSearch.trim() && (
          <Text fontSize="sm" mb={3} color="gray.300">
            Mostrando resultados para RIF: <Text as="span" fontWeight="bold" color="yellow.200">{rifSearch.trim()}</Text>
          </Text>
        )}
        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={3} mb={4}>
          {[
            { label: "Retención pendiente", value: `Bs. ${totalRetention.toFixed(2)}`, color: "yellow.200" },
            { label: "Facturas pendientes", value: invoices.length, color: "orange.200" },
            { label: "Retención cobrada", value: `Bs. ${collectedRetention.toFixed(2)}`, color: "green.200" },
            { label: "Facturas cobradas", value: collectedInvoices.length, color: "blue.200" },
          ].map((card) => (
            <Box key={card.label} bg="#0b0b0f" p={3} borderRadius="lg" border="1px solid rgba(255,255,255,0.08)">
              <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">{card.label}</Text>
              <Text fontSize="xl" fontWeight="bold" color={card.color} mt={1}>{card.value}</Text>
            </Box>
          ))}
        </SimpleGrid>
        <Box mb={4} p={3} bg="#111318" borderRadius="xl" border="1px solid rgba(255,255,255,0.06)">
          <Flex justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.300">Estado de facturas</Text>
            <Text fontSize="sm" color="gray.400">{Math.round(collectedShare)}% cobradas</Text>
          </Flex>
          <Box height="8px" bg="rgba(246, 200, 74, 0.18)" borderRadius="full" overflow="hidden">
            <Box height="100%" width={`${collectedShare}%`} bg="#34d399" borderRadius="full" transition="width 0.3s ease" />
          </Box>
        </Box>
        <Box mb={4} p={3} bg="#111318" borderRadius="xl">
          <Text fontSize="sm" fontWeight="bold" mb={2} color="yellow.300">Totales por RIF</Text>
          {rifTotalsArray.length === 0 ? (
            <Text fontSize="sm" color="gray.500">Sin retenciones pendientes para mostrar.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={2}>
              {rifTotalsArray.map(([rif, amount]) => (
                <Box key={rif} bg="#0b0b0f" p={2} borderRadius="md">
                  <Text fontSize="xs" color="gray.500">{rif}</Text>
                  <Text fontSize="sm" fontWeight="bold" color="yellow.200">Bs. {amount.toFixed(2)}</Text>
                </Box>
              ))}
            </SimpleGrid>
          )}
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

        {message && <Text mt={3} color="yellow.200">{message}</Text>}
        {selectedInvoice && (
          <Grid templateColumns={{ base: "1fr", lg: "minmax(260px, 0.8fr) minmax(320px, 1.2fr)" }} gap={5} mt={5} alignItems="stretch">
            <Box bg="#0b0b0f" p={4} borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
              <Text fontSize="sm" fontWeight="bold" color="gray.400" mb={3}>Factura cargada</Text>
              {preview || selectedInvoice.image_url ? (
                <Image
                  src={preview || buildApiUrl(selectedInvoice.image_url || "")}
                  alt="Factura seleccionada"
                  width="100%"
                  height="280px"
                  objectFit="contain"
                  borderRadius="lg"
                  bg="#050506"
                />
              ) : (
                <Text color="gray.500">No hay imagen disponible.</Text>
              )}
            </Box>
            <Box bg="#0b0b0f" p={4} borderRadius="xl" border="1px solid rgba(246, 200, 74, 0.25)">
              <Text fontSize="sm" fontWeight="bold" color="yellow.300" mb={3}>Datos extraídos</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                <Box><Text fontSize="xs" color="gray.500">Proveedor</Text><Text fontWeight="semibold">{manualFields.supplier_name || "No identificado"}</Text></Box>
                <Box><Text fontSize="xs" color="gray.500">RIF</Text><Text fontWeight="semibold">{manualFields.rif || "No detectado"}</Text></Box>
                <Box><Text fontSize="xs" color="gray.500">Monto total</Text><Text color="gray.200">Bs. {manualFields.total_amount || "0.00"}</Text></Box>
                <Box><Text fontSize="xs" color="gray.500">Base imponible</Text><Text color="gray.200">Bs. {manualFields.taxable_base || "0.00"}</Text></Box>
                <Box><Text fontSize="xs" color="gray.500">IVA</Text><Text color="gray.200">Bs. {manualFields.iva_amount || "0.00"}</Text></Box>
                <Box><Text fontSize="xs" color="gray.500">Retención</Text><Text color="yellow.200" fontWeight="bold">Bs. {manualFields.retention_amount || "0.00"}</Text></Box>
              </SimpleGrid>
              <Text fontSize="sm" color="gray.400" mt={4}>Puedes corregir los datos extraídos desde el editor.</Text>
              <Button colorScheme="yellow" onClick={() => setEditorDialogOpen(true)}>
                Abrir editor de factura
              </Button>
            </Box>
          </Grid>
        )}
      </Box>

      <Box mb={6}>
        <Box bg="#111318" p={5} borderRadius="2xl" border="1px solid rgba(255,255,255,0.08)">
          <Text fontSize="md" fontWeight="bold" mb={4} color="yellow.300">Facturas pendientes</Text>
          {invoices.length === 0 ? (
          <Text color="gray.500">No hay facturas registradas todavía. Sube una factura para ver los detalles aquí.</Text>
          ) : (
            <Box overflowX="auto">
              <Box as="table" width="100%" minWidth="760px" borderCollapse="collapse">
                <Box as="thead" bg="#0b0b0f">
                  <Box as="tr">
                    {["Proveedor", "RIF", "Total", "Retención", "Estado", "Acción"].map((heading) => (
                      <Box as="th" key={heading} textAlign="left" p={3} color="gray.400" fontSize="sm" fontWeight="semibold" borderBottom="1px solid rgba(255,255,255,0.1)">
                        {heading}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {invoices.map((inv) => (
                    <Box
                      as="tr"
                      key={inv.id}
                      bg={selectedInvoice?.id === inv.id ? "rgba(246, 200, 74, 0.12)" : "transparent"}
                      cursor="pointer"
                      onClick={() => handleSelectInvoice(inv)}
                    >
                      <Box as="td" p={3} color="white" fontWeight="bold">{inv.supplier_name || inv.rif || "Proveedor desconocido"}</Box>
                      <Box as="td" p={3} color="gray.300">{inv.rif || "No detectado"}</Box>
                      <Box as="td" p={3} color="gray.200">Bs. {Number(inv.total_amount || 0).toFixed(2)}</Box>
                      <Box as="td" p={3} color="yellow.200" fontWeight="bold">Bs. {getComputedRetention(inv).toFixed(2)}</Box>
                      <Box as="td" p={3} color="orange.300">Pendiente</Box>
                      <Box as="td" p={3}>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleCollected(inv.id, true);
                          }}
                        >
                          Cobrar
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

      </Box>

      {editorDialogOpen && (
        <Box position="fixed" inset={0} zIndex={29} bg="rgba(0, 0, 0, 0.72)" />
      )}

      {editorDialogOpen && (
        <Box
          id="invoice-editor"
          bg="#0f0f10"
          p={5}
          borderRadius="2xl"
          position="fixed"
          top="4vh"
          left="50%"
          transform="translateX(-50%)"
          width="min(920px, calc(100vw - 32px))"
          maxHeight="92vh"
          overflowY="auto"
          zIndex={30}
          border="1px solid rgba(246, 200, 74, 0.45)"
          boxShadow="0 24px 80px rgba(0,0,0,0.55)"
        >
          <HStack justify="space-between" mb={3}>
            <Text fontSize="md" fontWeight="bold" color="yellow.300">Editor de factura</Text>
            {editorDialogOpen && (
              <Button size="sm" variant="ghost" onClick={() => setEditorDialogOpen(false)}>
                Cerrar
              </Button>
            )}
          </HStack>
          <Text color="gray.300" mb={3}>Puedes corregir los datos detectados y guardar manualmente la información si la extracción no fue precisa. Selecciona una empresa guardada para cargar RIF y datos rápidamente.</Text>
          {!selectedInvoice ? (
            <Text color="gray.500">Selecciona una factura de la lista para editar sus datos.</Text>
          ) : (
            <VStack align="stretch" gap={4}>
              <Box bg="#111318" p={4} borderRadius="xl" border="1px solid rgba(255,255,255,0.08)">
                <Text fontWeight="bold" mb={3} color="yellow.300">Empresa guardada</Text>
                <Box mb={3} p={3} bg="#0b0b0f" borderRadius="lg">
                  <Text fontSize="sm" color="gray.400">Retención calculada</Text>
                  <Text fontSize="lg" fontWeight="bold" color="yellow.200">
                    {(() => {
                      const total = parseNumericValue(manualFields.total_amount);
                      const iva = parseNumericValue(manualFields.iva_amount);
                      const pct = parseNumericValue(manualFields.retention_percent);
                      const explicit = parseNumericValue(manualFields.retention_amount);
                      const taxableBase = parseNumericValue(
                        manualFields.taxable_base ||
                        (total > 0 && iva > 0 ? String(total - iva) : manualFields.total_amount || "0")
                      );
                      const retainedAmount = explicit > 0 ? explicit : (iva > 0 && pct > 0 ? iva * (pct / 100) : 0);
                      if (explicit > 0) return `Bs. ${formatMoney(explicit)}`;
                      if (iva > 0 && pct > 0) return `Bs. ${formatMoney(taxableBase + (iva - retainedAmount))}`;
                      if (total > 0 && pct > 0) return `Bs. ${formatMoney(taxableBase + (total - (total * (pct / 100))))}`;
                      return "Bs. 0.00";
                    })()}
                  </Text>
                </Box>
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
                  <HStack justify="space-between" align="center" gap={3}>
                    <Text fontSize="sm" color="gray.400">¿La empresa no está registrada?</Text>
                    <Button size="sm" variant="outline" colorScheme="yellow" onClick={() => setCompanyDialogOpen(true)}>
                      Agregar empresa
                    </Button>
                  </HStack>
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
                      <Text fontSize="sm" color="gray.400" mb={1}>Porcentaje de retención</Text>
                      <Input
                        value={manualFields.retention_percent}
                        onChange={(e) => handleManualFieldChange("retention_percent", e.target.value)}
                        bg="#0b0b0f"
                        color="white"
                        placeholder="0.00"
                      />
                    </Box>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>Base imponible</Text>
                      <Input
                        value={manualFields.taxable_base || manualFields.total_amount}
                        onChange={(e) => handleManualFieldChange("taxable_base", e.target.value)}
                        bg="#0b0b0f"
                        color="white"
                        placeholder="0.00"
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={1}>IVA</Text>
                      <Input
                        value={manualFields.iva_amount}
                        onChange={(e) => handleManualFieldChange("iva_amount", e.target.value)}
                        bg="#0b0b0f"
                        color="white"
                        placeholder="0.00"
                      />
                    </Box>
                  </SimpleGrid>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Monto retenido</Text>
                    <Input
                      value={manualFields.retention_amount || (getAutoRetention() > 0 ? String(getAutoRetention()) : "")}
                      onChange={(e) => handleManualFieldChange("retention_amount", e.target.value)}
                      bg="#0b0b0f"
                      color="white"
                      placeholder="0.00"
                    />
                  </Box>
                  <Box mt={3} p={3} bg="#0b0b0f" borderRadius="lg">
                    <Text fontSize="sm" color="gray.400">Monto a cancelar</Text>
                    <Text fontSize="lg" fontWeight="bold" color="yellow.200">
                      Bs. {formatMoney(getAmountToCancel())}
                    </Text>
                  </Box>
                  <Button colorScheme="yellow" onClick={saveInvoiceDetails} loading={loading} mt={4}>
                    Guardar datos manuales
                  </Button>
                </VStack>
              </Box>

            </VStack>
          )}
        </Box>
      )}

      {companyDialogOpen && (
        <Box position="fixed" inset={0} zIndex={40} bg="rgba(0, 0, 0, 0.72)" display="flex" alignItems="center" justifyContent="center" p={4}>
          <Box width="100%" maxWidth="520px" bg="#111318" border="1px solid rgba(246, 200, 74, 0.45)" borderRadius="xl" p={6} boxShadow="2xl">
            <HStack justify="space-between" mb={5}>
              <Text fontSize="lg" fontWeight="bold" color="yellow.300">Agregar empresa</Text>
              <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => setCompanyDialogOpen(false)} aria-label="Cerrar formulario">
                Cerrar
              </Button>
            </HStack>
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
              <HStack justify="flex-end" gap={3} mt={3}>
                <Button variant="ghost" onClick={() => { setNewCompany({ name: "", rif: "", address: "", default_retention_percent: "" }); setCompanyDialogOpen(false); }}>
                  Cancelar
                </Button>
                <Button colorScheme="green" onClick={createCompany} loading={loading}>
                  Guardar empresa
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}

      <Button
        position="fixed"
        right={{ base: "16px", md: "24px" }}
        bottom={{ base: "16px", md: "24px" }}
        zIndex={10}
        colorScheme="yellow"
        boxShadow="0 10px 30px rgba(0,0,0,0.4)"
        onClick={() => window.open("https://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp", "_blank", "noopener,noreferrer")}
      >
        Buscar RIF en SENIAT
      </Button>

      <Box bg="#111318" p={5} borderRadius="2xl" border="1px solid rgba(52, 211, 153, 0.25)">
        <Text fontSize="md" fontWeight="bold" mb={4} color="green.300">Resumen de retenciones cobradas</Text>
        {collectedInvoices.length === 0 ? (
          <Text color="gray.500">Todavía no hay retenciones cobradas.</Text>
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="100%" minWidth="720px" borderCollapse="collapse">
              <Box as="thead" bg="#0b0b0f">
                <Box as="tr">
                  {["Proveedor", "RIF", "Retención", "Estado", "Factura"].map((heading) => (
                    <Box as="th" key={heading} textAlign="left" p={3} color="gray.400" fontSize="sm" fontWeight="semibold" borderBottom="1px solid rgba(255,255,255,0.1)">
                      {heading}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {collectedInvoices.map((inv) => (
                  <Box as="tr" key={inv.id} borderBottom="1px solid rgba(255,255,255,0.06)">
                    <Box as="td" p={3} color="white" fontWeight="bold">{inv.supplier_name || "Proveedor no identificado"}</Box>
                    <Box as="td" p={3} color="gray.300">{inv.rif || "No detectado"}</Box>
                    <Box as="td" p={3} color="yellow.200" fontWeight="bold">Bs. {getComputedRetention(inv).toFixed(2)}</Box>
                    <Box as="td" p={3} color="green.300">Cobrada</Box>
                    <Box as="td" p={3}>
                      {inv.image_url ? (
                        <Button size="sm" variant="outline" colorScheme="yellow" onClick={() => setInvoicePreviewUrl(buildApiUrl(inv.image_url || ""))}>
                          Ver factura
                        </Button>
                      ) : (
                        <Text color="gray.500" fontSize="sm">Sin imagen</Text>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>

              {invoicePreviewUrl && (
                <Box position="fixed" inset={0} zIndex={50} bg="rgba(0, 0, 0, 0.82)" display="flex" alignItems="center" justifyContent="center" p={{ base: 3, md: 8 }} onClick={() => setInvoicePreviewUrl(null)}>
                  <Box width="min(980px, 100%)" maxHeight="94vh" bg="#111318" border="1px solid rgba(246, 200, 74, 0.45)" borderRadius="xl" p={4} boxShadow="2xl" onClick={(event) => event.stopPropagation()}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="bold" color="yellow.300">Factura</Text>
                      <Button size="sm" variant="ghost" onClick={() => setInvoicePreviewUrl(null)}>
                        Cerrar
                      </Button>
                    </HStack>
                    <Image src={invoicePreviewUrl} alt="Factura" width="100%" maxHeight="82vh" objectFit="contain" borderRadius="lg" bg="#050506" />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
