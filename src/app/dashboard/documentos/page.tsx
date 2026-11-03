"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { AlertTriangle, Check, Clock3, ExternalLink, FileSearch, Search, Upload } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DocumentStatus = "vencido" | "por_vencer" | "vigente" | "sin_fecha";
type ScannedDocument = {
  id: string;
  original_filename: string;
  file_url: string;
  extracted_text: string;
  document_type: string;
  information: string;
  expiration_date: string | null;
  status: DocumentStatus;
  created_at: string;
};
type DocumentMetadata = {
  document_type: string;
  information: string;
  expiration_date: string;
};

const categories: { id: "todos" | DocumentStatus; label: string; color: string }[] = [
  { id: "todos", label: "Todos", color: "gray" },
  { id: "vencido", label: "Vencidos", color: "red" },
  { id: "por_vencer", label: "Por vencer", color: "orange" },
  { id: "vigente", label: "Vigentes", color: "green" },
  { id: "sin_fecha", label: "Sin fecha", color: "gray" },
];

const statusLabels: Record<DocumentStatus, string> = {
  vencido: "Vencido",
  por_vencer: "Vence en 30 días",
  vigente: "Vigente",
  sin_fecha: "Sin vencimiento detectado",
};

const categoryDescriptions: Record<(typeof categories)[number]["id"], string> = {
  todos: "Documentos guardados",
  vencido: "Requieren renovación",
  por_vencer: "En los próximos 30 días",
  vigente: "Con más de 30 días",
  sin_fecha: "Revisar extracción",
};

const statusColors: Record<DocumentStatus, string> = {
  vencido: "red",
  por_vencer: "orange",
  vigente: "green",
  sin_fecha: "gray",
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("es-VE", { month: "short", timeZone: "UTC" }).format(date);
}

function DocumentMetadataEditor({
  document,
  saving,
  onSave,
}: {
  document: ScannedDocument;
  saving: boolean;
  onSave: (metadata: DocumentMetadata) => void;
}) {
  const [documentType, setDocumentType] = useState(document.document_type || "");
  const [information, setInformation] = useState(document.information || "");
  const [expirationDate, setExpirationDate] = useState(document.expiration_date || "");
  const hasChanges = documentType !== (document.document_type || "")
    || information !== (document.information || "")
    || expirationDate !== (document.expiration_date || "");

  return (
    <VStack align="stretch" gap={3}>
      <Box>
        <Text color="gray.400" fontSize="sm" mb={1}>¿Qué tipo de documento es?</Text>
        <Input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Ej.: licencia, certificado, contrato" bg="#090b0b" />
      </Box>
      <Box>
        <Text color="gray.400" fontSize="sm" mb={1}>Fecha de vencimiento</Text>
        <Input type="date" value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} maxW="260px" bg="#090b0b" />
      </Box>
      <Box>
        <Text color="gray.400" fontSize="sm" mb={1}>Información extraída</Text>
        <Textarea value={information} onChange={(event) => setInformation(event.target.value)} rows={8} resize="vertical" bg="#090b0b" placeholder="El texto reconocido aparecerá aquí para que puedas revisarlo y corregirlo." />
      </Box>
      <Button onClick={() => onSave({ document_type: documentType, information, expiration_date: expirationDate })} loading={saving} disabled={!hasChanges} colorScheme="yellow" color="black" alignSelf="flex-start">
        Guardar información
      </Button>
    </VStack>
  );
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [lastScanned, setLastScanned] = useState<ScannedDocument[]>([]);
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>("todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/");
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "No se pudieron cargar los documentos.");
      setDocuments(Array.isArray(body) ? body : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los documentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDocuments);
  }, [loadDocuments]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const counts = useMemo(() => {
    const result: Record<(typeof categories)[number]["id"], number> = {
      todos: documents.length,
      vencido: 0,
      por_vencer: 0,
      vigente: 0,
      sin_fecha: 0,
    };
    documents.forEach((document) => { result[document.status] += 1; });
    return result;
  }, [documents]);

  const documentTypeSummary = useMemo(() => {
    const totals = documents.reduce<Record<string, number>>((result, document) => {
      const type = document.document_type?.trim() || "No identificado";
      result[type] = (result[type] || 0) + 1;
      return result;
    }, {});
    return Object.entries(totals).sort((first, second) => second[1] - first[1]).slice(0, 5);
  }, [documents]);

  const nextExpiringDocument = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return documents
      .filter((document) => document.expiration_date && document.expiration_date >= today)
      .sort((first, second) => first.expiration_date!.localeCompare(second.expiration_date!))[0] || null;
  }, [documents]);

  const scanTrend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1)));
    const totals = new Map(months.map((month) => [monthKey(month), 0]));
    documents.forEach((document) => {
      const createdAt = new Date(document.created_at);
      if (Number.isNaN(createdAt.getTime())) return;
      const key = monthKey(createdAt);
      if (totals.has(key)) totals.set(key, (totals.get(key) || 0) + 1);
    });
    return months.map((month) => ({ month: monthLabel(month), total: totals.get(monthKey(month)) || 0 }));
  }, [documents]);

  const expirationTrend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1)));
    const totals = new Map(months.map((month) => [monthKey(month), 0]));
    documents.forEach((document) => {
      if (!document.expiration_date) return;
      const expirationDate = new Date(`${document.expiration_date}T00:00:00Z`);
      if (Number.isNaN(expirationDate.getTime())) return;
      const key = monthKey(expirationDate);
      if (totals.has(key)) totals.set(key, (totals.get(key) || 0) + 1);
    });
    return months.map((month) => ({ month: monthLabel(month), total: totals.get(monthKey(month)) || 0 }));
  }, [documents]);

  const visibleDocuments = useMemo(() => documents.filter((document) => {
    const matchesCategory = category === "todos" || document.status === category;
    const matchesSearch = document.original_filename.toLowerCase().includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  }), [category, documents, search]);

  const scanFiles = async () => {
    if (!files.length) return;
    setScanning(true);
    setError("");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      const response = await fetch("/api/documents/scan", { method: "POST", body: formData });
      if (response.status === 401) {
        window.location.assign("/");
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "No se pudieron analizar los archivos.");
      setLastScanned(Array.isArray(body) ? body : []);
      setFiles([]);
      await loadDocuments();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudieron analizar los archivos.");
    } finally {
      setScanning(false);
    }
  };

  const selectFiles = (selectedFiles: File[]) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const firstFile = selectedFiles[0] || null;
    setFiles(selectedFiles);
    setPreviewFile(firstFile);
    setPreviewUrl(firstFile ? URL.createObjectURL(firstFile) : "");
    setLastScanned([]);
  };

  const saveMetadata = async (document: ScannedDocument, metadata: DocumentMetadata) => {
    setSavingId(document.id);
    setError("");
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: metadata.document_type,
          information: metadata.information,
          expiration_date: metadata.expiration_date || null,
        }),
      });
      if (response.status === 401) {
        window.location.assign("/");
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "No se pudo guardar la información.");
      setDocuments((current) => current.map((item) => item.id === document.id ? body : item));
      setLastScanned((current) => current.map((item) => item.id === document.id ? body : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la información.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <Box minH="100vh" bg="#090b0b" color="white" px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
      <VStack align="stretch" gap={6} maxW="7xl" mx="auto">
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
          <Box>
            <Heading size="lg" color="white">Gestión documental</Heading>
            <Text color="gray.400" mt={2}>Escanea documentos y organiza su vigencia.</Text>
          </Box>
          <Button as="label" variant="outline" borderColor="whiteAlpha.300" cursor="pointer" alignSelf={{ base: "flex-start", md: "auto" }}>
            <Upload size={17} /> Seleccionar archivos
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.txt"
              multiple
              display="none"
              onChange={(event) => selectFiles(Array.from(event.target.files || []))}
            />
          </Button>
        </Flex>

        {!loading && (
          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={2} wrap="wrap" mb={4}>
              <Heading size="md" color="white">Resumen de documentos guardados</Heading>
              <Text color="gray.500" fontSize="sm">Actualizado en tiempo real</Text>
            </Flex>
            <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap={3}>
              {categories.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setCategory(item.id)}
                  variant="outline"
                  borderColor={category === item.id ? `${item.color}.400` : "whiteAlpha.200"}
                  bg={category === item.id ? "whiteAlpha.100" : "transparent"}
                  h="auto"
                  minH="88px"
                  px={4}
                  py={3}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  whiteSpace="normal"
                >
                  <Box textAlign="left">
                    <Text fontSize="sm" color="gray.300">{item.label}</Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>{categoryDescriptions[item.id]}</Text>
                  </Box>
                  <Text fontSize="2xl" fontWeight="bold" color={`${item.color}.300`} ml={3}>{counts[item.id]}</Text>
                </Button>
              ))}
            </SimpleGrid>
            <Flex mt={5} pt={4} borderTop="1px solid" borderColor="whiteAlpha.100" gap={{ base: 4, md: 10 }} direction={{ base: "column", md: "row" }}>
              <Box flex="1" minW={0}>
                <Text color="gray.500" fontSize="xs" textTransform="uppercase" mb={2}>Tipos de documento</Text>
                {documentTypeSummary.length ? (
                  <HStack gap={2} wrap="wrap">
                    {documentTypeSummary.map(([type, total]) => (
                      <Badge key={type} colorScheme="cyan" variant="subtle">{type} · {total}</Badge>
                    ))}
                  </HStack>
                ) : <Text color="gray.500" fontSize="sm">Aún no hay documentos guardados.</Text>}
              </Box>
              <Box flex="1" minW={0}>
                <Text color="gray.500" fontSize="xs" textTransform="uppercase" mb={2}>Próximo vencimiento</Text>
                {nextExpiringDocument ? (
                  <Text color="gray.200" fontSize="sm" wordBreak="break-word">
                    {nextExpiringDocument.original_filename} · {new Date(`${nextExpiringDocument.expiration_date}T12:00:00`).toLocaleDateString("es-VE")}
                  </Text>
                ) : <Text color="gray.500" fontSize="sm">No hay vencimientos próximos registrados.</Text>}
              </Box>
              {documents[0] && (
                <Box flex="1" minW={0}>
                  <Text color="gray.500" fontSize="xs" textTransform="uppercase" mb={2}>Último guardado</Text>
                  <Text color="gray.200" fontSize="sm" wordBreak="break-word">{documents[0].original_filename}</Text>
                  <Text color="gray.500" fontSize="xs" mt={1}>{new Date(documents[0].created_at).toLocaleString("es-VE")}</Text>
                </Box>
              )}
            </Flex>
          </Box>
        )}

        {!loading && (
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
            <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }} minW={0}>
              <Heading size="sm" color="white">Documentos escaneados</Heading>
              <Text color="gray.500" fontSize="sm" mt={1} mb={4}>Ingresos por mes · últimos 6 meses</Text>
              <Box h="250px" w="100%">
                {documents.length === 0 ? (
                  <Flex h="100%" align="center" justify="center"><Text color="gray.500" fontSize="sm">Guarda documentos para ver la tendencia.</Text></Flex>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scanTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#101414", border: "1px solid #374151", borderRadius: 4, color: "white" }} />
                      <Bar dataKey="total" name="Documentos" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Box>

            <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }} minW={0}>
              <Heading size="sm" color="white">Vencimientos previstos</Heading>
              <Text color="gray.500" fontSize="sm" mt={1} mb={4}>Documentos por vencer · próximos 6 meses</Text>
              <Box h="250px" w="100%">
                {documents.length === 0 ? (
                  <Flex h="100%" align="center" justify="center"><Text color="gray.500" fontSize="sm">Aún no hay fechas para comparar.</Text></Flex>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={expirationTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#101414", border: "1px solid #374151", borderRadius: 4, color: "white" }} />
                      <Area type="monotone" dataKey="total" name="Vencimientos" stroke="#fb923c" fill="#fb923c" fillOpacity={0.18} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Box>
          </SimpleGrid>
        )}

        {previewFile && (
          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={3} direction={{ base: "column", md: "row" }} mb={4}>
              <Box minW={0}>
                <Text fontWeight="semibold" wordBreak="break-word">{previewFile.name}</Text>
                <Text color="gray.500" fontSize="sm" mt={1}>
                  {files.length ? `${files.length} archivo(s) listos para escanear` : "Vista previa del último documento escaneado"}
                </Text>
              </Box>
              {files.length > 0 && (
                <Button onClick={scanFiles} loading={scanning} colorScheme="yellow" color="black" flexShrink={0}>
                  <FileSearch size={17} /> Guardar y extraer {files.length > 1 ? `${files.length} archivos` : ""}
                </Button>
              )}
            </Flex>
            {previewUrl && (previewFile.type.startsWith("image/") ? (
              <Image src={previewUrl} alt={`Vista previa de ${previewFile.name}`} maxH="460px" maxW="100%" objectFit="contain" mx="auto" />
            ) : (
              <Box height={{ base: "380px", md: "560px" }} bg="white">
                <iframe src={previewUrl} title={`Vista previa de ${previewFile.name}`} style={{ width: "100%", height: "100%", border: 0 }} />
              </Box>
            ))}
          </Box>
        )}

        {error && <Text role="alert" color="red.300">{error}</Text>}

        {lastScanned.length > 0 && (
          <VStack align="stretch" gap={3}>
            <Heading size="md" color="yellow.300">Resultado del escaneo</Heading>
            {lastScanned.map((document) => (
              <Box key={document.id} bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
                <Flex justify="space-between" align="start" gap={3} wrap="wrap" mb={4}>
                  <Box minW={0}>
                    <Text fontWeight="semibold" wordBreak="break-word">{document.original_filename}</Text>
                    <HStack mt={2} gap={3} wrap="wrap">
                      <Badge colorScheme={statusColors[document.status]}>{statusLabels[document.status]}</Badge>
                      <Text color="gray.300" fontSize="sm">
                        {document.expiration_date ? `Vencimiento: ${new Date(`${document.expiration_date}T12:00:00`).toLocaleDateString("es-VE")}` : "No se detectó fecha de vencimiento"}
                      </Text>
                    </HStack>
                  </Box>
                  <NextLink href={document.file_url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline"><ExternalLink size={15} /> Abrir original</Button>
                  </NextLink>
                </Flex>
                <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5}>
                  <Box minW={0}>
                    <Text color="gray.400" fontSize="sm" mb={2}>Documento escaneado</Text>
                    {/\.(png|jpe?g|webp|bmp|tiff?)$/i.test(document.original_filename) ? (
                      <Image src={document.file_url} alt={document.original_filename} maxH="440px" maxW="100%" objectFit="contain" mx="auto" />
                    ) : (
                      <Box height={{ base: "360px", xl: "440px" }} bg="white">
                        <iframe src={document.file_url} title={`Documento escaneado: ${document.original_filename}`} style={{ width: "100%", height: "100%", border: 0 }} />
                      </Box>
                    )}
                  </Box>
                  <Box minW={0}>
                    <DocumentMetadataEditor document={document} saving={savingId === document.id} onSave={(metadata) => void saveMetadata(document, metadata)} />
                    {!document.extracted_text && <Text mt={3} color="orange.200" fontSize="sm">No se pudo leer texto de este archivo. Puedes completar o corregir los campos manualmente.</Text>}
                  </Box>
                </SimpleGrid>
              </Box>
            ))}
          </VStack>
        )}

        <HStack maxW={{ base: "100%", md: "420px" }} border="1px solid" borderColor="whiteAlpha.300" px={3}>
          <Search size={17} color="#a0aec0" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre de archivo" border="0" _focusVisible={{ boxShadow: "none" }} />
        </HStack>

        {loading ? <Text color="gray.500">Cargando documentos...</Text> : visibleDocuments.length === 0 ? (
          <Box borderTop="1px solid" borderColor="whiteAlpha.200" py={10} textAlign="center">
            <FileSearch size={28} color="#87908e" style={{ margin: "0 auto 12px" }} />
            <Text color="gray.300">{documents.length ? "No hay documentos en esta categoría." : "Todavía no hay documentos escaneados."}</Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={3}>
            {visibleDocuments.map((document) => {
              const StatusIcon = document.status === "vencido" ? AlertTriangle : document.status === "vigente" ? Check : Clock3;
              return (
                <Box key={document.id} bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
                  <Flex justify="space-between" align="start" gap={4} direction={{ base: "column", md: "row" }}>
                    <Box minW={0} flex="1">
                      <HStack gap={2} align="start">
                        <StatusIcon size={18} color={document.status === "vencido" ? "#fc8181" : document.status === "vigente" ? "#68d391" : "#f6ad55"} />
                        <Text fontWeight="semibold" wordBreak="break-word">{document.original_filename}</Text>
                      </HStack>
                      <Text color="gray.400" fontSize="sm" mt={1}>{document.document_type || "No identificado"}</Text>
                      <HStack mt={2} gap={3} wrap="wrap">
                        <Badge colorScheme={statusColors[document.status]}>{statusLabels[document.status]}</Badge>
                        <Text fontSize="sm" color="gray.400">
                          {document.expiration_date ? `Vencimiento: ${new Date(`${document.expiration_date}T12:00:00`).toLocaleDateString("es-VE")}` : "Revisa el texto o agrega una fecha"}
                        </Text>
                      </HStack>
                    </Box>
                    <NextLink href={document.file_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" flexShrink={0}>
                        <ExternalLink size={15} /> Abrir original
                      </Button>
                    </NextLink>
                  </Flex>
                  <Box mt={4} borderTop="1px solid" borderColor="whiteAlpha.100" pt={4}>
                    <DocumentMetadataEditor document={document} saving={savingId === document.id} onSave={(metadata) => void saveMetadata(document, metadata)} />
                  </Box>
                </Box>
              );
            })}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}