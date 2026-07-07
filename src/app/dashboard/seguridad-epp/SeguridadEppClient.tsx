"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { analyzeSecurityEppAction, fetchSecurityHistoryAction, type SecurityHistoryItem } from "@/actions/security";

interface AnalysisResult {
  person_detected: boolean;
  person_bbox?: [number, number, number, number] | null;
  detected_items: Record<string, boolean>;
  present_items: string[];
  missing_items: string[];
  score: number;
  summary: string;
  recommendations: string[];
  recognized_username?: string | null;
  recognition_precision?: number | null;
}

const statusColor = (score: number) => {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
};

export function SeguridadEppClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState("");
  const [turno, setTurno] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<SecurityHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<{ width: number; height: number } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setNaturalImageSize(null);
    } else {
      setFile(null);
      setPreviewUrl(null);
      setResult(null);
      setNaturalImageSize(null);
    }

    setError(null);
  };

  useEffect(() => {
    const loadHistory = async () => {
      const actionResult = await fetchSecurityHistoryAction();
      if (actionResult.history) {
        setHistory(actionResult.history);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Selecciona una imagen para analizar.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (operatorName) formData.append("operator_name", operatorName);
    if (turno) formData.append("turno", turno);
    if (notes) formData.append("notes", notes);

    const actionResult = await analyzeSecurityEppAction(null, formData);
    if (actionResult.error) {
      setError(actionResult.error);
      setResult(null);
      setLoading(false);
      return;
    }

    const newResult = actionResult.result || null;
    if (newResult?.recognized_username && operatorName !== newResult.recognized_username) {
      setOperatorName(newResult.recognized_username);
    }
    setResult(newResult);
    const refreshed = await fetchSecurityHistoryAction();
    if (refreshed.history) {
      setHistory(refreshed.history);
    }
    setLoading(false);
  };

  return (
    <Box p={{ base: 4, md: 6 }} minH="100vh" bg="#08080a" color="white">
      <VStack align="stretch" gap={6} maxW="6xl" mx="auto">
        <Box>
          <Heading size="lg" color="yellow.400">Módulo de Seguridad EPP</Heading>
          <Text color="gray.400" mt={2}>
            Sube una fotografía del operador para verificar el uso de equipos de protección personal y recibir consejos de seguridad en tiempo real.
          </Text>
        </Box>

        <Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
          <form onSubmit={handleSubmit}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
              <VStack align="stretch" gap={4}>
                <Box
                  border="1px dashed"
                  borderColor={file ? "yellow.400" : "whiteAlpha.300"}
                  borderRadius="lg"
                  p={4}
                  bg="blackAlpha.300"
                >
                  <Text fontWeight="bold" mb={3}>1. Adjunta la imagen</Text>
                  <Input type="file" accept="image/*" onChange={handleFileChange} />
                  {file ? (
                    <Text fontSize="sm" color="gray.400" mt={3}>
                      Archivo seleccionado: {file.name} • {(file.size / 1024).toFixed(0)} KB
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="gray.500" mt={3}>
                      La vista previa aparecerá automáticamente cuando selecciones una foto.
                    </Text>
                  )}
                </Box>

                <Box borderRadius="lg" overflow="hidden" bg="blackAlpha.400" minH="280px" display="flex" alignItems="center" justifyContent="center">
                  {previewUrl ? (
                    <Box position="relative" width="100%">
                  <img
                    src={previewUrl}
                    alt="Vista previa del operador"
                    style={{ width: "100%", height: "auto", display: "block" }}
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        setNaturalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                      }
                    }}
                  />
                  {result?.person_detected && result.person_bbox && naturalImageSize && (
                    <Box
                      position="absolute"
                      border="2px solid"
                      borderColor="yellow.300"
                      pointerEvents="none"
                      left={`${(result.person_bbox[0] / naturalImageSize.width) * 100}%`}
                      top={`${(result.person_bbox[1] / naturalImageSize.height) * 100}%`}
                      width={`${(result.person_bbox[2] / naturalImageSize.width) * 100}%`}
                      height={`${(result.person_bbox[3] / naturalImageSize.height) * 100}%`}
                      boxShadow="0 0 0 2px rgba(255,229,100,0.6)"
                    />
                  )}
                </Box>
                  ) : (
                    <VStack p={6} color="gray.500">
                      <Text fontWeight="bold">Sin imagen cargada</Text>
                      <Text textAlign="center">Aquí verás la foto del operador antes de enviarla al análisis.</Text>
                    </VStack>
                  )}
                </Box>
              </VStack>

              <VStack align="stretch" gap={4}>
                <Input
                  placeholder="Nombre del operador"
                  value={operatorName}
                  onChange={(event) => setOperatorName(event.target.value)}
                />
                <Input
                  placeholder="Turno (ej. mañana, tarde)"
                  value={turno}
                  onChange={(event) => setTurno(event.target.value)}
                />
                <Textarea
                  placeholder="Notas adicionales del turno"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
                <Button type="submit" colorScheme="yellow" alignSelf="flex-start" disabled={loading}>
                  {loading ? "Analizando..." : "Analizar foto"}
                </Button>
              </VStack>
            </SimpleGrid>
          </form>

          {loading && (
            <Flex align="center" gap={3} mt={4} color="gray.300">
              <Spinner size="sm" />
              <Text>Procesando imagen y generando el reporte de seguridad...</Text>
            </Flex>
          )}

          {error && (
            <Box mt={4} bg="red.900/40" p={3} borderRadius="md" border="1px solid" borderColor="red.700">
              <Text color="red.200">{error}</Text>
            </Box>
          )}
        </Box>

        {result && (
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
            <Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Heading size="md" mb={4}>Resultado del análisis</Heading>
              <VStack align="stretch" gap={3}>
                <Badge colorScheme={result.person_detected ? "green" : "red"} w="fit-content">
                  {result.person_detected ? "Persona detectada" : "Persona no detectada"}
                </Badge>
                {result.recognized_username && (
                  <>
                    <Text fontSize="sm" color="yellow.300" fontWeight="bold">
                      Operador identificado: {result.recognized_username}
                    </Text>
                    {result.recognition_precision != null && (
                      <Text fontSize="xs" color="gray.400">
                        Precisión de reconocimiento: {result.recognition_precision}%
                      </Text>
                    )}
                  </>
                )}
                {result.person_bbox && (
                  <Text fontSize="sm" color="gray.400">
                    Región visual estimada: x {result.person_bbox[0]}, y {result.person_bbox[1]}, w {result.person_bbox[2]}, h {result.person_bbox[3]}
                  </Text>
                )}
                <Text color="gray.300">{result.summary}</Text>
                <Text fontWeight="bold">Puntaje de cumplimiento: {result.score}%</Text>
                <Box bg="whiteAlpha.100" borderRadius="full" overflow="hidden" h="10px" mt={2}>
                  <Box
                    bg={`${statusColor(result.score)}.400`}
                    w={`${result.score}%`}
                    h="100%"
                    transition="width 0.2s ease"
                  />
                </Box>
                <HStack gap={2} flexWrap="wrap">
                  {result.present_items.map((item) => (
                    <Badge key={item} colorScheme="green">{item}</Badge>
                  ))}
                  {result.missing_items.map((item) => (
                    <Badge key={item} colorScheme="red">{item}</Badge>
                  ))}
                </HStack>
              </VStack>
            </Box>

            <Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Heading size="md" mb={4}>Consejos de seguridad</Heading>
              <VStack align="stretch" gap={3}>
                {result.recommendations.map((tip, idx) => (
                  <Box key={idx} bg="blackAlpha.300" p={3} borderRadius="md">
                    <Text color="yellow.300">• {tip}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          </SimpleGrid>
        )}

        <Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
          <Heading size="md" mb={4}>Historial de inspecciones</Heading>
          {history.length === 0 ? (
            <Text color="gray.400">Aún no hay inspecciones registradas para este usuario.</Text>
          ) : (
            <VStack align="stretch" gap={3}>
              {history.map((item) => (
                <Box key={item.id} bg="blackAlpha.300" p={3} borderRadius="md">
                  <Flex justify="space-between" gap={2} mb={2} flexWrap="wrap">
                    <Box>
                      <Text fontWeight="bold">{item.operator_name || "Operador"}</Text>
                      <Text fontSize="sm" color="gray.400">Turno: {item.turno || "Sin turno"}</Text>
                    </Box>
                    <Badge colorScheme={statusColor(item.score)}>{item.score}%</Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.300">{item.summary}</Text>
                  <Text fontSize="xs" color="gray.500" mt={2}>{new Date(item.created_at).toLocaleString()}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
