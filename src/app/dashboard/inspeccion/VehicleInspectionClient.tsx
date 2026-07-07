"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { compareVehicleInspectionAction, fetchVehicleInspectionHistory } from "@/actions/vehiculos"

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
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id || "")
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforePreviewUrl, setBeforePreviewUrl] = useState<string | null>(null)
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [inspection, setInspection] = useState<any | null>(null)
  const [aiResults, setAiResults] = useState<Array<{idx:number,label:string,confidence:number,thumbnail:string}>>([])
  const [history, setHistory] = useState<any[]>([])

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === vehicleId) || null,
    [vehicleId, vehicles],
  )

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    previewSetter: (value: string | null) => void,
    currentPreviewUrl: string | null,
  ) => {
    const file = event.target.files?.[0] ?? null
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl)
    }
    previewSetter(file ? URL.createObjectURL(file) : null)
    setter(file)
  }

  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (beforePreviewUrl) URL.revokeObjectURL(beforePreviewUrl)
      if (afterPreviewUrl) URL.revokeObjectURL(afterPreviewUrl)
    }
  }, [beforePreviewUrl, afterPreviewUrl])

  const handleCompare = async () => {
    if (!vehicleId || !beforeFile || !afterFile) {
      setMessage("Selecciona un vehículo y carga ambas imágenes o videos.")
      return
    }

    setMessage(null)
    const formData = new FormData()
    formData.append("vehicle_id", vehicleId)
    formData.append("before_image", beforeFile)
    formData.append("after_image", afterFile)
    if (notes) formData.append("notes", notes)

    setLoading(true)
    const result = await compareVehicleInspectionAction(formData)
    setLoading(false)

    if (result?.needsLogin) {
      setMessage("Sesión expirada. Redirigiendo a inicio de sesión...")
      // Small delay to show message, then redirect
      setTimeout(() => {
        window.location.href = "/"
      }, 800)
      return
    }

    if (result.error) {
      setMessage(result.error)
      return
    }

    setInspection(result.inspection)
    // parse IA results (if any) from the report lines like: "1 ) label (12.3%) - /static/inspections/thumb_...jpg"
    const parseAi = (report?: string) => {
      if (!report) return []
      const lines = report.split(/\r?\n/)
      const parsed: Array<{idx:number,label:string,confidence:number,thumbnail:string}> = []
      const re = /^(\s*)(\d+)\s*\)\s*(.+?)\s*\(([0-9]+(?:\.[0-9]+)?)%\)\s*-\s*(\/static\/inspections\/\S+)$/i
      for (const l of lines) {
        const m = l.match(re)
        if (m) {
          try {
            parsed.push({ idx: parseInt(m[2], 10), label: m[3].trim(), confidence: parseFloat(m[4]) / 100.0, thumbnail: m[5] })
          } catch (e) {
            // ignore parse errors
          }
        }
      }
      return parsed
    }

    setAiResults(parseAi(result.inspection?.report))
    const historyResult = await fetchVehicleInspectionHistory()
    if (!historyResult.error) {
      setHistory(historyResult.history || [])
    }
  }

  const renderPreview = (title: string, file: File | null, previewUrl: string | null) => (
    <Box p={4} border="1px dashed" borderColor="whiteAlpha.300" borderRadius="xl" minH="220px" bg="#070709">
      <Text mb={3} fontWeight="bold" color="yellow.300">{title}</Text>
      {file ? (
        previewUrl ? (
          file.type.startsWith("image/") ? (
            <Image src={previewUrl} alt={file.name} maxH="240px" objectFit="contain" borderRadius="md" mb={3} />
          ) : file.type.startsWith("video/") ? (
            <Box mb={3} overflow="hidden" borderRadius="lg" bg="black">
              <video
                src={previewUrl}
                controls
                style={{ width: "100%", maxHeight: 240, display: "block" }}
              />
            </Box>
          ) : (
            <Text fontSize="sm" color="gray.300">{file.name}</Text>
          )
        ) : (
          <Text fontSize="sm" color="gray.300">{file.name}</Text>
        )
      ) : (
        <Text color="gray.500">Arrastra o selecciona un archivo de imagen o video.</Text>
      )}
    </Box>
  )

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const absUrl = (p?: string | null): string | undefined => {
    if (!p) return undefined
    if (p.startsWith("/")) return `${apiBase}${p}`
    return p
  }

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="lg" color="yellow.400" mb={4}>Inspección Vehicular</Heading>
      <Text color="gray.400" mb={6} maxW="4xl">
        Compara el estado del vehículo entre la salida y el regreso con IA para detectar diferencias visuales y generar un informe profesional.
      </Text>
      {message && (
        <Box mb={4} p={4} bg="#7C1200" borderRadius="lg" border="1px solid" borderColor="#B92B27">
          <Text color="white">{message}</Text>
        </Box>
      )}

      <Box bg="#0f0f10" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" mb={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          <Box>
            <Text color="gray.400" mb={2}>Vehículo</Text>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              style={{
                width: "100%",
                background: "#0b0b0c",
                color: "white",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "0.75rem",
                padding: "0.8rem",
                fontSize: "0.95rem",
                outline: "none",
              }}
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} — {vehicle.model}
                </option>
              ))}
            </select>
            {selectedVehicle && (
              <Box mt={4} p={4} bg="#08090e" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                <Text color="yellow.300" fontWeight="bold">Estado del vehículo</Text>
                <Text color="gray.300">Modelo: {selectedVehicle.model}</Text>
                <Text color="gray.300">Placa: {selectedVehicle.license_plate}</Text>
                <Text color="gray.300">Kilometraje actual: {selectedVehicle.km_actual}</Text>
                <Text color="gray.300">Estatus: {selectedVehicle.status}</Text>
              </Box>
            )}
          </Box>

          <Box>
            <Text color="gray.400" mb={2}>Notas de inspección</Text>
            <Textarea
              placeholder="Agrega observaciones adicionales para el informe..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              minH="220px"
              bg="#070709"
              borderColor="whiteAlpha.200"
            />
          </Box>
        </SimpleGrid>

        <Box my={6} h="1px" bg="whiteAlpha.200" />

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={4}>
          <Box>
            <Text color="gray.400" mb={2}>Foto / video de salida (Lunes)</Text>
            <Box mb={3}>
              <Button
                as="label"
                cursor="pointer"
                bg="#1f2937"
                color="white"
                _hover={{ bg: "#374151" }}
                _active={{ bg: "#4b5563" }}
              >
                Seleccionar archivo
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileChange(e, setBeforeFile, setBeforePreviewUrl, beforePreviewUrl)}
                  style={{ display: "none" }}
                />
              </Button>
              {beforeFile && (
                <Text mt={2} fontSize="sm" color="gray.300">Archivo seleccionado: {beforeFile.name}</Text>
              )}
            </Box>
            {renderPreview("Salida (Antes)", beforeFile, beforePreviewUrl)}
          </Box>
          <Box>
            <Text color="gray.400" mb={2}>Foto / video de regreso (Viernes)</Text>
            <Box mb={3}>
              <Button
                as="label"
                cursor="pointer"
                bg="#1f2937"
                color="white"
                _hover={{ bg: "#374151" }}
                _active={{ bg: "#4b5563" }}
              >
                Seleccionar archivo
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileChange(e, setAfterFile, setAfterPreviewUrl, afterPreviewUrl)}
                  style={{ display: "none" }}
                />
              </Button>
              {afterFile && (
                <Text mt={2} fontSize="sm" color="gray.300">Archivo seleccionado: {afterFile.name}</Text>
              )}
            </Box>
            {renderPreview("Regreso (Después)", afterFile, afterPreviewUrl)}
          </Box>
        </SimpleGrid>

        <Button colorScheme="blue" onClick={handleCompare} loading={loading}>
          Comparar y generar informe
        </Button>
      </Box>

      {inspection && (
        <Box bg="#0f0f10" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" mb={6}>
          <Heading size="md" mb={4}>Resultado de la comparación</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
            <Box bg="#08090e" p={4} borderRadius="xl">
              <Text color="gray.400" mb={2}>Salida</Text>
              {inspection.before_image ? (
                <Image src={absUrl(inspection.before_image)} alt="Salida" borderRadius="xl" />
              ) : (
                <Text color="gray.500">Sin imagen disponible</Text>
              )}
            </Box>
            <Box bg="#08090e" p={4} borderRadius="xl">
              <Text color="gray.400" mb={2}>Regreso</Text>
              {inspection.after_image ? (
                <Image src={absUrl(inspection.after_image)} alt="Regreso" borderRadius="xl" />
              ) : (
                <Text color="gray.500">Sin imagen disponible</Text>
              )}
            </Box>
            <Box bg="#08090e" p={4} borderRadius="xl">
              <Text color="gray.400" mb={2}>Diferencias</Text>
              {inspection.diff_image ? (
                <Image src={absUrl(inspection.diff_image)} alt="Diferencias" borderRadius="xl" />
              ) : (
                <Text color="gray.500">Sin imagen de diferencias</Text>
              )}
            </Box>
          </SimpleGrid>

          {aiResults.length > 0 && (
            <Box mb={4}>
              <Heading size="sm" mb={3}>Resultados IA por zona</Heading>
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                {aiResults.map((r) => (
                  <Box key={r.idx} bg="#08090e" p={2} borderRadius="md" textAlign="center">
                    <Image src={absUrl(r.thumbnail)} alt={`thumb-${r.idx}`} boxSize="120px" objectFit="cover" borderRadius="md" mb={2} />
                    <Text fontSize="sm" color="gray.200" fontWeight="bold">{r.label}</Text>
                    <Text fontSize="xs" color="gray.400">{Math.round(r.confidence * 100)}%</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}

          <Box bg="#07080d" p={4} borderRadius="xl" border="1px solid" borderColor="yellow.400">
            <Text color="yellow.300" fontWeight="bold" mb={2}>Informe generado</Text>
            <Text color="gray.300" whiteSpace="pre-wrap">{inspection.report}</Text>
            <Box mt={4} display="flex" gap="1.5rem" flexWrap="wrap">
              <Text color="gray.400">Puntaje: {inspection.score.toFixed(1)}%</Text>
              <Text color="gray.400">Cambio detectado: {inspection.change_percent}%</Text>
            </Box>
          </Box>
        </Box>
      )}

      <Box bg="#0f0f10" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
        <Heading size="md" mb={4}>Historial de inspecciones</Heading>
        {history.length === 0 ? (
          <Text color="gray.400">Aún no hay inspecciones registradas.</Text>
        ) : (
          <Box display="grid" gap="1rem">
            {history.map((item) => {
              // parse AI thumbnails from item.report
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
              <Box key={item.id} p={4} bg="#08090e" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200">
                <HStack justifyContent="space-between" mb={3}>
                  <Text fontWeight="bold" color="yellow.300">{new Date(item.created_at).toLocaleString()}</Text>
                  <Text color="gray.400">Cambio: {item.change_percent}%</Text>
                </HStack>
                <Text color="gray.300" mb={2}>{item.report}</Text>
                <Flex gap={2} flexWrap="wrap">
                  {item.before_image && <Image src={absUrl(item.before_image)} alt="Salida" boxSize="120px" objectFit="cover" borderRadius="md" />}
                  {item.after_image && <Image src={absUrl(item.after_image)} alt="Regreso" boxSize="120px" objectFit="cover" borderRadius="md" />}
                  {item.diff_image && <Image src={absUrl(item.diff_image)} alt="Diferencias" boxSize="120px" objectFit="cover" borderRadius="md" />}
                  {itemAi.map((r) => (
                    <Box key={`h-${r.idx}`}>
                      <Image src={absUrl(r.thumbnail)} alt={`h-thumb-${r.idx}`} boxSize="120px" objectFit="cover" borderRadius="md" />
                    </Box>
                  ))}
                </Flex>
              </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}
