"use client"

import { useEffect, useState } from "react"
import { Badge, Box, Button, Heading, HStack, Image, Input, SimpleGrid, Text, Textarea, VStack } from "@chakra-ui/react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { FileSearch, RefreshCw, ShieldAlert, Upload } from "lucide-react"

type Risk = { name: string; severity: string; reason: string; controls: string[] }
type Person = { id: string; username: string; name?: string | null; email: string; confidence: string }
type DocumentAnalysis = {
  id?: string
  document_type?: string
  filename: string
  source_path: string
  permit_number?: string | null
  permit_type?: string | null
  permit_date?: string | null
  permit_time?: string | null
  valid_until?: string | null
  shift?: string | null
  equipment?: string | null
  description?: string | null
  risk_analysis_number?: string | null
  work_procedure_number?: string | null
  contractor?: string | null
  personnel_count?: string | null
  signatories?: string[]
  activity?: string | null
  work_area?: string | null
  start_at?: string | null
  end_at?: string | null
  extracted_text: string
  personnel?: Person[]
  risks: Risk[]
  created_at?: string
}

const riskScore: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 }

function normalizeFieldValue(value?: string | null) {
  if (!value) return "No identificado"
  const normalized = value.trim().replace(/\s+/g, " ")
  return normalized || "No identificado"
}

function formatPermitTime(value?: string | null) {
  if (!value) return "No identificada"
  const normalized = value.trim()
  if (/^\d{3}$/.test(normalized)) {
    return normalized.startsWith("0") ? `${normalized.slice(0, 2)}:00` : `0${normalized[0]}:${normalized.slice(1)}`
  }
  const compact = normalized.match(/^(\d{1,2})(?:[:.]?(\d{2}))?\s*([AP])\.?\s*M?$/i)
  if (compact) {
    const hour = Number(compact[1]).toString().padStart(2, "0")
    const minutes = compact[2] ? compact[2].padStart(2, "0") : "00"
    const suffix = compact[3] ? ` ${compact[3].toUpperCase()}M` : ""
    return `${hour}:${minutes}${suffix}`
  }

  const timeMatch = normalized.match(/^(\d{1,2}:\d{2})(?:\s*([AP])\.?\s*M?)?$/i)
  if (timeMatch) {
    const suffix = timeMatch[2] ? ` ${timeMatch[2].toUpperCase()}M` : ""
    return `${timeMatch[1]}${suffix}`
  }

  return normalized
}

function extractPermitDataFromText(extractedText: string): Partial<DocumentAnalysis> {
  const text = extractedText.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim()
  if (!text) return {}

  const cleanValue = (value?: string | null) => (value || "").replace(/^[:\-\s]+|[:\-\s]+$/g, "").trim()

  const getMatch = (pattern: RegExp) => {
    const match = text.match(pattern)
    return match ? cleanValue(match[1]) : ""
  }

  const permitType = getMatch(/(?:EN\s*FR[ÍI]O|EN\s*CALIENTE)/i)
  const permitNumber = getMatch(/(?:ORDEN\s*SAP\s*No\.?|ORDEN\s*SAP|N[°º]?\s*PERMISO|NUMERO\s*DE\s*PERMISO)\s*[:\-]?\s*([A-Za-z0-9-]+)/i)
  const workArea = getMatch(/(?:ÁREA|AREA)\s*(?:DE\s*TRABAJO)?\s*[:\-]?\s*([A-Za-z0-9ÁÉÍÓÚÑáéíóúñ/\-\.\s]+)/i)
  const equipment = getMatch(/(?:EQUIPO)\s*[:\-]?\s*([A-Za-z0-9ÁÉÍÓÚÑáéíóúñ/\-\.\s]+)/i)
  const contractor = getMatch(/(?:CONTRATISTA)\s*[:\-]?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ\s\.-]+)/i)
  const personnelCount = getMatch(/(?:N[°º]\s*DE\s*PERSONAS|N[°º]?\s*PERSONAS)\s*[:\-]?\s*(\d+)/i)
  const permitDate = getMatch(/(?:FECHA)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i)
  const permitTime = getMatch(/(?:HORA\s*DE\s*INICIO|HORA)\s*[:\-]?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  const validUntil = getMatch(/(?:VALID(?:E|EZ)\s*HASTA|VALIDEZ\s*HASTA)\s*[:\-]?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  const shift = getMatch(/(?:AM|PM)/i)

  const description = (() => {
    const match = text.match(/(?:DESCRIPCIÓN\s*DE\s*LOS\s*TRABAJOS|DESCRIPCION\s*DE\s*LOS\s*TRABAJOS)\s*[:\-]?\s*([A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s\-/.,]+?)(?=\s*(?:B\.|5\.|6\.|7\.|8\.|9\.|10\.|ANÁLISIS|PROCEDIMIENTO|EJECUTOR|CONTRATISTA|FECHA))/i)
    return match ? cleanValue(match[1]) : ""
  })()

  const riskAnalysisNumber = getMatch(/(?:ANÁLISIS\s*DE\s*RIESGOS\s*N[°º]?|ANALISIS\s*DE\s*RIESGOS\s*N[°º]?)\s*[:\-]?\s*(\d+)/i)
  const workProcedureNumber = getMatch(/(?:PROCEDIMIENTO\s*DE\s*TRABAJO\s*N[°º]?|PROCEDIMIENTO\s*DE\s*TRABAJO)\s*[:\-]?\s*(\d+)/i)

  return {
    permit_type: permitType || undefined,
    permit_number: permitNumber || undefined,
    permit_date: permitDate || undefined,
    permit_time: permitTime || undefined,
    valid_until: validUntil || undefined,
    shift: shift || undefined,
    work_area: workArea || undefined,
    equipment: equipment || undefined,
    description: description || undefined,
    risk_analysis_number: riskAnalysisNumber || undefined,
    work_procedure_number: workProcedureNumber || undefined,
    contractor: contractor || undefined,
    personnel_count: personnelCount || undefined,
    activity: permitType || undefined,
    document_type: "Permiso de trabajo",
  }
}

function RiskChart({ risks }: { risks: Risk[] }) {
  const data = risks.map((risk) => ({ name: risk.name, nivel: riskScore[risk.severity] || 1 }))
  if (!data.length) return <Text color="gray.400">No se identificaron riesgos para graficar.</Text>

  return (
    <Box h="280px" w="100%" aria-label="Gráfica de riesgos identificados">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis type="number" domain={[0, 3]} ticks={[1, 2, 3]} stroke="#a0aec0" />
          <YAxis type="category" dataKey="name" width={125} tick={{ fill: "#e2e8f0", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#101014", border: "1px solid #4a5568", color: "white" }} />
          <Bar dataKey="nivel" name="Severidad" fill="#f6ad55" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

function AnalysisPanel({ title, analysis }: { title: string; analysis: DocumentAnalysis }) {
  const isPermit = title === "Permiso de trabajo"

  const identificationFields = [
    { label: "Número de permiso", value: normalizeFieldValue(analysis.permit_number) },
    { label: "Fecha", value: normalizeFieldValue(analysis.permit_date) },
    { label: "Hora", value: formatPermitTime(analysis.permit_time) },
  ]

  const operationFields = [
    ...(isPermit ? [{ label: "Tipo de trabajo", value: normalizeFieldValue(analysis.permit_type || analysis.document_type) }] : [{ label: "Tipo de documento", value: normalizeFieldValue(analysis.document_type || title) }]),
    { label: "Actividad", value: normalizeFieldValue(analysis.activity) },
    { label: "Área de trabajo", value: normalizeFieldValue(analysis.work_area || analysis.equipment) },
    { label: "Equipo", value: normalizeFieldValue(analysis.equipment) },
    { label: "Descripción", value: normalizeFieldValue(analysis.description) },
    { label: "Riesgos", value: normalizeFieldValue(analysis.risk_analysis_number) },
    { label: "Procedimiento", value: normalizeFieldValue(analysis.work_procedure_number) },
    { label: "Contratista", value: normalizeFieldValue(analysis.contractor) },
    { label: "N° de personas", value: normalizeFieldValue(analysis.personnel_count) },
    { label: "Validez", value: normalizeFieldValue(analysis.valid_until) },
    { label: "Turno", value: normalizeFieldValue(analysis.shift) },
  ]

  const FieldCard = ({ label, value, prominent = false }: { label: string; value: string; prominent?: boolean }) => (
    <Box minH={prominent ? "92px" : "76px"} bg={prominent ? "rgba(234,179,8,0.08)" : "blackAlpha.400"} border="1px solid" borderColor={prominent ? "yellow.600" : "whiteAlpha.100"} borderRadius="md" p={3}>
      <Text color={prominent ? "yellow.300" : "gray.500"} fontSize="xs" textTransform="uppercase" letterSpacing="wide">{label}</Text>
      <Text color="white" mt={2} fontSize={prominent ? "lg" : "md"} fontWeight="semibold" wordBreak="break-word">{value}</Text>
    </Box>
  )

  return (
    <VStack align="stretch" gap={4}>
      <Heading size="md" color="cyan.200">Resultado del {title}</Heading>
      <Box border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" p={4}>
        {isPermit && <>
          <Text color="yellow.300" fontWeight="bold" mb={3}>Identificación y horario</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
            {identificationFields.map((field) => <FieldCard key={field.label} {...field} prominent />)}
          </SimpleGrid>
        </>}
        <Text color="yellow.300" fontWeight="bold" mt={5} mb={3}>Datos operativos</Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          {operationFields.map((field) => <FieldCard key={`${field.label}-${field.value}`} {...field} />)}
        </SimpleGrid>
        <Box mt={3} bg="blackAlpha.400" borderRadius="md" p={3}>
          <Text color="gray.500" fontSize="xs" textTransform="uppercase">Archivo analizado</Text>
          <Text color="white" mt={1} fontWeight="semibold" wordBreak="break-word">{analysis.filename}</Text>
        </Box>
      </Box>

      {isPermit && <Box border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" p={4}>
        <Text color="yellow.300" fontWeight="bold" mb={3}>Personal identificado</Text>
        {analysis.personnel?.length ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {analysis.personnel.map((person) => (
              <Box key={person.id || person.username} bg="blackAlpha.400" borderRadius="sm" p={3}>
                <Text fontWeight="semibold">{person.name || person.username}</Text>
                <Text color="gray.400" fontSize="sm">Usuario: {person.username}</Text>
                <Text color="gray.400" fontSize="sm">Correo: {person.email}</Text>
                <Badge mt={2} colorScheme="cyan">Coincidencia: {person.confidence}</Badge>
              </Box>
            ))}
          </SimpleGrid>
        ) : <Text color="gray.400">No se identificó personal en el documento.</Text>}
      </Box>}
      {isPermit && <Box border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" p={4}>
        <Text color="yellow.300" fontWeight="bold" mb={3}>Firmantes del permiso</Text>
        {analysis.signatories?.length ? (
          <VStack align="stretch" gap={2}>
            {analysis.signatories.map((signatory) => <Box key={signatory} bg="blackAlpha.400" borderRadius="sm" p={3} color="white">{signatory}</Box>)}
          </VStack>
        ) : <Text color="gray.400">No se identificaron firmantes.</Text>}
      </Box>}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={5}>
        <Box>
          <Text color="yellow.300" fontWeight="bold" mb={3}>Riesgos identificados</Text>
          <VStack align="stretch" gap={3}>
            {analysis.risks.length ? analysis.risks.map((risk) => (
              <Box key={risk.name} p={3} border="1px solid" borderColor={risk.severity === "Alta" ? "red.500" : "yellow.500"} borderRadius="md">
                <HStack justify="space-between"><Text fontWeight="bold">{risk.name}</Text><Badge colorScheme={risk.severity === "Alta" ? "red" : "yellow"}>{risk.severity}</Badge></HStack>
                <Text color="gray.300" fontSize="sm" mt={1}>{risk.reason}</Text>
                <Box mt={3}>
                  <Text color="gray.400" fontSize="xs" textTransform="uppercase" mb={1}>Controles requeridos</Text>
                  <VStack align="stretch" gap={1}>
                    {risk.controls.map((control) => <Text key={control} color="gray.300" fontSize="sm">• {control}</Text>)}
                  </VStack>
                </Box>
              </Box>
            )) : <Text color="gray.400">No se identificaron riesgos por palabras clave.</Text>}
          </VStack>
        </Box>
        <Box>
          <Text color="yellow.300" fontWeight="bold" mb={3}>Gráfica de riesgos</Text>
          <RiskChart risks={analysis.risks} />
        </Box>
      </SimpleGrid>
      <Box as="details" border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" p={3}>
        <Box as="summary" cursor="pointer" color="gray.400" fontWeight="semibold">Ver texto original del documento</Box>
        <Box mt={3} maxH="220px" overflowY="auto" whiteSpace="pre-wrap" bg="black" border="1px solid" borderColor="whiteAlpha.300" borderRadius="sm" p={4} color="gray.500" fontSize="sm">
          {analysis.extracted_text || "No se pudo extraer texto."}
        </Box>
      </Box>
    </VStack>
  )
}

export default function SeguridadPermisosPage() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [permitFile, setPermitFile] = useState<File | null>(null)
  const [artFile, setArtFile] = useState<File | null>(null)
  const [vitFile, setVitFile] = useState<File | null>(null)
  const [permitAnalysis, setPermitAnalysis] = useState<DocumentAnalysis | null>(null)
  const [artAnalysis, setArtAnalysis] = useState<DocumentAnalysis | null>(null)
  const [vitAnalysis, setVitAnalysis] = useState<DocumentAnalysis | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [activity, setActivity] = useState("")
  const [workArea, setWorkArea] = useState("")
  const [personnelText, setPersonnelText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<DocumentAnalysis[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const refreshHistory = async (showLoading = true) => {
    if (showLoading) setHistoryLoading(true)
    try {
      const response = await fetch("/api/security/permit/history", { cache: "no-store" })
      if (!response.ok) throw new Error("No se pudo cargar el historial.")
      const body = await response.json()
      setHistory(Array.isArray(body) ? body : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshHistory(false), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const resetProcess = () => {
    setActiveStep(1); setPermitFile(null); setArtFile(null); setVitFile(null)
    setPermitAnalysis(null); setArtAnalysis(null); setVitAnalysis(null)
    setActivity(""); setWorkArea(""); setPersonnelText(""); setError("")
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl("")
  }

  const analyzeDocument = async (file: File, endpoint: string, documentType?: "art" | "vit") => {
    setLoading(true); setError("")
    const form = new FormData()
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 90_000)
    form.append("file", file)
    if (documentType) form.append("document_type", documentType)
    if (documentType === "art" || !documentType) {
      if (activity) form.append("activity", activity)
      if (workArea) form.append("work_area", workArea)
    }
    if (!documentType && personnelText) form.append("personnel_text", personnelText)

    try {
      const response = await fetch(endpoint, { method: "POST", body: form, signal: controller.signal })
      const responseText = await response.text()
      const body = JSON.parse(responseText) as DocumentAnalysis & { detail?: string }
      if (!response.ok) throw new Error(body.detail || `No se pudo analizar el documento (${response.status}).`)
      return body
    } catch (caught) {
      setError(caught instanceof DOMException && caught.name === "AbortError" ? "El análisis tardó demasiado. Intenta con una imagen más clara o de menor tamaño." : caught instanceof Error ? caught.message : "Error de conexión con el servidor.")
      return null
    } finally {
      window.clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  const analyzePermit = async () => {
    if (!permitFile) return setError("Selecciona un permiso en PDF o imagen.")
    const result = await analyzeDocument(permitFile, "/api/security/permit/analyze")

    if (result) {
      const fallback = extractPermitDataFromText(result.extracted_text || "")
      const mergedResult: DocumentAnalysis = {
        ...result,
        ...(fallback.permit_number ? { permit_number: fallback.permit_number } : {}),
        ...(fallback.permit_date ? { permit_date: fallback.permit_date } : {}),
        ...(fallback.permit_time ? { permit_time: fallback.permit_time } : {}),
        ...(fallback.valid_until ? { valid_until: fallback.valid_until } : {}),
        ...(fallback.shift ? { shift: fallback.shift } : {}),
        ...(fallback.equipment ? { equipment: fallback.equipment } : {}),
        ...(fallback.description ? { description: fallback.description } : {}),
        ...(fallback.risk_analysis_number ? { risk_analysis_number: fallback.risk_analysis_number } : {}),
        ...(fallback.work_procedure_number ? { work_procedure_number: fallback.work_procedure_number } : {}),
        ...(fallback.contractor ? { contractor: fallback.contractor } : {}),
        ...(fallback.personnel_count ? { personnel_count: fallback.personnel_count } : {}),
        ...(fallback.work_area ? { work_area: fallback.work_area } : {}),
        ...(fallback.activity ? { activity: fallback.activity } : {}),
        ...(fallback.permit_type ? { permit_type: fallback.permit_type } : {}),
        filename: result.filename || permitFile.name,
        source_path: result.source_path || permitFile.name,
        permit_number: result.permit_number || fallback.permit_number || null,
        permit_date: result.permit_date || fallback.permit_date || null,
        permit_time: result.permit_time || fallback.permit_time || null,
        valid_until: result.valid_until || fallback.valid_until || null,
        shift: result.shift || fallback.shift || null,
        equipment: result.equipment || fallback.equipment || null,
        description: result.description || fallback.description || null,
        risk_analysis_number: result.risk_analysis_number || fallback.risk_analysis_number || null,
        work_procedure_number: result.work_procedure_number || fallback.work_procedure_number || null,
        contractor: result.contractor || fallback.contractor || null,
        personnel_count: result.personnel_count || fallback.personnel_count || null,
        work_area: result.work_area || fallback.work_area || null,
        activity: result.activity || fallback.activity || null,
        permit_type: result.permit_type || fallback.permit_type || null,
      }

      setPermitAnalysis(mergedResult)
      setActiveStep(2)
      void refreshHistory()
    }
  }

  const analyzeArt = async () => {
    if (!artFile) return setError("Selecciona el ART antes de analizarlo.")
    const result = await analyzeDocument(artFile, "/api/security/document/analyze", "art")
    if (result) { setArtAnalysis(result); setActiveStep(3) }
  }

  const analyzeVit = async () => {
    if (!vitFile) return setError("Selecciona los VIT antes de analizarlos.")
    const result = await analyzeDocument(vitFile, "/api/security/document/analyze", "vit")
    if (result) setVitAnalysis(result)
  }

  const steps = ["1. Permiso de trabajo", "2. Cargar ART", "3. Cargar VIT"]
  const enabledSteps = [true, Boolean(permitAnalysis), Boolean(artAnalysis)]

  return (
    <Box p={{ base: 4, md: 6 }} minH="100vh" bg="#08080a" color="white">
      <VStack align="stretch" gap={6} maxW="6xl" mx="auto">
        <Box><Heading color="yellow.400">Permiso de trabajo, ART y VIT</Heading><Text color="gray.400" mt={2}>Cada etapa extrae la información, identifica riesgos y genera su gráfica antes de habilitar la siguiente.</Text></Box>
        <Box bg="#101014" border="1px solid" borderColor="whiteAlpha.200" borderRadius="lg" p={{ base: 4, md: 5 }}>
          <HStack justify="space-between" mb={4} wrap="wrap" gap={2}>
            <Box>
              <Heading size="sm" color="cyan.200">Escaneos recientes</Heading>
              <Text color="gray.500" fontSize="sm" mt={1}>Historial real de permisos procesados por el sistema.</Text>
            </Box>
            <Button type="button" size="sm" variant="outline" onClick={() => void refreshHistory()} loading={historyLoading}>
              <RefreshCw size={15} /> Actualizar
            </Button>
          </HStack>
          {historyLoading ? <Text color="gray.500">Cargando historial...</Text> : history.length === 0 ? <Text color="gray.500">Todavía no hay permisos escaneados.</Text> : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={3}>
              {history.slice(0, 6).map((item) => {
                const highRiskCount = item.risks.filter((risk) => risk.severity === "Alta").length
                return <Box key={item.id || item.filename} bg="blackAlpha.400" borderRadius="md" p={3}>
                  <HStack justify="space-between" align="start" gap={2}>
                    <Box minW={0}><Text fontWeight="semibold" color="white" truncate>{item.filename}</Text><Text color="gray.500" fontSize="xs" mt={1}>{item.created_at ? new Date(item.created_at).toLocaleString("es-PE") : "Fecha no disponible"}</Text></Box>
                    <Badge colorScheme={highRiskCount > 0 ? "red" : "green"}>{highRiskCount > 0 ? `${highRiskCount} riesgo(s) alto(s)` : "Sin riesgo alto"}</Badge>
                  </HStack>
                  <Text color="gray.300" fontSize="sm" mt={3}>{normalizeFieldValue(item.activity || item.permit_type)}</Text>
                  <Text color="gray.500" fontSize="xs" mt={1}>Permiso: {normalizeFieldValue(item.permit_number)}</Text>
                </Box>
              })}
            </SimpleGrid>
          )}
        </Box>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          {steps.map((step, index) => <Button key={step} type="button" onClick={() => enabledSteps[index] && setActiveStep((index + 1) as 1 | 2 | 3)} disabled={!enabledSteps[index]} colorScheme={activeStep === index + 1 ? "yellow" : "gray"} color={activeStep === index + 1 ? "black" : "white"}>{step}</Button>)}
        </SimpleGrid>
        <HStack justify="space-between" wrap="wrap" gap={3}><Text color="gray.500" fontSize="sm">{activeStep === 1 ? "Analiza primero el permiso de trabajo." : activeStep === 2 ? "Analiza el ART para habilitar los VIT." : "Analiza los VIT para finalizar."}</Text>{permitAnalysis && <Button type="button" size="sm" variant="outline" onClick={resetProcess}>Nuevo proceso</Button>}</HStack>

        {activeStep === 1 && <Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200"><VStack align="stretch" gap={4}>
          <HStack gap={3} wrap="wrap"><Button as="label" colorScheme="yellow" color="black" cursor="pointer" display="flex" gap={2}><Upload size={17} /> Seleccionar permiso<Input type="file" accept=".pdf,image/*,.txt" display="none" onChange={(event) => { const selected = event.target.files?.[0] || null; setPermitFile(selected); setPermitAnalysis(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(selected?.type.startsWith("image/") ? URL.createObjectURL(selected) : "") }} /></Button><Text color="gray.400">{permitFile?.name || "PDF, imagen o texto"}</Text></HStack>
          {previewUrl && <Box maxW="520px" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="yellow.500" bg="black"><Image src={previewUrl} alt="Vista previa del permiso cargado" width="100%" maxH="420px" objectFit="contain" /></Box>}
          <Textarea value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="Actividad adicional (opcional)" bg="black" /><Input value={workArea} onChange={(event) => setWorkArea(event.target.value)} placeholder="Área o ubicación" bg="black" /><Input value={personnelText} onChange={(event) => setPersonnelText(event.target.value)} placeholder="Personal asociado" bg="black" />
          <Button onClick={analyzePermit} loading={loading} disabled={!permitFile} colorScheme="cyan" display="flex" gap={2} alignSelf="flex-start"><FileSearch size={18} /> Analizar permiso</Button>
        </VStack></Box>}

        {activeStep === 2 && permitAnalysis && <VStack align="stretch" gap={6}><Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="cyan.500"><AnalysisPanel title="Permiso de trabajo" analysis={permitAnalysis} /></Box><Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="yellow.500"><Heading size="md" color="yellow.300" mb={4}>Paso 2: cargar y analizar ART</Heading><Input type="file" accept=".pdf,image/*,.txt" onChange={(event) => { setArtFile(event.target.files?.[0] || null); setArtAnalysis(null) }} bg="black" /><Text color={artFile ? "gray.300" : "gray.500"} fontSize="sm" mt={2}>{artFile?.name || "Selecciona el archivo ART"}</Text><Button mt={4} onClick={analyzeArt} loading={loading} disabled={!artFile} colorScheme="yellow" color="black" alignSelf="flex-start"><FileSearch size={17} /> Analizar ART</Button></Box>{error && <Text color="red.300">{error}</Text>}</VStack>}

        {activeStep === 3 && artAnalysis && <VStack align="stretch" gap={6}><Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="cyan.500"><AnalysisPanel title="ART" analysis={artAnalysis} /></Box><Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="green.500"><Heading size="md" color="green.300" mb={4}>Paso 3: cargar y analizar VIT</Heading><Input type="file" accept=".pdf,image/*,.txt" onChange={(event) => { setVitFile(event.target.files?.[0] || null); setVitAnalysis(null) }} bg="black" /><Text color={vitFile ? "gray.300" : "gray.500"} fontSize="sm" mt={2}>{vitFile?.name || "Selecciona el archivo VIT"}</Text><Button mt={4} onClick={analyzeVit} loading={loading} disabled={!vitFile} colorScheme="green" alignSelf="flex-start"><FileSearch size={17} /> Analizar VIT</Button></Box>{vitAnalysis && <Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="green.500"><AnalysisPanel title="VIT" analysis={vitAnalysis} /><Button mt={5} onClick={resetProcess} colorScheme="green">Finalizar y analizar otro proceso</Button></Box>}{error && <Text color="red.300">{error}</Text>}</VStack>}

        <Box p={4} bg="yellow.900/20" borderRadius="lg"><HStack align="start"><ShieldAlert color="#eab308" /><Text color="gray.300" fontSize="sm">La identificación automática es una ayuda de revisión. El responsable de seguridad debe validar cada documento, riesgo y control antes de autorizar la actividad.</Text></HStack></Box>
      </VStack>
    </Box>
  )
}
