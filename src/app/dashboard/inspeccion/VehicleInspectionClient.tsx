"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Image as ChakraImage,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"

interface VehicleRead {
  id: string
  license_plate: string
  model: string
  km_actual: number
  status: string
  register_date: string
}

interface VehicleInspectionClientProps {
  vehicles: VehicleRead[]
}

export function VehicleInspectionClient({ vehicles }: VehicleInspectionClientProps) {
  const [vehicleId, setVehicleId] = useState<string>(String(vehicles[0]?.id || ""))
  const [beforeFiles, setBeforeFiles] = useState<File[]>([])
  const [afterFiles, setAfterFiles] = useState<File[]>([])
  const [beforePreviewUrls, setBeforePreviewUrls] = useState<string[]>([])
  const [afterPreviewUrls, setAfterPreviewUrls] = useState<string[]>([])
  const [fuelLevel, setFuelLevel] = useState("")
  const [tireCondition, setTireCondition] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [inspection, setInspection] = useState<any | null>(null)
  const [issues, setIssues] = useState<Array<any>>([])
  const [history, setHistory] = useState<any[]>([])

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => String(vehicle.id) === vehicleId) || null,
    [vehicleId, vehicles],
  )

  useEffect(() => {
    if (!vehicleId && vehicles.length > 0) {
      setVehicleId(String(vehicles[0].id))
    }
  }, [vehicleId, vehicles])

  const scanMode = "Inspección asistida por IA" as const
  const scanEngine = "Soland Vision AI"
  const scoreStatus = (score: number) => {
    if (score >= 90) return "Óptimo"
    if (score >= 75) return "Seguro"
    if (score >= 50) return "Requiere revisión"
    return "Alerta crítica"
  }

  const getReportSummary = (report?: string) => {
    if (!report) return "Sin resumen disponible."
    const lines = report.trim().split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length === 0) return "Sin resumen disponible."
    const summary = lines.slice(0, 2).join(" ")
    return summary.length <= 140 ? summary : `${summary.slice(0, 140).trim()}...`
  }

  const historyRows = () => {
    const rows: Array<any> = Array.isArray(history) ? [...history] : []
    if (inspection) {
      const alreadyIncluded = rows.some((item) => item.id === inspection.id)
      if (!alreadyIncluded) {
        rows.unshift({
          id: inspection.id || "current-inspection",
          created_at: inspection.created_at || new Date().toISOString(),
          score: inspection.score,
          change_percent: inspection.change_percent,
          report: inspection.report,
          pdf_file: inspection.pdf_file,
        })
      }
    }
    return rows
  }

  const handleFilesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (files: File[]) => void,
    previewSetter: (urls: string[]) => void,
    currentPreviewUrls: string[],
  ) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    currentPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    const urls = files.map((file) => URL.createObjectURL(file))
    previewSetter(urls)
    setter(files)
  }

  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      beforePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      afterPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [beforePreviewUrls, afterPreviewUrls])

  useEffect(() => {
    const loadHistory = async () => {
      const historyResult = await fetchVehicleInspectionHistoryClient()
      if (!historyResult.error) {
        setHistory(historyResult.history || [])
      } else {
        console.warn("No se pudo cargar el historial de inspecciones:", historyResult.error)
        setHistory([])
      }
    }

    loadHistory()
  }, [])

  const fetchVehicleInspectionHistoryClient = async () => {
    try {
      const res = await fetch("/api/vehicle/inspection/history", {
        cache: "no-store",
      })

      let body: any = {}
      try {
        body = await res.json()
      } catch {
        body = { detail: await res.text().catch(() => res.statusText) }
      }

      if (!res.ok) {
        return { error: body.detail || `Error ${res.status}: ${res.statusText}` }
      }

      if (Array.isArray(body)) {
        return { history: body }
      }
      if (body && typeof body === "object" && Array.isArray(body.history)) {
        return { history: body.history }
      }
      return { error: "Respuesta de historial inválida." }
    } catch (error) {
      console.error("Error en fetchVehicleInspectionHistoryClient:", error)
      return { error: "Error de conexión con el servidor." }
    }
  }

  const compressImageFile = async (file: File, maxSide = 1600, quality = 0.72): Promise<File> => {
    if (!file.type.startsWith("image/")) return file
    if (file.size <= 700 * 1024) return file

    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("No se pudo leer la imagen."))
        reader.readAsDataURL(file)
      })

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("No se pudo procesar la imagen."))
        img.src = dataUrl
      })

      const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
      const targetWidth = Math.max(1, Math.round(image.width * scale))
      const targetHeight = Math.max(1, Math.round(image.height * scale))

      const canvas = document.createElement("canvas")
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return file

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, targetWidth, targetHeight)
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

      const mimeType = file.type === "image/png" ? "image/jpeg" : file.type
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, quality))
      if (!blob) return file

      const extension = mimeType === "image/png" ? ".png" : ".jpg"
      const compressedName = file.name.replace(/\.[^.]+$/, "") + extension
      return new File([blob], compressedName, { type: mimeType, lastModified: Date.now() })
    } catch (error) {
      console.warn("No se pudo comprimir la imagen; se enviará original.", error)
      return file
    }
  }

  const compareVehicleInspectionClient = async (formData: FormData) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://sistemasoland.onrender.com"
      const token = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("access_token="))
        ?.split("=")[1]

      const res = await fetch(`${apiBase}/api/vehicle/inspection/compare`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      const text = await res.text()
      let body: any = {}
      try {
        body = JSON.parse(text)
      } catch {
        body = { detail: text || res.statusText }
      }

      if (!res.ok) {
        return { error: body.detail || `Error ${res.status}: ${res.statusText}` }
      }

      if (body && typeof body === "object" && "detail" in body && Object.keys(body).length === 1) {
        return { error: body.detail }
      }

      return { inspection: body }
    } catch (error) {
      console.error("Error en compareVehicleInspectionClient:", error)
      return { error: "Error de conexión con el servidor." }
    }
  }

  const handleCompare = async () => {
    const effectiveVehicleId = vehicleId || (vehicles[0]?.id ? String(vehicles[0].id) : "")

    if (!effectiveVehicleId) {
      setMessage("No hay un vehículo disponible para inspeccionar.")
      return
    }
    if (beforeFiles.length === 0 || afterFiles.length === 0) {
      setMessage("Carga al menos una imagen de salida y una imagen de regreso.")
      return
    }

    setMessage(null)
    setLoading(true)

    try {
      const preparedBeforeFiles = await Promise.all(beforeFiles.map((file) => compressImageFile(file)))
      const preparedAfterFiles = await Promise.all(afterFiles.map((file) => compressImageFile(file)))

      const formData = new FormData()
      formData.append("vehicle_id", effectiveVehicleId)
      preparedBeforeFiles.forEach((file) => formData.append("before_images", file))
      preparedAfterFiles.forEach((file) => formData.append("after_images", file))
      if (fuelLevel) formData.append("fuel_level", fuelLevel)
      if (tireCondition) formData.append("tire_condition", tireCondition)
      if (notes) formData.append("notes", notes)

      const result = await compareVehicleInspectionClient(formData)

      if (result.error) {
        setMessage(result.error)
        return
      }

      setInspection(result.inspection)
      setIssues(result.inspection?.issues || [])
      const historyResult = await fetchVehicleInspectionHistoryClient()
      if (!historyResult.error) {
        setHistory(historyResult.history || [])
      }
    } catch (error: any) {
      console.error("Error en handleCompare:", error)
      setMessage(
        error?.message
          ? `Ocurrió un error al comparar las imágenes: ${error.message}`
          : "Ocurrió un error al comparar las imágenes. Revisa la consola y vuelve a intentarlo."
      )
    } finally {
      setLoading(false)
    }
  }

  const renderPreviewList = (title: string, previewUrls: string[], files: File[]) => (
    <Box p={4} border="1px dashed" borderColor="whiteAlpha.300" borderRadius="xl" minH="220px" bg="#070709">
      <Text mb={3} fontWeight="bold" color="yellow.300">{title}</Text>
      {files.length === 0 ? (
        <Text color="gray.500">Carga al menos un ángulo para inspeccionar.</Text>
      ) : (
        <Flex direction={{ base: "column", md: "row" }} gap={3} flexWrap="wrap">
          {files.map((file, idx) => {
            const previewUrl = previewUrls[idx]
            return (
              <Box key={`${file.name}-${idx}`} w={{ base: "100%", md: "48%" }} minH="180px" borderRadius="2xl" overflow="hidden" bg="#0d1014" border="1px solid rgba(255,255,255,0.08)">
                {previewUrl ? (
                  file.type.startsWith("image/") ? (
                    <ChakraImage src={previewUrl} alt={file.name} width="100%" height="180px" objectFit="cover" />
                  ) : file.type.startsWith("video/") ? (
                    <Box h="180px" bg="black">
                      <video
                        src={previewUrl}
                        controls
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                  ) : (
                    <Box p={4}>
                      <Text color="gray.300" fontSize="sm">{file.name}</Text>
                    </Box>
                  )
                ) : (
                  <Box p={4}>
                    <Text color="gray.300" fontSize="sm">{file.name}</Text>
                  </Box>
                )}
                <Box p={3} bg="rgba(0,0,0,0.45)">
                  <Text fontSize="xs" color="gray.400" truncate title={file.name}>{file.name}</Text>
                  <Text fontSize="xs" color="gray.500">{(file.size / 1024).toFixed(1)} KB</Text>
                </Box>
              </Box>
            )
          })}
        </Flex>
      )}
    </Box>
  )

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000"
  const absUrl = (p?: string | null | undefined): string | undefined => {
    if (!p) return undefined
    if (p.startsWith("/")) return `${apiBase}${p}`
    return p
  }

  const renderInspectionThumbnails = (title: string, images?: string[]) => (
    <Box mt={4}>
      <Text color="gray.400" mb={2}>{title}</Text>
      {images && images.length > 0 ? (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
          {images.map((src, idx) => (
            <Box
              key={`${title}-${idx}`}
              minH="100px"
              borderRadius="2xl"
              overflow="hidden"
              border="1px solid rgba(255,255,255,0.08)"
              bg="#0f172a"
            >
              <ChakraImage
                src={absUrl(src)}
                alt={`${title} ${idx + 1}`}
                objectFit="cover"
                width="100%"
                height="100%"
                maxH="120px"
              />
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Text color="gray.500">No hay más ángulos disponibles.</Text>
      )}
    </Box>
  )

  const diffImgRef = useRef<HTMLImageElement | null>(null)
  const beforeImgRef = useRef<HTMLImageElement | null>(null)
  const afterImgRef = useRef<HTMLImageElement | null>(null)

  const [diffNaturalSize, setDiffNaturalSize] = useState({ w: 0, h: 0 })
  const [beforeDisplayedSize, setBeforeDisplayedSize] = useState({ w: 0, h: 0 })
  const [afterDisplayedSize, setAfterDisplayedSize] = useState({ w: 0, h: 0 })
  const [diffDisplayedSize, setDiffDisplayedSize] = useState({ w: 0, h: 0 })
  const [hoveredIssue, setHoveredIssue] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalIssue, setModalIssue] = useState<any | null>(null)
  const [modalZoom, setModalZoom] = useState<number>(1)

  const onDiffImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setDiffNaturalSize({ w: img.naturalWidth || 0, h: img.naturalHeight || 0 })
    setDiffDisplayedSize({ w: img.clientWidth || 0, h: img.clientHeight || 0 })
  }

  const onBeforeImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setBeforeDisplayedSize({ w: img.clientWidth || 0, h: img.clientHeight || 0 })
  }

  const onAfterImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setAfterDisplayedSize({ w: img.clientWidth || 0, h: img.clientHeight || 0 })
  }

  const getScale = (displayed: { w: number; h: number } = diffDisplayedSize) => {
    if (!diffNaturalSize.w || !diffNaturalSize.h || !displayed?.w || !displayed?.h) return 1
    return Math.min(displayed.w / diffNaturalSize.w, displayed.h / diffNaturalSize.h)
  }

  const downloadCrop = async (zoom = modalZoom) => {
    if (!modalIssue || !diffNaturalSize.w || !inspection?.diff_image) return
    try {
      const [x0, y0, x1, y1] = modalIssue._bbox || [0, 0, 0, 0]
      const pad = Math.round(Math.max(8, Math.max(x1 - x0, y1 - y0) * 0.18))
      const cx = Math.max(0, x0 - pad)
      const cy = Math.max(0, y0 - pad)
      const cw = Math.min(diffNaturalSize.w - cx, (x1 - x0) + pad * 2)
      const ch = Math.min(diffNaturalSize.h - cy, (y1 - y0) + pad * 2)

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(cw * zoom))
      canvas.height = Math.max(1, Math.round(ch * zoom))
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = absUrl(inspection.diff_image) || ''
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej()
      })

      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `inspeccion_issue_${(modalIssue._idx ?? 0) + 1}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      })
    } catch (e) {
      console.error('Error al generar descarga del recorte:', e)
    }
  }

  const generatePdf = async () => {
    if (!inspection?.id) return
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://sistemasoland.onrender.com"
      const token = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("access_token="))
        ?.split("=")[1]

      const res = await fetch(`${apiBase}/api/vehicle/inspection/generate_pdf`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ inspection_id: inspection.id }),
      })

      const text = await res.text()
      let body: any = {}
      try { body = JSON.parse(text) } catch { body = { detail: text } }

      if (!res.ok) {
        setMessage(body.detail || `Error ${res.status}`)
        return
      }

      if (body && typeof body === 'object') {
        const updatedInspection = { ...(inspection || {}), ...body }
        setInspection(updatedInspection)
        setMessage('PDF generado correctamente.')
        const historyResult = await fetchVehicleInspectionHistoryClient()
        if (!historyResult.error) {
          setHistory(historyResult.history || [])
        }
        if (body.pdf_file) window.open(absUrl(body.pdf_file), '_blank')
      }
    } catch (e) {
      console.error('Error generando PDF:', e)
      setMessage('Error al generar PDF.')
    }
  }

  const generatePdfForHistoryItem = async (inspectionId: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://sistemasoland.onrender.com"
      const token = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("access_token="))
        ?.split("=")[1]

      const res = await fetch(`${apiBase}/api/vehicle/inspection/generate_pdf`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ inspection_id: inspectionId }),
      })

      const text = await res.text()
      let body: any = {}
      try { body = JSON.parse(text) } catch { body = { detail: text } }

      if (!res.ok) {
        setMessage(body.detail || `Error ${res.status}`)
        return
      }

      setMessage('PDF generado correctamente.')
      const historyResult = await fetchVehicleInspectionHistoryClient()
      if (!historyResult.error) {
        setHistory(historyResult.history || [])
      }
      if (body.pdf_file) {
        window.open(absUrl(body.pdf_file), '_blank')
      }
    } catch (e) {
      console.error('Error generando PDF para historial:', e)
      setMessage('Error al generar PDF del historial.')
    }
  }

  useEffect(() => {
    const updateDisplayedSize = () => {
      const beforeImg = beforeImgRef.current
      const afterImg = afterImgRef.current
      const diffImg = diffImgRef.current
      if (beforeImg) setBeforeDisplayedSize({ w: beforeImg.clientWidth || 0, h: beforeImg.clientHeight || 0 })
      if (afterImg) setAfterDisplayedSize({ w: afterImg.clientWidth || 0, h: afterImg.clientHeight || 0 })
      if (diffImg) setDiffDisplayedSize({ w: diffImg.clientWidth || 0, h: diffImg.clientHeight || 0 })
    }

    updateDisplayedSize()
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateDisplayedSize)
      if (beforeImgRef.current) observer.observe(beforeImgRef.current)
      if (afterImgRef.current) observer.observe(afterImgRef.current)
      if (diffImgRef.current) observer.observe(diffImgRef.current)
      return () => observer.disconnect()
    }

    window.addEventListener("resize", updateDisplayedSize)
    return () => window.removeEventListener("resize", updateDisplayedSize)
  }, [inspection?.before_image, inspection?.after_image, inspection?.diff_image])

  useEffect(() => {
    const img = diffImgRef.current
    if (!img) return

    const updateSize = () => {
      setDiffDisplayedSize({ w: img.clientWidth || 0, h: img.clientHeight || 0 })
    }

    updateSize()
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize)
      observer.observe(img)
      return () => observer.disconnect()
    }

    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [inspection?.diff_image])

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <style>{`
        @keyframes scanMove { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
        .scan-overlay { background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,80,80,0.08) 45%, rgba(255,255,255,0.02) 100%); overflow: hidden; }
        .scan-overlay::after { content: ''; position: absolute; inset: 0; transform: translateX(-120%); background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,80,80,0.24) 50%, rgba(255,255,255,0) 100%); animation: scanMove 2.4s linear infinite; }
        .issue-box { transition: transform 220ms ease, box-shadow 220ms ease; transform-style: preserve-3d; border-radius: 20px; background: rgba(255,20,20,0.14); box-shadow: 0 18px 50px rgba(255,80,80,0.24); }
        .issue-box::before { content: ''; position: absolute; inset: 0; border-radius: inherit; border: 1px solid rgba(255,255,255,0.16); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08); pointer-events: none; }
        .issue-box::after { content: ''; position: absolute; left: 8px; bottom: -10px; width: calc(100% - 16px); height: 14px; background: linear-gradient(180deg, rgba(255,20,20,0.22), transparent); border-radius: 7px; filter: blur(1px); transform: perspective(600px) rotateX(70deg); pointer-events: none; }
        .issue-box:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 24px 78px rgba(255,40,40,0.36); }
        .issue-box.pulse { animation: pulse 1.8s ease-in-out infinite; }
        .issue-preview { width: 240px; height: 160px; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 22px 52px rgba(0,0,0,0.42); }
        .image-panel { position: relative; overflow: hidden; border-radius: 36px; transform-style: preserve-3d; perspective: 1800px; transition: transform 0.32s ease, box-shadow 0.32s ease; min-height: 560px; max-height: 980px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.00); backdrop-filter: blur(20px); box-shadow: inset 0 0 100px rgba(255,255,255,0.02), 0 28px 80px rgba(0,0,0,0.22);
        }
        .image-panel:hover { transform: translateY(-16px) rotateX(2.2deg) rotateY(-1.3deg); box-shadow: 0 48px 150px rgba(0,0,0,0.40); }
        .image-panel::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 22% 18%, rgba(56,189,248,0.16), transparent 28%); pointer-events: none; }
        .image-panel::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 85% 90%, rgba(255,255,255,0.10), transparent 18%); pointer-events: none; }
        .image-card { position: relative; background: rgba(255,255,255,0.02); border-radius: 36px; box-shadow: 0 42px 160px rgba(0,0,0,0.24); border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
        .image-card::before { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 0 0 48px rgba(255,255,255,0.05); }
      `}</style>
      <Heading size="lg" color="yellow.400" mb={4}>Inspección Vehicular</Heading>
      <Text color="gray.400" mb={6} maxW="4xl">
        Inspección vehicular inteligente con IA: analiza cada ángulo del vehículo y detecta automáticamente cambios en neumáticos, focos, vidrios, pintura y suciedad.
      </Text>
      {message && (
        <Box mb={4} p={4} bg="#7C1200" borderRadius="lg" border="1px solid" borderColor="#B92B27">
          <Text color="white">{message}</Text>
        </Box>
      )}

      <Box bg="rgba(255,255,255,0.02)" p={6} borderRadius="3xl" border="1px solid" borderColor="rgba(255,255,255,0.08)" mb={6} boxShadow="0 40px 120px rgba(0,0,0,0.24)">
        <Box mb={6}>
          <Text color="gray.400" mb={2}>Vehículo inspeccionado</Text>
          <select
            value={vehicleId}
            onChange={(event) => setVehicleId(event.target.value)}
            style={{
              background: "#0f172a",
              color: "white",
              border: "1px solid rgba(148,163,184,0.25)",
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
            }}
            required
          >
            <option value="">Selecciona un vehículo</option>
            {vehicles.map((vehicle) => (
              <option key={String(vehicle.id)} value={String(vehicle.id)}>
                {vehicle.license_plate} - {vehicle.model}
              </option>
            ))}
          </select>
          {selectedVehicle && (
            <Text color="gray.500" fontSize="sm" mt={2}>
              {selectedVehicle.license_plate} seleccionado
            </Text>
          )}
        </Box>

        <Flex direction={{ base: "column", md: "row" }} gap={6} mb={6}>
          <Box flex={1} p={5} className="hero-note">
            <Text color="gray.400" mb={2}>Módulo de escaneo IA</Text>
            <Heading size="sm" color="cyan.200" mb={3}>IA aplicada a inspección de vehículos</Heading>
            <Text color="gray.300" fontSize="sm" mb={4}>
              Usa análisis visual inteligente para identificar daños, suciedad, rayones y fallas en componentes críticos del vehículo.
            </Text>
            <Stack gap={3}>
              <Box>
                <Text color="gray.400" fontSize="sm">Motor</Text>
                <Text color="white" fontSize="lg" fontWeight="bold">{inspection?.analysis_engine ?? scanEngine}</Text>
                <Text color="gray.500" fontSize="xs">{inspection?.analysis_mode ?? scanMode}</Text>
              </Box>
              <Badge colorScheme="cyan" variant="subtle">Futuro inmediato</Badge>
            </Stack>
          </Box>

          <Stack flex={1} gap={4}>
            <Box p={4} bg="#08090e" borderRadius="2xl" border="1px solid rgba(148,163,184,0.12)">
              <Text color="gray.400" mb={2}>Puntaje de condición</Text>
              <Box bg="rgba(255,255,255,0.08)" borderRadius="xl" overflow="hidden" mb={3} h="14px">
                <Box
                  h="100%"
                  w={`${inspection?.score ?? 0}%`}
                  bg="linear-gradient(90deg, rgba(56,189,248,1) 0%, rgba(14,165,233,1) 100%)"
                  borderRadius="xl"
                />
              </Box>
              <Flex justifyContent="space-between" gap={4}>
                <Text color="white" fontWeight="bold">{inspection?.score != null && !isNaN(Number(inspection.score)) ? `${Number(inspection.score).toFixed(1)}%` : "Esperando"}</Text>
                <Text color="gray.400">{inspection?.score != null && !isNaN(Number(inspection.score)) ? scoreStatus(Number(inspection.score)) : "Listo para escanear"}</Text>
              </Flex>
            </Box>
            <Box p={4} bg="#08090e" borderRadius="2xl" border="1px solid rgba(148,163,184,0.12)">
              <Text color="gray.400" mb={2}>Progreso de detección</Text>
              <Text color="white" fontSize="2xl" fontWeight="bold">{inspection?.change_percent != null && !isNaN(Number(inspection.change_percent)) ? `${Number(inspection.change_percent).toFixed(1)}%` : "—"}</Text>
              <Text color="gray.500" fontSize="sm">Diferencias estimadas entre salida y regreso.</Text>
            </Box>
          </Stack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Box>
            <Text color="gray.400" mb={2}>Foto / video de salida</Text>
            <Box mb={3}>
              <Button
                as="label"
                cursor="pointer"
                bgGradient="linear(to-r, cyan.500, blue.500)"
                color="white"
                _hover={{ opacity: 0.92 }}
                _active={{ opacity: 0.85 }}
              >
                Seleccionar ángulos
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleFilesChange(e, setBeforeFiles, setBeforePreviewUrls, beforePreviewUrls)}
                  style={{ display: "none" }}
                />
              </Button>
              {beforeFiles.length > 0 && (
                <Text mt={2} fontSize="sm" color="gray.300">
                  {beforeFiles.length} archivo(s) seleccionado(s)
                </Text>
              )}
            </Box>
            {renderPreviewList("Salida (Antes)", beforePreviewUrls, beforeFiles)}
          </Box>
          <Box>
            <Text color="gray.400" mb={2}>Foto / video de regreso</Text>
            <Box mb={3}>
              <Button
                as="label"
                cursor="pointer"
                bgGradient="linear(to-r, cyan.500, blue.500)"
                color="white"
                _hover={{ opacity: 0.92 }}
                _active={{ opacity: 0.85 }}
              >
                Seleccionar ángulos
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleFilesChange(e, setAfterFiles, setAfterPreviewUrls, afterPreviewUrls)}
                  style={{ display: "none" }}
                />
              </Button>
              {afterFiles.length > 0 && (
                <Text mt={2} fontSize="sm" color="gray.300">
                  {afterFiles.length} archivo(s) seleccionado(s)
                </Text>
              )}
            </Box>
            {renderPreviewList("Regreso (Después)", afterPreviewUrls, afterFiles)}
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={4}>
          <Box p={4} bg="#08090e" borderRadius="2xl" border="1px solid rgba(148,163,184,0.12)">
            <Text color="gray.400" mb={2}>Nivel de gasolina</Text>
            <select
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              style={{ background: '#0f172a', color: 'white', borderColor: 'rgba(255,255,255,0.12)', width: '100%', padding: '8px', borderRadius: '8px' }}
            >
              <option value="">Selecciona nivel</option>
              <option value="Lleno">Lleno</option>
              <option value="3/4">3/4</option>
              <option value="1/2">1/2</option>
              <option value="1/4">1/4</option>
              <option value="Vacío">Vacío</option>
            </select>
          </Box>
          <Box p={4} bg="#08090e" borderRadius="2xl" border="1px solid rgba(148,163,184,0.12)">
            <Text color="gray.400" mb={2}>Condición de neumáticos</Text>
            <select
              value={tireCondition}
              onChange={(e) => setTireCondition(e.target.value)}
              style={{ background: '#0f172a', color: 'white', borderColor: 'rgba(255,255,255,0.12)', width: '100%', padding: '8px', borderRadius: '8px' }}
            >
              <option value="">Selecciona condición</option>
              <option value="Excelente">Excelente</option>
              <option value="Bueno">Bueno</option>
              <option value="Regular">Regular</option>
              <option value="Desgastado">Desgastado</option>
              <option value="Requiere revisión">Requiere revisión</option>
            </select>
          </Box>
        </SimpleGrid>

        <Box mt={4}>
          <Text color="gray.400" mb={2}>Notas adicionales</Text>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            bg="#0f172a"
            color="white"
            borderColor="rgba(255,255,255,0.12)"
            minH="140px"
          />
        </Box>

        <Button
          colorScheme="cyan"
          size="lg"
          mt={6}
          onClick={handleCompare}
          loading={loading}
          bgGradient="linear(to-r, cyan.500, blue.500)"
          _hover={{ opacity: 0.95 }}
        >
          Lanza el análisis IA
        </Button>
      </Box>

      {inspection && (
        <Box bg="#0f0f10" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" mb={6} boxShadow="0 0 60px rgba(56,189,248,0.08)">
          <Heading size="md" mb={4}>Resultado de la comparación</Heading>
          {renderInspectionThumbnails("Vistas de salida", inspection.before_images)}
          {renderInspectionThumbnails("Vistas de regreso", inspection.after_images)}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4} alignItems="start">
            <Box>
              <Text color="gray.400" mb={2}>Contexto de inspección</Text>
              <Stack gap={2}>
                <Text color="white" fontWeight="bold">Gasolina</Text>
                <Text color="gray.300">{inspection.fuel_level || 'No registrado'}</Text>
                <Text color="white" fontWeight="bold">Neumáticos</Text>
                <Text color="gray.300">{inspection.tire_condition || 'No registrado'}</Text>
                {inspection.summary_tags?.length ? (
                  <Box>
                    <Text color="white" fontWeight="bold" mb={2}>Etiquetas</Text>
                    <Flex wrap="wrap" gap={2}>
                      {inspection.summary_tags.map((tag: string, idx: number) => (
                        <Badge key={`tag-${idx}`} colorScheme="cyan" variant="subtle">{tag}</Badge>
                      ))}
                    </Flex>
                  </Box>
                ) : null}
              </Stack>
            </Box>
            <Box p={4} bg="#08090e" borderRadius="2xl" border="1px solid rgba(148,163,184,0.12)">
              <Text color="gray.400" mb={2}>Resumen rápido</Text>
              <Stack gap={2}>
                <Text color="white">Puntaje: {inspection?.score != null && !isNaN(Number(inspection.score)) ? `${Number(inspection.score).toFixed(1)}%` : '—'}</Text>
                <Text color="white">Cambio detectado: {inspection?.change_percent != null && !isNaN(Number(inspection.change_percent)) ? `${Number(inspection.change_percent).toFixed(1)}%` : '—'}</Text>
                <Text color="gray.400">{inspection?.score != null && !isNaN(Number(inspection.score)) ? scoreStatus(Number(inspection.score)) : 'Esperando resultados'}</Text>
                <Button size="sm" mt={2} onClick={generatePdf} colorScheme="teal">Guardar en PDF</Button>
              </Stack>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, xl: 3 }} gap={6} mb={4}>
            <Box className="image-card" p={4} borderRadius="3xl" minH="360px">
              <Text color="gray.400" mb={2}>Salida principal</Text>
              {inspection.before_image ? (
                <Box className="image-panel">
                  <ChakraImage
                    ref={beforeImgRef}
                    src={absUrl(inspection.before_image)}
                    alt="Salida"
                    borderRadius="2xl"
                    boxShadow="0 30px 120px rgba(0,0,0,0.38)"
                    width="100%"
                    height="320px"
                    style={{ objectFit: 'cover' }}
                    onLoad={onBeforeImageLoad}
                  />
                </Box>
              ) : (
                <Text color="gray.500">Sin imagen disponible</Text>
              )}
            </Box>

            <Box className="image-card" p={4} borderRadius="3xl" minH="360px">
              <Text color="gray.400" mb={2}>Regreso principal</Text>
              {inspection.after_image ? (
                <Box className="image-panel" position="relative">
                  <ChakraImage
                    ref={afterImgRef}
                    src={absUrl(inspection.after_image)}
                    alt="Regreso"
                    borderRadius="2xl"
                    boxShadow="0 30px 120px rgba(0,0,0,0.38)"
                    width="100%"
                    height="320px"
                    style={{ objectFit: 'cover' }}
                    onLoad={onAfterImageLoad}
                  />
                  <Box position="absolute" top={4} left={4} px={3} py={1} bg="rgba(0,0,0,0.42)" borderRadius="full" fontSize="xs" letterSpacing="widest">
                    Vista 3D
                  </Box>
                </Box>
              ) : (
                <Text color="gray.500">Sin imagen disponible</Text>
              )}
            </Box>

            <Box className="image-card" p={4} borderRadius="3xl" minH="360px">
              <Text color="gray.400" mb={2}>Diferencias</Text>
              {inspection.after_image ? (
                <Box className="image-panel" position="relative" border="2px solid rgba(255,20,20,0.22)" minH="320px">
                  <ChakraImage
                    ref={diffImgRef}
                    src={absUrl(inspection.diff_image) || absUrl(inspection.after_image)}
                    alt="Diferencias"
                    borderRadius="2xl"
                    boxShadow="0 35px 130px rgba(0,0,0,0.28)"
                    width="100%"
                    height="320px"
                    style={{ objectFit: 'cover' }}
                    onLoad={onDiffImageLoad}
                  />
                  <Box position="absolute" top={4} left={4} px={3} py={1} bg="rgba(255,255,255,0.14)" borderRadius="full" fontSize="xs" letterSpacing="widest">
                    Regreso con diferencias
                  </Box>
                  {loading && (
                    <Box className="scan-overlay" position="absolute" top={0} left={0} right={0} bottom={0} borderRadius="xl" pointerEvents="none" />
                  )}

                  {issues.map((issue, idx) => {
                    const [x0, y0, x1, y1] = issue.bbox ?? [0, 0, 0, 0]
                    const issueX0 = Number(x0)
                    const issueY0 = Number(y0)
                    const issueX1 = Number(x1)
                    const issueY1 = Number(y1)
                    const issueWidth = issueX1 - issueX0
                    const issueHeight = issueY1 - issueY0
                    const scale = getScale()
                    const x = issueX0 * scale
                    const y = issueY0 * scale
                    const w = issueWidth * scale
                    const h = issueHeight * scale
                    const key = `issue-${idx}`
                    const previewUrl = absUrl(inspection.diff_image) || absUrl(inspection.after_image) || undefined
                    return (
                      <Box
                        key={key}
                        position="absolute"
                        style={{ left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }}
                      >
                        <Box
                          title={`Falla ${issue.idx ?? idx + 1}: ${issue.label ?? 'Cambio'}`}
                          position="absolute"
                          style={{ left: 0, top: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                          border="2px solid rgba(255,120,120,0.95)"
                          borderRadius="20px"
                          className={`issue-box ${hoveredIssue === idx ? 'pulse' : ''}`}
                          boxShadow="0 0 80px rgba(255,60,60,0.32), 0 18px 40px rgba(0,0,0,0.16)"
                          _hover={{ transform: 'translateZ(2px) scale(1.03)', boxShadow: '0 0 110px rgba(255,60,60,0.42)' }}
                          background="rgba(255,20,20,0.16)"
                          zIndex={6}
                          onMouseEnter={() => setHoveredIssue(idx)}
                          onMouseLeave={() => setHoveredIssue((s) => (s === idx ? null : s))}
                          onClick={() => {
                            setModalIssue({ ...issue, _idx: idx, _bbox: [issueX0, issueY0, issueX1, issueY1] })
                            setIsModalOpen(true)
                          }}
                        >
                          <Box position="absolute" top={8} left={8} bg="rgba(0,0,0,0.75)" color="white" px={3} py={1} borderRadius="full" fontSize="xs">
                            #{issue.idx ?? idx + 1}
                          </Box>
                        </Box>

                        {hoveredIssue === idx && previewUrl && diffDisplayedSize.w > 0 && (
                          <Box position="absolute" right={-150} top={0} className="issue-preview" zIndex={5}>
                            <Box
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${previewUrl})`,
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: `${diffDisplayedSize.w}px ${diffDisplayedSize.h}px`,
                                backgroundPosition: `-${issueX0 * scale}px -${issueY0 * scale}px`,
                                transform: 'translateZ(0)'
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    )
                  })}

                  {inspection.recommendations && Array.isArray(inspection.recommendations) && (
                    <Box as="ul" mt={3} pl={4}>
                      {inspection.recommendations.map((rec: string, index: number) => (
                        <Box as="li" key={index}>{rec}</Box>
                      ))}
                    </Box>
                  )}
                  {/* Lista detallada de diferencias: individualmente explicadas */}
                  <Box mt={4}>
                    <Text color="cyan.200" fontWeight="bold" mb={2}>Diferencias detectadas</Text>
                    {issues && issues.length > 0 ? (
                      <Stack gap={3}>
                        {issues.map((issue: any, idx: number) => {
                          const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = issue.bbox || []
                          const issueX0 = Number(x0)
                          const issueY0 = Number(y0)
                          const issueX1 = Number(x1)
                          const issueY1 = Number(y1)
                          const iw = Math.max(1, issueX1 - issueX0)
                          const ih = Math.max(1, issueY1 - issueY0)
                          const scale = getScale()
                          const bgW = Math.max(1, diffDisplayedSize.w)
                          const bgH = Math.max(1, diffDisplayedSize.h)
                          const bgPosX = -Math.round(issueX0 * scale)
                          const bgPosY = -Math.round(issueY0 * scale)
                          return (
                            <Box key={`detail-${idx}`} p={3} borderRadius="lg" bg="#09101a" border="1px solid rgba(255,255,255,0.04)">
                              <Flex gap={3} alignItems="center">
                                <Box width="120px" height="84px" borderRadius="md" overflow="hidden" border="1px solid rgba(255,255,255,0.06)">
                                  <Box style={{ width: '100%', height: '100%', backgroundImage: `url(${absUrl(inspection.diff_image)})`, backgroundRepeat: 'no-repeat', backgroundSize: `${bgW}px ${bgH}px`, backgroundPosition: `${bgPosX}px ${bgPosY}px` }} />
                                </Box>
                                <Box flex={1}>
                                  <Flex alignItems="baseline" gap={3}>
                                    <Text fontWeight="bold" color="white">#{issue.idx ?? idx + 1} — {issue.label ?? 'Cambio'}</Text>
                                    <Badge colorScheme={issue.engine === 'clip' ? 'green' : 'orange'}>
                                      {issue.engine === 'clip' ? 'IA real' : 'Heurística'}
                                    </Badge>
                                    <Badge colorScheme="blue">{issue.engine ?? 'unknown'}</Badge>
                                    <Badge colorScheme="red">{(issue.area_pct ?? 0).toFixed ? `${Number(issue.area_pct).toFixed(2)}%` : `${issue.area_pct}%`}</Badge>
                                  </Flex>
                                  <Text color="gray.300" fontSize="sm" truncate mt={1}>{issue.recommendation ?? inspection.recommendations?.[0] ?? 'Sin descripción'}</Text>
                                  <Text color="gray.400" fontSize="xs" mt={1}>Sección: {issue.section ?? 'No definida'}</Text>
                                  <Flex gap={2} mt={2}>
                                    <Button size="sm" onClick={() => { setModalIssue({ ...issue, _idx: idx, _bbox: [issueX0, issueY0, issueX1, issueY1] }); setIsModalOpen(true); }}>Ver detalle</Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setHoveredIssue(idx); setTimeout(() => setHoveredIssue(null), 2000); }}>Resaltar</Button>
                                  </Flex>
                                </Box>
                              </Flex>
                            </Box>
                          )
                        })}
                      </Stack>
                    ) : (
                      <Text color="gray.500">No se detectaron diferencias individuales.</Text>
                    )}
                  </Box>
                </Box>
              ) : (
                <Text color="gray.500">Sin imagen disponible</Text>
              )}
            </Box>
          </SimpleGrid>

          <Box bg="#07080d" p={4} borderRadius="2xl" border="1px solid" borderColor="cyan.400">
            <Text color="cyan.300" fontWeight="bold" mb={2}>Informe automático de inspección con IA</Text>
            <Text color="gray.300" whiteSpace="pre-wrap">{inspection.report}</Text>
            <Flex mt={4} gap="1.5rem" flexWrap="wrap" alignItems="center">
              <Text color="gray.400">Puntaje: {inspection?.score != null && !isNaN(Number(inspection.score)) ? `${Number(inspection.score).toFixed(1)}%` : "—"}</Text>
              <Text color="gray.400">Cambio detectado: {inspection?.change_percent != null && !isNaN(Number(inspection.change_percent)) ? `${Number(inspection.change_percent).toFixed(1)}%` : "—"}</Text>
              <Text color="gray.400">Motor: {inspection?.analysis_engine ?? scanEngine}</Text>
              <Text color="gray.400">Modo: {inspection?.analysis_mode ?? scanMode}</Text>
              <Button size="md" ml="auto" mt={{ base: 4, md: 0 }} onClick={generatePdf} bg="teal.400" color="black" _hover={{ bg: 'teal.500' }}>
                Guardar informe en PDF
              </Button>
            </Flex>
            {inspection.pdf_file && (
              <Box mt={4}>
                <a href={absUrl(inspection.pdf_file)} target="_blank" rel="noreferrer">
                  <Button size="sm" colorScheme="cyan">
                    Ver PDF generado
                  </Button>
                </a>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Modal: zoom crop preview for selected issue (simple implementation) */}
      {isModalOpen && (
        <Box position="fixed" inset={0} zIndex={1400} display="flex" alignItems="center" justifyContent="center">
          <Box position="absolute" inset={0} bg="blackAlpha.700" onClick={() => { setIsModalOpen(false); setModalIssue(null) }} />
          <Box zIndex={1401} bg="#0b0b0c" color="white" borderRadius="lg" p={6} width="90%" maxW="920px" boxShadow="0 40px 120px rgba(0,0,0,0.6)">
            <Button size="sm" onClick={() => { setIsModalOpen(false); setModalIssue(null) }} ml="auto" mb={3}>Cerrar</Button>
            {modalIssue && (() => {
              const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = modalIssue._bbox || []
              const pad = Math.round(Math.max(8, Math.max(x1 - x0, y1 - y0) * 0.18))
              const cx = Math.max(0, x0 - pad)
              const cy = Math.max(0, y0 - pad)
              const cw = Math.max(1, Math.min(diffNaturalSize.w - cx, (x1 - x0) + pad * 2))
              const ch = Math.max(1, Math.min(diffNaturalSize.h - cy, (y1 - y0) + pad * 2))
              const bgW = Math.max(1, diffNaturalSize.w * modalZoom)
              const bgH = Math.max(1, diffNaturalSize.h * modalZoom)
              const bgPosX = -Math.round(cx * modalZoom)
              const bgPosY = -Math.round(cy * modalZoom)
              return (
                <Box>
                  <Heading size="sm" mb={3}>{`Falla ${modalIssue.idx ?? modalIssue._idx + 1} — ${modalIssue.label ?? 'Cambio'}`}</Heading>
                  <Box borderRadius="lg" overflow="hidden" border="1px solid rgba(255,255,255,0.06)">
                    <Box
                      style={{
                        width: '100%',
                        height: '520px',
                        backgroundImage: `url(${absUrl(inspection.diff_image)})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: `${bgW}px ${bgH}px`,
                        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                        backgroundOrigin: '0 0'
                      }}
                    />
                  </Box>
                  <Flex mt={4} gap={3} alignItems="center">
                    <Button size="sm" onClick={() => setModalZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}>-</Button>
                    <Button size="sm" onClick={() => setModalZoom((z) => Number((z + 0.25).toFixed(2)))}>{`+`}</Button>
                    <Box mx={3}><Text fontSize="sm">Zoom: {modalZoom.toFixed(2)}x</Text></Box>
                    <Button colorScheme="cyan" size="sm" onClick={() => downloadCrop()} ml="auto">Descargar recorte</Button>
                  </Flex>
                </Box>
              )
            })()}
          </Box>
        </Box>
      )}

      <Box bg="#0c0f17" p={6} borderRadius="2xl" border="1px solid" borderColor="rgba(56,189,248,0.16)">
        <Heading size="md" mb={4} color="cyan.100">Historial de inspecciones</Heading>
        {(!Array.isArray(history) || history.length === 0) && !inspection ? (
          <Text color="gray.400">Aún no hay inspecciones registradas.</Text>
        ) : !Array.isArray(history) ? (
          <Text color="red.300">Historial inválido: {String(history)}</Text>
        ) : (
          <>
            <Box mb={6} bg="#020617" borderRadius="2xl" border="1px solid rgba(255,255,255,0.08)" overflowX="auto" px={4} py={2}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ color: '#7dd3fc', textAlign: 'left', padding: '10px 8px' }}>Fecha / Hora</th>
                    <th style={{ color: '#7dd3fc', textAlign: 'left', padding: '10px 8px' }}>Puntaje</th>
                    <th style={{ color: '#7dd3fc', textAlign: 'left', padding: '10px 8px' }}>Cambio</th>
                    <th style={{ color: '#7dd3fc', textAlign: 'left', padding: '10px 8px' }}>Estado</th>
                    <th style={{ color: '#7dd3fc', textAlign: 'left', padding: '10px 8px' }}>Detalle</th>
                    <th style={{ color: '#7dd3fc', textAlign: 'left', padding: '10px 8px' }}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows().map((item) => (
                    <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '10px 8px' }}>{new Date(item.created_at).toLocaleString()}</td>
                      <td style={{ padding: '10px 8px' }}>{item.score != null && !isNaN(Number(item.score)) ? `${Number(item.score).toFixed(1)}%` : '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{item.change_percent != null && !isNaN(Number(item.change_percent)) ? `${Number(item.change_percent).toFixed(1)}%` : '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{item.score != null && !isNaN(Number(item.score)) ? scoreStatus(Number(item.score)) : 'Pendiente'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <Text color="gray.300" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {getReportSummary(item.report)}
                        </Text>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {item.pdf_file ? (
                          <a href={absUrl(item.pdf_file)} target="_blank" rel="noreferrer">
                            <Button size="xs" colorScheme="teal">
                              Ver PDF
                            </Button>
                          </a>
                        ) : (
                          <Button size="xs" onClick={() => generatePdfForHistoryItem(item.id)} colorScheme="teal">
                            Guardar en PDF
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <Box display="grid" gap="1rem">
              {history.map((item) => {
              const parseAiItem = (report?: string) => {
                if (!report) return []
                const lines = report.split(/\r?\n/)
                const parsed: Array<{idx:number,label:string,confidence:number,thumbnail:string}> = []
                const re = /^(\s*)(\d+)\s*\)\s*(.+?)\s*\(([0-9]+(?:\.[0-9]+)?)%\)\s*-\s*(\/static\/inspections\/\S+)$/i
                for (const l of lines) {
                  const m = l.match(re)
                  if (m) {
                    try {
                      parsed.push({ idx: parseInt(m[2], 10), label: m[3].trim(), confidence: parseFloat(m[4]) / 100.0, thumbnail: m[5] })
                    } catch (e) {}
                  }
                }
                return parsed
              }
              const itemAi = parseAiItem(item.report)

              return (
                <Box
                  key={item.id}
                  p={5}
                  bg="rgba(4, 12, 28, 0.85)"
                  borderRadius="3xl"
                  border="1px solid rgba(56,189,248,0.18)"
                  boxShadow="0 20px 60px rgba(0, 0, 0, 0.35)"
                  backdropFilter="blur(16px)"
                >
                  <HStack justifyContent="space-between" mb={4} flexWrap="wrap">
                    <Box>
                      <Text fontSize="sm" color="cyan.200" fontWeight="bold">{new Date(item.created_at).toLocaleString()}</Text>
                      <Text fontSize="xs" color="gray.500">Escaneo IA registrado</Text>
                    </Box>
                    <Badge colorScheme="cyan" variant="subtle">Cambio: {item.change_percent}%</Badge>
                    {item.pdf_file ? (
                      <a href={absUrl(item.pdf_file)} target="_blank" rel="noreferrer">
                        <Button size="sm" ml={3} colorScheme="teal">Ver PDF</Button>
                      </a>
                    ) : (
                      <Button size="sm" ml={3} onClick={() => generatePdfForHistoryItem(item.id)} colorScheme="teal">Guardar en PDF</Button>
                    )}
                  </HStack>

                  <Box mb={4} p={4} bg="rgba(14, 29, 58, 0.7)" borderRadius="2xl" border="1px dashed rgba(92, 184, 255, 0.2)">
                    <Text fontSize="sm" color="cyan.200" mb={2}>Resumen de inspección</Text>
                    <Text color="gray.300" whiteSpace="pre-wrap">{item.report}</Text>
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 4 }} gap={3} mb={2}>
                    {item.before_image && (
                      <Box borderRadius="2xl" overflow="hidden" border="1px solid rgba(255,255,255,0.08)">
                        <Box position="relative">
                          <ChakraImage src={absUrl(item.before_image)} alt="Salida" objectFit="cover" width="100%" height="120px" />
                          {item.report && itemAi.length > 0 && <Box position="absolute" top={2} left={2} px={2} py={1} bg="rgba(255,80,80,0.14)" borderRadius="md" fontSize="xs" color="white">IA</Box>}
                        </Box>
                      </Box>
                    )}
                    {item.after_image && (
                      <Box borderRadius="2xl" overflow="hidden" border="1px solid rgba(255,255,255,0.08)">
                        <Box position="relative">
                          <ChakraImage src={absUrl(item.after_image)} alt="Regreso" objectFit="cover" width="100%" height="120px" />
                          {item.report && itemAi.length > 0 && <Box position="absolute" top={2} left={2} px={2} py={1} bg="rgba(255,80,80,0.14)" borderRadius="md" fontSize="xs" color="white">IA</Box>}
                        </Box>
                      </Box>
                    )}
                    {item.diff_image && (
                      <Box borderRadius="2xl" overflow="hidden" border="1px solid rgba(255,255,255,0.08)">
                        <Box position="relative">
                          <ChakraImage src={absUrl(item.diff_image)} alt="Diferencias" objectFit="cover" width="100%" height="120px" />
                          {item.report && itemAi.length > 0 && <Box position="absolute" top={2} left={2} px={2} py={1} bg="rgba(255,80,80,0.14)" borderRadius="md" fontSize="xs" color="white">IA</Box>}
                        </Box>
                      </Box>
                    )}
                    {itemAi.length > 0 && (
                      <Box p={3} bg="rgba(12, 22, 41, 0.75)" borderRadius="2xl" border="1px solid rgba(56,189,248,0.14)">
                        <Text color="cyan.200" mb={2} fontWeight="bold">Conclusiones IA</Text>
                        <Stack gap={2}>
                          {itemAi.slice(0, 3).map((r) => (
                            <Box key={`h-${r.idx}`}>
                              <Text color="gray.300" fontSize="sm">{r.idx}. {r.label}</Text>
                              <Text color="gray.500" fontSize="xs">Confianza {(r.confidence * 100).toFixed(0)}%</Text>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </SimpleGrid>
                </Box>
              )
            })}
          </Box>
        </>
        )}
      </Box>
    </Box>
  )
}
