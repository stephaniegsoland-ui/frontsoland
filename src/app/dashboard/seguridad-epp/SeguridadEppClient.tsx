"use client";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Image,
  AspectRatio,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2, Info, Save, XCircle } from "lucide-react";
import { analyzeSecurityEppAction, fetchSecurityHistoryAction, type SecurityHistoryItem } from "@/actions/security";

interface AnalysisResult {
  person_detected: boolean;
  person_bbox?: [number, number, number, number] | null;
  full_body_detected?: boolean;
  detected_items: Record<string, boolean>;
  present_items: string[];
  missing_items: string[];
  score: number;
  summary: string;
  recommendations: string[];
  recognized_username?: string | null;
  recognition_precision?: number | null;
  recognition_rejected?: boolean;
}

const statusColor = (score: number) => {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
};

export function SeguridadEppClient() {
  const SECURITY_MEDIA_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";
  const RECOGNITION_THRESHOLD = 0.7;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState("");
  const [turno, setTurno] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [history, setHistory] = useState<SecurityHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<{ width: number; height: number } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("user");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<Record<string, any> | null>(null);
  const [cameraErrorDetails, setCameraErrorDetails] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawIntervalRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const imageCaptureRef = useRef<any | null>(null);
  const imageCaptureTimerRef = useRef<number | null>(null);
  const [brightness, setBrightness] = useState<number>(1);
  const [contrast, setContrast] = useState<number>(1);

  const operatorLocked = Boolean(result?.recognized_username && (result.recognition_precision ?? 0) >= RECOGNITION_THRESHOLD);
  const safeScore = result ? Number(result.score) || 0 : 0;
  const requiredEppItems = [
    "cascos",
    "chaleco",
    "guantes",
    "lentes de seguridad",
    "tapones de oído",
    "braga de seguridad",
    "botas",
  ];
  const fullBodyDetected = result?.full_body_detected ?? true;
  const hasAllRequiredEpp =
    fullBodyDetected &&
    result?.person_detected &&
    result?.present_items &&
    requiredEppItems.every((item) => result.present_items.includes(item));

  const safeRecommendations = result
    ? Array.isArray(result.recommendations)
      ? result.recommendations
      : result.recommendations
      ? [result.recommendations]
      : []
    : [];
  const safePresentItems = result
    ? Array.isArray(result.present_items)
      ? result.present_items
      : result.present_items
      ? [result.present_items]
      : []
    : [];
  const safeMissingItems = result
    ? Array.isArray(result.missing_items)
      ? result.missing_items
      : result.missing_items
      ? [result.missing_items]
      : []
    : [];
  const presentItemsSet = new Set(safePresentItems.map((item) => item.toLowerCase()));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (cameraActive) {
      stopCamera();
    }

    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setAnalysisSaved(false);
      setNaturalImageSize(null);
    } else {
      setFile(null);
      setPreviewUrl(null);
      setResult(null);
      setAnalysisSaved(false);
      setNaturalImageSize(null);
    }

    setError(null);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("La cámara no está disponible en este dispositivo.");
      return;
    }

    try {
      // try preferred deviceId first if available, otherwise try facingMode
      let stream: MediaStream | null = null;
      const tryDeviceId = async () => {
        if (!selectedDeviceId) return null;
        const c: MediaStreamConstraints = { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
        return await navigator.mediaDevices.getUserMedia(c);
      };

      const tryFacing = async () => {
        const c: MediaStreamConstraints = { video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
        return await navigator.mediaDevices.getUserMedia(c);
      };

      setCameraErrorDetails(null);

      try {
        stream = await tryDeviceId();
      } catch (e) {
        // deviceId failed, try facingMode
        try {
          stream = await tryFacing();
        } catch (e2) {
          // both failed; rethrow last
          throw e2;
        }
      }
      if (!stream) {
        throw new Error("No se pudo obtener el flujo de cámara.");
      }

      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => undefined);
      }
      // collect basic diagnostics
      try {
        const tracks = stream.getVideoTracks();
        const track = tracks[0];
        if (!track) throw new Error("No video track available");
        const settings = track.getSettings ? track.getSettings() : null;
        const capabilities = track.getCapabilities ? track.getCapabilities() : null;
        setStreamInfo({ settings, capabilities, readyState: track.readyState, enabled: track.enabled });
      } catch (e) {
        setStreamInfo(null);
      }
      // try ImageCapture fallback (grabFrame) for devices/browsers where <video> doesn't render
      try {
        const track = stream.getVideoTracks()[0];
        const ImageCaptureCtor = (window as any).ImageCapture;
        if (ImageCaptureCtor) {
          try {
            imageCaptureRef.current = new ImageCaptureCtor(track);
            const grabLoop = async () => {
              try {
                if (!imageCaptureRef.current) return;
                const bitmap = await imageCaptureRef.current.grabFrame();
                const canvas = canvasRef.current;
                if (bitmap && canvas) {
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                      canvas.width = bitmap.width;
                      canvas.height = bitmap.height;
                    }
                    ctx.drawImage(bitmap, 0, 0);
                  }
                  try { bitmap.close && bitmap.close(); } catch {}
                }
              } catch (e) {
                // ignore
              } finally {
                imageCaptureTimerRef.current = window.setTimeout(grabLoop, 120);
              }
            };
            grabLoop();
          } catch (e) {
            imageCaptureRef.current = null;
          }
        }
      } catch (e) {
        // ignore
      }
      // start diagnostic draw loop: copy video frames to an on-screen canvas using RAF
      try {
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          const vid = videoRef.current;
          const draw = () => {
            try {
              if (!ctx || !vid) return;
              const w = vid.videoWidth || 640;
              const h = vid.videoHeight || 480;
              if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
              }
              ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            } catch (e) {
              // ignore
            }
            rafRef.current = requestAnimationFrame(draw);
          };
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(draw);
        }
      } catch (e) {
        // ignore
      }
      setCameraActive(true);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraErrorDetails(msg);
      setError("No se pudo acceder a la cámara. Verifica los permisos del dispositivo. " + msg);
    }
  };

  useEffect(() => {
    // enumerate devices on load
    const list = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = all.filter((d) => d.kind === "videoinput");
        setDevices(videoInputs);
        if (videoInputs.length && !selectedDeviceId) {
          // prefer first device by default
          setSelectedDeviceId(videoInputs[0].deviceId || null);
        }
      } catch (e) {
        // ignore
      }
    };
    list();
  }, [selectedDeviceId]);

  useEffect(() => {
    if (!cameraActive) return;
    // when facing mode changes while camera is active, restart the stream
    let cancelled = false;
    const restart = async () => {
      stopCamera();
      if (cancelled) return;
      await startCamera();
    };
    restart();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacing]);

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (imageCaptureTimerRef.current) {
      clearTimeout(imageCaptureTimerRef.current);
      imageCaptureTimerRef.current = null;
    }
    imageCaptureRef.current = null;
  };

  const captureFromCamera = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const finishWithBlob = (blob: Blob | null) => {
      if (!blob) {
        setError("No se pudo generar la imagen capturada.");
        return;
      }
      const imageFile = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(imageFile);
      setPreviewUrl(URL.createObjectURL(imageFile));
      setResult(null);
      setNaturalImageSize(null);
      stopCamera();
      setError(null);
    };

    const doFromImageCapture = async () => {
      if (!imageCaptureRef.current) return false;
      try {
        const bitmap = await imageCaptureRef.current.grabFrame();
        if (!ctx) return false;
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx.drawImage(bitmap, 0, 0);
        try { bitmap.close && bitmap.close(); } catch {}
        canvas.toBlob((b) => finishWithBlob(b), "image/jpeg");
        return true;
      } catch (e) {
        return false;
      }
    };

    (async () => {
      const used = await doFromImageCapture();
      if (used) return;
      // fallback: draw from visible canvasRef if available
      try {
        const srcCanvas = canvasRef.current;
        if (!srcCanvas || !ctx) {
          setError("No se pudo capturar la imagen desde la cámara.");
          return;
        }
        canvas.width = srcCanvas.width || 640;
        canvas.height = srcCanvas.height || 480;
        ctx.drawImage(srcCanvas, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => finishWithBlob(b), "image/jpeg");
      } catch (e) {
        setError("No se pudo capturar la imagen desde la cámara.");
      }
    })();
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
      stopCamera();
    };
  }, [previewUrl]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Selecciona una imagen para analizar.");
      return;
    }

    if (file.size > 1024 * 1024 * 5) {
      setError("La imagen es demasiado grande. Reduce el tamaño a menos de 5 MB.");
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
    const precision = newResult?.recognition_precision ?? null;
    if (newResult?.recognized_username) {
      // if recognition precision is high enough, accept and set operator name
      if (precision != null && precision >= RECOGNITION_THRESHOLD) {
        if (operatorName !== newResult.recognized_username) {
          setOperatorName(newResult.recognized_username);
        }
        newResult.recognition_rejected = false;
      } else {
        // low confidence: reject the recognition, clear the recognized name
        newResult.recognition_rejected = true;
        newResult.recognized_username = null;
        setError("No coincide: reconocimiento con baja confianza.");
      }
    }
    setResult(newResult);
    setAnalysisSaved(true);
    const refreshed = await fetchSecurityHistoryAction();
    if (refreshed.history) {
      setHistory(refreshed.history);
    }
    setLoading(false);
  };

  const handleSaveAnalysis = async () => {
    if (!result) return;
    const refreshed = await fetchSecurityHistoryAction();
    if (refreshed.history) {
      setHistory(refreshed.history);
      setAnalysisSaved(true);
      setError(null);
    } else {
      setError(refreshed.error || "No se pudo confirmar el guardado del análisis.");
    }
  };

  return (
    <Box p={{ base: 4, md: 6 }} minH="100vh" bg="#08080a" color="white">
      <VStack align="stretch" gap={6} maxW="6xl" mx="auto">
        <Box>
          <Heading size="lg" color="yellow.400">Módulo de Seguridad EPP</Heading>
          <Text color="gray.400" mt={2}>
            Sube una fotografía del operador para verificar el uso correcto de sus EPP y determinar si puede ingresar a la planta.
          </Text>
          <Box mt={4} p={4} borderRadius="xl" bg="#111318" border="1px solid" borderColor="whiteAlpha.100">
            <HStack alignItems="flex-start" gap={4}>
              <Info color="#eab308" size={20} />
              <Stack gap={1}>
                <Text fontWeight="semibold" color="white">Flujo recomendado</Text>
                <Text color="gray.400" fontSize="sm">
                  1) Carga la foto del operador. 2) Revisa el reconocimiento automático. 3) Comprueba que use todos los EPP obligatorios.
                </Text>
              </Stack>
            </HStack>
          </Box>
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
                  <HStack gap={3} alignItems="flex-start" flexWrap="wrap">
                    <Button as="label" size="sm" colorScheme="yellow" color="black" cursor="pointer">
                      Cargar desde galería
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        display="none"
                      />
                    </Button>
                    {devices.length > 0 && (
                      <select
                        value={selectedDeviceId ?? ""}
                        onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                        style={{ background: "#0b0b0c", color: "white", border: "1px solid #222", padding: "6px", borderRadius: 6 }}
                      >
                        {devices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Cámara ${d.deviceId}`}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button size="sm" colorScheme={cameraActive ? "red" : "yellow"} onClick={cameraActive ? stopCamera : startCamera}>
                      {cameraActive ? "Cerrar cámara" : "Usar cámara TDL"}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="gray"
                      onClick={() => setCameraFacing((f) => (f === "environment" ? "user" : "environment"))}
                    >
                      {cameraFacing === "user" ? "Frontal" : "Trasera"}
                    </Button>
                    {cameraActive && (
                      <Button size="sm" colorScheme="green" onClick={captureFromCamera}>
                        Capturar foto
                      </Button>
                    )}
                  </HStack>
                  {file ? (
                    <VStack align="start" mt={3} gap={1}>
                      <Text fontSize="sm" color="gray.400">
                        Archivo seleccionado: {file.name} • {(file.size / 1024).toFixed(0)} KB
                      </Text>
                      {file.size > 1024 * 1024 * 5 && (
                        <Text fontSize="sm" color="red.400">
                          La imagen supera 5 MB. Reduce el tamaño para continuar.
                        </Text>
                      )}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500" mt={3}>
                      Selecciona una foto de buena calidad con el rostro centrado y bien iluminado.
                    </Text>
                  )}
                </Box>

                <Box borderRadius="lg" overflow="hidden" bg="blackAlpha.400" minH="280px" display="flex" alignItems="center" justifyContent="center">
                  {cameraActive ? (
                    <Box width="100%" position="relative">
                      <AspectRatio ratio={3 / 4} maxW="100%">
                        <canvas
                          ref={canvasRef}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            background: "#000",
                            filter: `brightness(${brightness}) contrast(${contrast})`,
                          }}
                        />
                      </AspectRatio>

                      <Text position="absolute" bottom="86px" left="12px" px={3} py={1} borderRadius="full" bg="blackAlpha.700" fontSize="sm">
                        Cámara activa
                      </Text>

                      <Button
                        onClick={captureFromCamera}
                        position="absolute"
                        left="50%"
                        transform="translateX(-50%)"
                        bottom="16px"
                        borderRadius="full"
                        width="72px"
                        height="72px"
                        bg="white"
                        color="black"
                        _hover={{ bg: "whiteAlpha.900" }}
                      >
                        •
                      </Button>
                      <Box position="absolute" left="12px" bottom="16px" display="flex" flexDirection="column" gap={2}>
                        <HStack gap={2}>
                          <Text fontSize="sm">Brillo</Text>
                          <Button size="xs" onClick={() => setBrightness((b) => Math.max(0.5, +(b - 0.1).toFixed(2)))}>-</Button>
                          <Text fontSize="sm">{brightness.toFixed(2)}</Text>
                          <Button size="xs" onClick={() => setBrightness((b) => Math.min(2, +(b + 0.1).toFixed(2)))}>+</Button>
                        </HStack>
                        <HStack gap={2}>
                          <Text fontSize="sm">Contraste</Text>
                          <Button size="xs" onClick={() => setContrast((c) => Math.max(0.5, +(c - 0.1).toFixed(2)))}>-</Button>
                          <Text fontSize="sm">{contrast.toFixed(2)}</Text>
                          <Button size="xs" onClick={() => setContrast((c) => Math.min(2, +(c + 0.1).toFixed(2)))}>+</Button>
                        </HStack>
                      </Box>
                      {/* diagnostic canvas removed (now main preview uses canvasRef) */}
                      {streamInfo && (
                        <Box position="absolute" right="12px" bottom="16px" p={2} bg="blackAlpha.600" borderRadius="md" fontSize="xs">
                          <Text fontSize="xs" fontWeight="bold">Stream</Text>
                          <Text>W: {streamInfo.settings?.width ?? "?"} H: {streamInfo.settings?.height ?? "?"}</Text>
                          <Text>FPS: {streamInfo.settings?.frameRate ?? "?"}</Text>
                          <Text>State: {streamInfo.readyState ?? streamInfo.settings?.readyState ?? "?"}</Text>
                          <Text>Enabled: {String(streamInfo.enabled ?? streamInfo.settings?.enabled ?? "?")}</Text>
                        </Box>
                      )}
                      {cameraErrorDetails && (
                        <Box position="absolute" right="12px" top="12px" p={2} bg="red.900/40" borderRadius="md" fontSize="xs">
                          <Text fontSize="xs" fontWeight="bold">Error cámara</Text>
                          <Text>{cameraErrorDetails}</Text>
                        </Box>
                      )}
                    </Box>
                  ) : previewUrl ? (
                    <Box position="relative" width="100%">
                      <AspectRatio ratio={3 / 4} maxW="100%">
                        <Image
                          src={previewUrl}
                          alt="Vista previa del operador"
                          width="100%"
                          height="100%"
                          objectFit="cover"
                          style={{ filter: `brightness(${brightness}) contrast(${contrast})` }}
                          onLoad={(event) => {
                            const img = event.currentTarget;
                            if (img.naturalWidth && img.naturalHeight) {
                              setNaturalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                            }
                          }}
                        />
                      </AspectRatio>
                      {result?.person_detected && result.person_bbox && naturalImageSize && (
                        <Box
                          position="absolute"
                          border="2px solid"
                          borderColor="yellow.300"
                          pointerEvents="none"
                          left={`${(result.person_bbox[0] / naturalImageSize.width) * 100}%`}
                          top={`${(result.person_bbox[1] / naturalImageSize.height) * 100}%`}
                          width={`${((result.person_bbox[2] - result.person_bbox[0]) / naturalImageSize.width) * 100}%`}
                          height={`${((result.person_bbox[3] - result.person_bbox[1]) / naturalImageSize.height) * 100}%`}
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
                  placeholder={operatorLocked ? "Nombre identificado automáticamente" : "Nombre del operador"}
                  value={operatorName}
                  onChange={(event) => {
                    if (!operatorLocked) setOperatorName(event.target.value);
                  }}
                  readOnly={operatorLocked}
                  bg={operatorLocked ? "whiteAlpha.100" : undefined}
                />
                {operatorLocked ? (
                  <Text color="green.300" fontSize="xs">
                    Nombre identificado por coincidencia y bloqueado para evitar cambios.
                  </Text>
                ) : (
                  <Text color="gray.500" fontSize="xs">
                    Escribe el nombre previsto del operador si la imagen no se identifica automáticamente.
                  </Text>
                )}
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
                <Button type="submit" colorScheme="yellow" alignSelf="flex-start" disabled={loading || !file}>
                  {loading ? "Analizando..." : "Analizar foto"}
                </Button>
                {!file && (
                  <Text color="gray.500" fontSize="xs">
                    Seleccione primero una imagen para habilitar el análisis.
                  </Text>
                )}
                <Box mt={2} p={3} borderRadius="md" bg="#0f1115" border="1px solid" borderColor="whiteAlpha.100">
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="semibold">
                    Elementos mínimos para acceso a planta
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
                    {requiredEppItems.map((item) => (
                      <Badge
                        key={item}
                        colorScheme={presentItemsSet.has(item) ? "green" : "red"}
                        variant="subtle"
                      >
                        {item}
                      </Badge>
                    ))}
                  </SimpleGrid>
                </Box>
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
                {result.recognized_username ? (
                  <Box bg="yellow.900/20" p={3} borderRadius="md" border="1px solid" borderColor="yellow.500">
                    <Text fontSize="sm" color="yellow.300" fontWeight="bold">
                      Operador identificado: {result.recognized_username}
                    </Text>
                    {result.recognition_precision != null && (
                      <Text fontSize="xs" color="gray.400">
                        Precisión de reconocimiento: {(result.recognition_precision * 100).toFixed(0)}%
                      </Text>
                    )}
                  </Box>
                ) : result.recognition_rejected ? (
                  <Box bg="red.900/20" p={3} borderRadius="md" border="1px solid" borderColor="red.500">
                    <Text fontSize="sm" color="red.300" fontWeight="bold">No coincide con un operador registrado</Text>
                    <Text fontSize="sm" color="gray.300">Se recomienda verificar la identidad y volver a intentar si el operador no está registrado.</Text>
                    {result.recognition_precision != null && (
                      <Text fontSize="xs" color="gray.400">Precisión: {(result.recognition_precision * 100).toFixed(0)}%</Text>
                    )}
                  </Box>
                ) : (
                  <Box bg="red.900/20" p={3} borderRadius="md" border="1px solid" borderColor="red.500">
                    <Text fontSize="sm" color="red.300" fontWeight="bold">No se encontró coincidencia con un operador registrado</Text>
                    <Text fontSize="sm" color="gray.300">La foto no coincide con un usuario cargado en el sistema.</Text>
                  </Box>
                )}
                {result.person_bbox && (
                  <Text fontSize="sm" color="gray.400">
                    Región visual estimada: x {result.person_bbox[0]}, y {result.person_bbox[1]}, w {result.person_bbox[2]}, h {result.person_bbox[3]}
                  </Text>
                )}
                <Text color="gray.300">{result.summary || "No hubo un resumen de análisis disponible."}</Text>
                <Button
                  type="button"
                  onClick={handleSaveAnalysis}
                  colorScheme={analysisSaved ? "green" : "yellow"}
                  color={analysisSaved ? "white" : "black"}
                  alignSelf="flex-start"
                  disabled={analysisSaved}
                  display="flex"
                  gap={2}
                >
                  <Save size={17} />
                  {analysisSaved ? "Análisis guardado" : "Guardar análisis"}
                </Button>
                <Text fontWeight="bold">Puntaje de cumplimiento: {safeScore}%</Text>
                <Box bg="whiteAlpha.100" borderRadius="full" overflow="hidden" h="10px" mt={2}>
                  <Box
                    bg={`${statusColor(safeScore)}.400`}
                    w={`${safeScore}%`}
                    h="100%"
                    transition="width 0.2s ease"
                  />
                </Box>
                <Box mt={3} p={4} borderRadius="xl" bg={hasAllRequiredEpp ? "green.900/20" : "red.900/20"} border="1px solid" borderColor={hasAllRequiredEpp ? "green.500" : "red.500"}>
                  <HStack align="center" gap={3} mb={3}>
                    {hasAllRequiredEpp ? (
                      <CheckCircle2 color="#68d391" size={20} />
                    ) : (
                      <XCircle color="#f56565" size={20} />
                    )}
                    <Text fontWeight="bold" color={hasAllRequiredEpp ? "green.300" : "red.300"}>
                      {hasAllRequiredEpp
                        ? "Acceso permitido: cumple todos los EPP requeridos para planta."
                        : fullBodyDetected
                        ? "Acceso denegado: faltan EPP obligatorios."
                        : "Acceso denegado: la foto no es de cuerpo completo."}
                    </Text>
                  </HStack>
                  {!hasAllRequiredEpp && (
                    <Text fontSize="sm" color="gray.400" mt={1}>
                      {fullBodyDetected
                        ? "Para acceder a la planta debe usar casco, chaleco, braga de seguridad, botas, guantes, lentes de seguridad y tapones de oído."
                        : "Toma una foto de cuerpo completo que incluya casco, braga de seguridad, botas y el resto del EPP."}
                    </Text>
                  )}
                </Box>
                <HStack gap={2} flexWrap="wrap">
                  {safePresentItems.length > 0 ? (
                    safePresentItems.map((item) => (
                      <Badge key={item} colorScheme="green">{item}</Badge>
                    ))
                  ) : (
                    <Badge colorScheme="gray">Sin elementos presentes detectados</Badge>
                  )}
                  {safeMissingItems.length > 0 ? (
                    safeMissingItems.map((item) => (
                      <Badge key={item} colorScheme="red">{item}</Badge>
                    ))
                  ) : (
                    <Badge colorScheme="green">No hay elementos faltantes detectados</Badge>
                  )}
                </HStack>
              </VStack>
            </Box>

            <Box bg="#101014" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Heading size="md" mb={4}>Consejos de seguridad</Heading>
              <VStack align="stretch" gap={3}>
                {safeRecommendations.length > 0 ? (
                  safeRecommendations.map((tip, idx) => (
                    <Box key={idx} bg="blackAlpha.300" p={3} borderRadius="md">
                      <Text color="yellow.300">• {tip}</Text>
                    </Box>
                  ))
                ) : (
                  <Box bg="blackAlpha.300" p={3} borderRadius="md">
                    <Text color="yellow.300">No se encontraron recomendaciones específicas. Revisa los elementos faltantes y usa el EPP adecuado.</Text>
                  </Box>
                )}
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
                  {item.thumbnail_path && (
                    <Image
                      src={`${SECURITY_MEDIA_URL}${item.thumbnail_path}`}
                      alt={`Miniatura de inspección de ${item.operator_name || "operador"}`}
                      mt={3}
                      width="120px"
                      height="120px"
                      objectFit="cover"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                    />
                  )}
                  <Box mt={3}>
                    <Text fontSize="xs" color="gray.400" mb={1}>EPP faltantes</Text>
                    {item.missing_items ? (
                      <HStack gap={2} flexWrap="wrap">
                        {item.missing_items.split(", ").filter(Boolean).map((missingItem) => (
                          <Badge key={missingItem} colorScheme="red">{missingItem}</Badge>
                        ))}
                      </HStack>
                    ) : (
                      <Badge colorScheme="green">Ninguno</Badge>
                    )}
                  </Box>
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
