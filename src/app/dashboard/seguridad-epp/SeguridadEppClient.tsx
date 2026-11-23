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
  VStack,
} from "@chakra-ui/react";
import { AlertTriangle, CheckCircle2, ClipboardList, Info, Search, Save, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { analyzeSecurityEppAction, fetchSecurityHistoryAction, recordSecurityDecisionAction, type SecurityHistoryItem } from "@/actions/security";

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
  face_detected: boolean;
  recognized_username?: string | null;
  recognition_precision?: number | null;
  recognized_name?: string | null;
  recognized_cedula?: string | null;
  recognized_cargo?: string | null;
  recognized_photo_path?: string | null;
  report_id?: string | null;
  access_decision?: "approved" | "denied" | null;
  decision_by_username?: string | null;
  decision_at?: string | null;
}

const statusColor = (score: number) => {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
};

const eppMarkerLocations: Record<string, { number: number; points: { x: number; y: number }[] }> = {
  cascos: { number: 1, points: [{ x: 50, y: 5 }] },
  chaleco: { number: 2, points: [{ x: 50, y: 32 }] },
  guantes: { number: 3, points: [{ x: 18, y: 48 }, { x: 82, y: 48 }] },
  "lentes de seguridad": { number: 4, points: [{ x: 50, y: 15 }] },
  "tapones de oído": { number: 5, points: [{ x: 37, y: 14 }, { x: 63, y: 14 }] },
  "braga de seguridad": { number: 6, points: [{ x: 50, y: 65 }] },
  botas: { number: 7, points: [{ x: 36, y: 95 }, { x: 64, y: 95 }] },
};

export function SeguridadEppClient() {
  const SECURITY_MEDIA_URL = getBackendUrl();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
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

  const personDetected = result?.person_detected === true;
  const fullBodyDetected = result?.full_body_detected === true;
  const faceDetected = result?.face_detected === true;
  const imageVerified = personDetected && fullBodyDetected && faceDetected;
  const safeScore = imageVerified ? Number(result?.score) || 0 : 0;
  const activeWorkflowStep = result ? 3 : file || loading ? 2 : 1;
  const requiredEppItems = [
    "cascos",
    "chaleco",
    "guantes",
    "lentes de seguridad",
    "tapones de oído",
    "braga de seguridad",
    "botas",
  ];
  const hasAllRequiredEpp =
    imageVerified &&
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
  const historyAverageScore = history.length
    ? Math.round(history.reduce((total, item) => total + (Number(item.score) || 0), 0) / history.length)
    : 0;
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const filteredHistory = history
    .filter((item) => {
      const missingItems = (item.missing_items || "").split(",").map((value) => value.trim()).filter(Boolean);
      const searchText = [
        item.operator_name,
        item.turno,
        item.summary,
        item.missing_items,
      ].filter(Boolean).join(" ").toLocaleLowerCase();
      const matchesSearch = searchText.includes(historySearch.trim().toLocaleLowerCase());
      const score = Number(item.score) || 0;
      const matchesFilter =
        historyFilter === "all" ||
        (historyFilter === "high" && score >= 70) ||
        (historyFilter === "medium" && score >= 40 && score < 70) ||
        (historyFilter === "low" && score < 40) ||
        (historyFilter === "missing" && missingItems.length > 0);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    });
  const historyPageSize = 6;
  const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));
  const currentHistoryPage = Math.min(historyPage, historyPageCount - 1);
  const pagedHistory = filteredHistory.slice(
    currentHistoryPage * historyPageSize,
    (currentHistoryPage + 1) * historyPageSize,
  );

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

    const actionResult = await analyzeSecurityEppAction(null, formData);
    if (actionResult.error) {
      setError(actionResult.error);
      setResult(null);
      setLoading(false);
      return;
    }

    const newResult = actionResult.result || null;
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

  const handleAccessDecision = async (decision: "approved" | "denied") => {
    if (!result?.report_id || decisionLoading) return;
    setDecisionLoading(true);
    setError(null);
    const response = await recordSecurityDecisionAction(result.report_id, decision);
    if (response.error) {
      setError(response.error);
      setDecisionLoading(false);
      return;
    }

    setResult((current) => current ? {
      ...current,
      access_decision: decision,
      decision_by_username: response.report?.decision_by_username,
      decision_at: response.report?.decision_at,
    } : current);
    if (response.report) {
      const updatedReport = response.report;
      setHistory((current) => {
        const alreadyListed = current.some((item) => item.id === updatedReport.id);
        return alreadyListed
          ? current.map((item) => item.id === updatedReport.id ? updatedReport : item)
          : [updatedReport, ...current];
      });
    }
    setDecisionLoading(false);
  };

  return (
    <Box p={{ base: 4, md: 6 }} minH="100vh" bg="var(--soland-surface-08080a)" color="var(--soland-text-primary)">
      <VStack align="stretch" gap={6} maxW="6xl" mx="auto">
        <Box>
          <Heading size="lg" color="var(--soland-accent-text)">Módulo de Seguridad EPP</Heading>
          <Text color="gray.400" mt={2}>
            Registra la inspección del operador, analiza su fotografía y revisa el cumplimiento de los EPP antes de decidir el acceso.
          </Text>
          <Box mt={5} p={{ base: 4, md: 5 }} borderRadius="xl" bg="var(--soland-surface-111318)" border="1px solid" borderColor="whiteAlpha.100">
            <HStack alignItems="center" gap={2} mb={4}>
              <Info color="var(--soland-accent-text)" size={18} />
              <Text fontWeight="semibold" color="var(--soland-text-primary)">Flujo de inspección</Text>
            </HStack>
            <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
              {[
                { number: 1, title: "Carga la foto", detail: "Galería o cámara" },
                { number: 2, title: "Analiza la foto", detail: "Carnet y EPP detectados" },
                { number: 3, title: "Registra la decisión", detail: "Aprueba o deniega el acceso" },
              ].map((step) => {
                const isComplete = activeWorkflowStep > step.number;
                const isActive = activeWorkflowStep === step.number;
                return (
                  <HStack
                    key={step.number}
                    align="flex-start"
                    gap={3}
                    p={3}
                    borderRadius="lg"
                    bg={isActive ? "yellow.400/10" : "blackAlpha.200"}
                    border="1px solid"
                    borderColor={isActive ? "yellow.500/60" : isComplete ? "green.700" : "whiteAlpha.100"}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <Center
                      flexShrink={0}
                      boxSize="28px"
                      borderRadius="full"
                      bg={isComplete ? "green.500" : isActive ? "yellow.400" : "whiteAlpha.100"}
                      color={isComplete || isActive ? "black" : "gray.400"}
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      {isComplete ? <CheckCircle2 size={17} /> : step.number}
                    </Center>
                    <Stack gap={0}>
                      <Text fontSize="sm" fontWeight="semibold" color={isActive ? "yellow.200" : "var(--soland-text-primary)"}>
                        {step.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500">{step.detail}</Text>
                    </Stack>
                  </HStack>
                );
              })}
            </SimpleGrid>
          </Box>
        </Box>

        <Box bg="var(--soland-surface-101014)" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
          <form onSubmit={handleSubmit}>
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6} minW={0}>
              <VStack align="stretch" gap={4} minW={0}>
                <Box
                  border="1px dashed"
                  borderColor={file ? "yellow.400" : "whiteAlpha.300"}
                  borderRadius="lg"
                  p={4}
                  bg="blackAlpha.300"
                >
                  <Text fontWeight="bold" mb={1}>Paso 1 · Fotografía del operador</Text>
                  <Text color="gray.500" fontSize="sm" mb={4}>
                    Usa una foto clara, con el rostro y el cuerpo completo visibles.
                  </Text>
                  <HStack gap={3} alignItems="center" flexWrap="wrap">
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
                      <Box minW={{ base: "full", sm: "220px" }} flex="1">
                        <label htmlFor="epp-camera" style={{ color: "var(--soland-text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>
                          Cámara disponible
                        </label>
                        <select
                          id="epp-camera"
                          value={selectedDeviceId ?? ""}
                          onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                          style={{ width: "100%", background: "var(--soland-surface-0b0b0c)", color: "var(--soland-text-primary)", border: "1px solid #4a4a4a", padding: "8px", borderRadius: 6 }}
                        >
                          {devices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Cámara ${d.deviceId}`}
                            </option>
                          ))}
                        </select>
                      </Box>
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
                    <Text fontSize="sm" color="gray.400" mt={3}>
                      Aún no hay una foto seleccionada. Puedes cargar una imagen o tomarla con la cámara.
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
                    <Box width="100%">
                      <Box
                        position="relative"
                        mx="auto"
                        maxW="100%"
                        overflow="hidden"
                        style={{
                          aspectRatio: naturalImageSize
                            ? `${naturalImageSize.width} / ${naturalImageSize.height}`
                            : "3 / 4",
                          width: naturalImageSize
                            ? `min(100%, ${Math.min(520 * naturalImageSize.width / naturalImageSize.height, 2000)}px)`
                            : "min(100%, 390px)",
                        }}
                      >
                        <Image
                          src={previewUrl}
                          alt="Vista previa del operador"
                          position="absolute"
                          inset={0}
                          width="100%"
                          height="100%"
                          objectFit="contain"
                          style={{ filter: `brightness(${brightness}) contrast(${contrast})` }}
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
                          width={`${((result.person_bbox[2] - result.person_bbox[0]) / naturalImageSize.width) * 100}%`}
                          height={`${((result.person_bbox[3] - result.person_bbox[1]) / naturalImageSize.height) * 100}%`}
                          boxShadow="0 0 0 2px rgba(255,229,100,0.6)"
                        />
                      )}
                      {result && safeMissingItems.map((item) => {
                        const marker = eppMarkerLocations[item.toLowerCase()];
                        if (!marker || !result.person_bbox || !naturalImageSize) return null;
                        const [x1, y1, x2, y2] = result.person_bbox;
                        return marker.points.map((point, index) => (
                          <Flex
                            key={`${item}-${index}`}
                            position="absolute"
                            left={`${((x1 + ((x2 - x1) * point.x) / 100) / naturalImageSize.width) * 100}%`}
                            top={`${((y1 + ((y2 - y1) * point.y) / 100) / naturalImageSize.height) * 100}%`}
                            transform="translate(-50%, -50%)"
                            align="center"
                            justify="center"
                            w="30px"
                            h="30px"
                            borderRadius="full"
                            bg="red.600"
                            border="2px solid white"
                            color="var(--soland-text-primary)"
                            fontSize="sm"
                            fontWeight="bold"
                            boxShadow="0 2px 10px rgba(0,0,0,0.75)"
                            pointerEvents="none"
                            title={`Zona aproximada: falta ${item}`}
                            aria-label={`Zona aproximada: falta ${item}`}
                          >
                            {marker.number}
                          </Flex>
                        ));
                      })}
                      </Box>
                      {result && safeMissingItems.length > 0 && (
                        <Text color="gray.400" fontSize="xs" mt={2} textAlign="center">
                          Los números señalan zonas aproximadas del cuerpo, no una ubicación exacta del elemento faltante.
                        </Text>
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

              <VStack align="stretch" gap={4} minW={0}>
                <Box>
                  <Text fontWeight="bold" mb={1}>Carnet digital del operador</Text>
                  <Text color="gray.500" fontSize="sm">
                    Analiza la fotografía para comparar la identidad con el registro de Personal.
                  </Text>
                </Box>
                <Button type="submit" colorScheme="yellow" alignSelf="flex-start" disabled={loading || !file} loading={loading} loadingText="Analizando foto">
                  Analizar foto
                </Button>
                {!file && (
                  <Text color="gray.500" fontSize="xs">
                    Selecciona una foto en el paso 1 para iniciar.
                  </Text>
                )}
                {result?.recognized_username ? (
                  <Box
                    p={4}
                    borderRadius="xl"
                    bg="var(--soland-surface-15191b)"
                    border="1px solid"
                    borderColor="yellow.500/60"
                  >
                    <HStack align="center" gap={2} mb={3}>
                      <ShieldCheck size={18} color="var(--soland-accent-text)" />
                      <Text fontWeight="bold" color="yellow.200">Coincidencia sugerida</Text>
                    </HStack>
                    <Flex gap={4} align="center" flexWrap="wrap">
                      {result.recognized_photo_path ? (
                        <Image
                          src={`${SECURITY_MEDIA_URL}${result.recognized_photo_path}`}
                          alt={`Foto de perfil de ${result.recognized_name || result.recognized_username}`}
                          boxSize="104px"
                          objectFit="cover"
                          borderRadius="lg"
                          border="2px solid"
                          borderColor="yellow.400"
                        />
                      ) : (
                        <Center boxSize="104px" borderRadius="lg" bg="whiteAlpha.100" color="gray.400">
                          <UserRound size={36} />
                        </Center>
                      )}
                      <VStack align="stretch" gap={1} minW={0} flex="1">
                        <Text color="var(--soland-text-primary)" fontSize="lg" fontWeight="bold">
                          {result.recognized_name || result.recognized_username}
                        </Text>
                        <Text color="gray.300" fontSize="sm">
                          Cédula: {result.recognized_cedula || "No registrada"}
                        </Text>
                        <Text color="gray.300" fontSize="sm">
                          Cargo: {result.recognized_cargo || "No registrado"}
                        </Text>
                        <Text color="gray.500" fontSize="xs">
                          Usuario: {result.recognized_username}
                        </Text>
                      </VStack>
                    </Flex>
                    <Text color="yellow.100" fontSize="xs" mt={3}>
                      La coincidencia es orientativa. Verifica rostro y cédula antes de registrar la decisión.
                    </Text>
                  </Box>
                ) : result ? (
                  <Box p={4} borderRadius="lg" bg="yellow.900/20" border="1px solid" borderColor="yellow.700">
                    <Text color="yellow.200" fontWeight="semibold">Carnet digital no encontrado</Text>
                    <Text color="gray.400" fontSize="sm" mt={1}>
                      No hubo coincidencia con una foto de Personal. Verifica la identidad manualmente.
                    </Text>
                  </Box>
                ) : (
                  <Center
                    minH="145px"
                    flexDirection="column"
                    textAlign="center"
                    p={5}
                    borderRadius="xl"
                    bg="blackAlpha.300"
                    border="1px dashed"
                    borderColor="whiteAlpha.200"
                  >
                    <UserRound size={28} color="var(--soland-text-muted)" />
                    <Text color="gray.300" fontWeight="semibold" mt={2}>Carnet pendiente</Text>
                    <Text color="gray.500" fontSize="sm" mt={1}>
                      Al analizar la foto aparecerán aquí el nombre, la foto, la cédula y el cargo.
                    </Text>
                  </Center>
                )}
                <Box mt={2} p={3} borderRadius="md" bg="var(--soland-surface-0f1115)" border="1px solid" borderColor="whiteAlpha.100">
                  <Text fontSize="sm" color="gray.200" mb={1} fontWeight="semibold">
                    Lista de verificación de EPP
                  </Text>
                  <Text fontSize="xs" color="gray.500" mb={3}>
                    {!result
                      ? "Los resultados aparecerán después del análisis"
                      : imageVerified
                      ? "Verde: detectado · Rojo: no detectado"
                      : "Verde: detectado · Rojo: no confirmado"}
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
                    {requiredEppItems.map((item) => {
                      const isPresent = presentItemsSet.has(item);
                      const status = !result ? "pending" : imageVerified && isPresent ? "present" : "missing";
                      return (
                        <HStack
                          key={item}
                          role="listitem"
                          aria-label={`${item}: ${status === "present" ? "detectado" : status === "missing" ? imageVerified ? "no detectado" : "no confirmado" : "sin verificar"}`}
                          gap={2}
                          px={2}
                          py={1.5}
                          borderRadius="md"
                          bg={status === "present" ? "green.900/25" : status === "missing" ? "red.900/25" : "whiteAlpha.100"}
                        >
                          <Center
                            boxSize="16px"
                            flexShrink={0}
                            borderRadius="full"
                            bg={status === "present" ? "green.500" : status === "missing" ? "red.500" : "gray.600"}
                            color="var(--soland-text-primary)"
                            fontSize="10px"
                            fontWeight="bold"
                            aria-hidden="true"
                          >
                            {status === "present" ? "✓" : status === "missing" ? "×" : ""}
                          </Center>
                          <Text fontSize="xs" color="gray.100">
                            {item}
                          </Text>
                        </HStack>
                      );
                    })}
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
            <Box bg="var(--soland-surface-101014)" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Heading size="md" mb={4}>Paso 3 · Revisa el resultado</Heading>
              <VStack align="stretch" gap={3}>
                <Badge colorScheme={result.person_detected ? "green" : "red"} w="fit-content">
                  {result.person_detected ? "Persona detectada" : "Persona no detectada"}
                </Badge>
                <Badge
                  colorScheme={!result.face_detected ? "red" : result.recognized_username ? "green" : "yellow"}
                  w="fit-content"
                >
                  {!result.face_detected
                    ? "Rostro no detectado"
                    : result.recognized_username
                    ? `Coincidencia sugerida: ${result.recognized_username}`
                    : "Sin coincidencia con una foto registrada"}
                </Badge>
                {result.recognized_username && result.recognition_precision != null && (
                  <Text fontSize="sm" color="gray.400">
                    Similitud estimada: {Math.round(result.recognition_precision * 100)}%. Confirma visualmente la identidad; este resultado no determina el acceso.
                  </Text>
                )}
                {result.person_bbox && (
                  <Text fontSize="sm" color="gray.400">
                    Región visual estimada: x {result.person_bbox[0]}, y {result.person_bbox[1]}, w {result.person_bbox[2]}, h {result.person_bbox[3]}
                  </Text>
                )}
                <Text color="gray.300">
                  {imageVerified
                    ? result.summary || "No hubo un resumen de análisis disponible."
                    : "Análisis incompleto: no se puede confirmar el cumplimiento de EPP con esta imagen."}
                </Text>
                <Button
                  type="button"
                  onClick={handleSaveAnalysis}
                  colorScheme={analysisSaved ? "green" : "yellow"}
                  color={analysisSaved ? "var(--soland-text-primary)" : "black"}
                  alignSelf="flex-start"
                  disabled={analysisSaved}
                  display="flex"
                  gap={2}
                >
                  <Save size={17} />
                  {analysisSaved ? "Análisis guardado" : "Guardar análisis"}
                </Button>
                <Text fontWeight="bold">
                  {imageVerified
                    ? `Puntaje de cumplimiento: ${safeScore}%`
                    : "Puntaje de cumplimiento: no disponible (verificación incompleta)"}
                </Text>
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
                      <CheckCircle2 color="var(--soland-success-text)" size={20} />
                    ) : (
                      <XCircle color="var(--soland-danger-text)" size={20} />
                    )}
                    <Text fontWeight="bold" color={hasAllRequiredEpp ? "green.300" : "red.300"}>
                      {hasAllRequiredEpp
                        ? "EPP detectado: están presentes todos los elementos requeridos."
                        : !personDetected
                        ? "Revisión requerida: no se confirmó una persona."
                        : !fullBodyDetected
                        ? "Revisión requerida: no se confirmó el cuerpo completo."
                        : !faceDetected
                        ? "Revisión requerida: no se confirmó el rostro."
                        : "EPP pendiente: faltan elementos obligatorios."}
                    </Text>
                  </HStack>
                  {!hasAllRequiredEpp && (
                    <Text fontSize="sm" color="gray.400" mt={1}>
                      {!personDetected || !fullBodyDetected || !faceDetected
                        ? "Usa una foto clara donde se confirme a una persona, el cuerpo completo y el rostro visible."
                        : "Para acceder a la planta debe usar casco, chaleco, braga de seguridad, botas, guantes, lentes de seguridad y tapones de oído."}
                    </Text>
                  )}
                </Box>
                {imageVerified ? (
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
                        <Badge key={item} colorScheme="red">
                          {eppMarkerLocations[item.toLowerCase()] && (
                            <Box
                              as="span"
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              w="16px"
                              h="16px"
                              mr={1}
                              borderRadius="full"
                              bg="red.700"
                              color="var(--soland-text-primary)"
                            >
                              {eppMarkerLocations[item.toLowerCase()].number}
                            </Box>
                          )}
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Badge colorScheme="green">No hay elementos faltantes detectados</Badge>
                    )}
                  </HStack>
                ) : (
                  <Badge colorScheme="gray" w="fit-content">
                    EPP no confirmado: la verificación de la imagen está incompleta
                  </Badge>
                )}
                <Box mt={2} p={4} borderRadius="xl" bg="blackAlpha.300" border="1px solid" borderColor="whiteAlpha.200">
                  <Text fontWeight="bold" color="var(--soland-text-primary)">Decisión manual de acceso a la actividad</Text>
                  <Text color="gray.400" fontSize="sm" mt={1}>
                    Revisa el carnet y el EPP. La decisión se guardará con tu usuario y fecha; no activa un control físico.
                  </Text>
                  {result.access_decision ? (
                    <HStack mt={3} gap={2} flexWrap="wrap">
                      <Badge colorScheme={result.access_decision === "approved" ? "green" : "red"} px={3} py={1}>
                        {result.access_decision === "approved" ? "Acceso aprobado" : "Acceso denegado"}
                      </Badge>
                      <Text color="gray.400" fontSize="xs">
                        Por {result.decision_by_username || "supervisor"}
                        {result.decision_at
                          ? ` · ${new Date(result.decision_at).toLocaleString("es-VE")}`
                          : ""}
                      </Text>
                    </HStack>
                  ) : (
                    <HStack mt={4} gap={3} flexWrap="wrap">
                      <Button
                        type="button"
                        colorScheme="green"
                        onClick={() => handleAccessDecision("approved")}
                        loading={decisionLoading}
                        disabled={!result.report_id}
                      >
                        Aprobar acceso
                      </Button>
                      <Button
                        type="button"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleAccessDecision("denied")}
                        loading={decisionLoading}
                        disabled={!result.report_id}
                      >
                        Denegar acceso
                      </Button>
                    </HStack>
                  )}
                  {!result.report_id && (
                    <Text color="red.300" fontSize="xs" mt={2}>
                      No se recibió el identificador de la inspección; no es posible guardar la decisión.
                    </Text>
                  )}
                </Box>
              </VStack>
            </Box>

            <Box bg="var(--soland-surface-101014)" p={{ base: 4, md: 6 }} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Heading size="md" mb={4}>Consejos de seguridad</Heading>
              <VStack align="stretch" gap={3}>
                {!imageVerified ? (
                  <Box bg="blackAlpha.300" p={3} borderRadius="md">
                    <Text color="yellow.300">
                      • No autorizar el acceso con este análisis. Toma una foto clara de una persona de cuerpo completo y con el rostro visible.
                    </Text>
                  </Box>
                ) : safeRecommendations.length > 0 ? (
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

        <Box bg="var(--soland-surface-101014)" p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} mb={5} flexWrap="wrap">
            <HStack gap={3}>
              <Center boxSize="42px" borderRadius="lg" bg="yellow.400/10" color="yellow.300">
                <ClipboardList size={21} />
              </Center>
              <Box>
                <Heading size="md">Historial de inspecciones</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>
                  Revisa resultados anteriores y encuentra rápidamente una inspección.
                </Text>
              </Box>
            </HStack>
            {history.length > 0 && (
              <HStack gap={3}>
                <Badge colorScheme="gray" px={3} py={1} borderRadius="full">
                  {history.length} {history.length === 1 ? "registro" : "registros"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  aria-expanded={historyExpanded}
                  aria-controls="epp-inspection-history-content"
                  onClick={() => setHistoryExpanded((expanded) => !expanded)}
                >
                  {historyExpanded ? "Ocultar historial" : "Mostrar historial"}
                </Button>
              </HStack>
            )}
          </Flex>

          {history.length === 0 ? (
            <Center
              flexDirection="column"
              textAlign="center"
              py={10}
              px={4}
              border="1px dashed"
              borderColor="whiteAlpha.200"
              borderRadius="lg"
            >
              <ClipboardList size={30} color="var(--soland-text-muted)" />
              <Text color="gray.200" fontWeight="semibold" mt={3}>Aún no hay inspecciones</Text>
              <Text color="gray.500" fontSize="sm" mt={1}>
                Los análisis guardados aparecerán aquí para facilitar su seguimiento.
              </Text>
            </Center>
          ) : (
            historyExpanded && (
            <VStack id="epp-inspection-history-content" align="stretch" gap={5}>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                <Box p={4} borderRadius="lg" bg="blackAlpha.300" border="1px solid" borderColor="whiteAlpha.100">
                  <HStack color="gray.400" gap={2}>
                    <ClipboardList size={16} />
                    <Text fontSize="sm">Inspecciones registradas</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" mt={2}>{history.length}</Text>
                </Box>
                <Box p={4} borderRadius="lg" bg="blackAlpha.300" border="1px solid" borderColor="whiteAlpha.100">
                  <HStack color="gray.400" gap={2}>
                    <ShieldCheck size={16} />
                    <Text fontSize="sm">Cumplimiento promedio</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" mt={2}>{historyAverageScore}%</Text>
                </Box>
                <Box p={4} borderRadius="lg" bg="blackAlpha.300" border="1px solid" borderColor="whiteAlpha.100">
                  <HStack color="gray.400" gap={2}>
                    <AlertTriangle size={16} />
                    <Text fontSize="sm">Con EPP faltante</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" mt={2}>
                    {history.filter((item) => (item.missing_items || "").split(",").some((value) => value.trim())).length}
                  </Text>
                </Box>
              </SimpleGrid>

              <Flex gap={3} flexWrap="wrap" align="center">
                <HStack
                  flex="1"
                  minW={{ base: "full", md: "260px" }}
                  gap={2}
                  px={3}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="md"
                  bg="blackAlpha.300"
                >
                  <Search size={17} color="var(--soland-text-muted)" />
                  <Input
                    aria-label="Buscar inspecciones"
                    placeholder="Buscar operador, turno o EPP..."
                    value={historySearch}
                    onChange={(event) => {
                      setHistorySearch(event.target.value);
                      setHistoryPage(0);
                    }}
                    border="none"
                    px={0}
                    _focus={{ boxShadow: "none" }}
                  />
                </HStack>
                <Box minW={{ base: "full", md: "210px" }}>
                  <label htmlFor="epp-history-filter" style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
                    Filtrar historial por cumplimiento
                  </label>
                  <select
                    id="epp-history-filter"
                    value={historyFilter}
                    onChange={(event) => {
                      setHistoryFilter(event.target.value);
                      setHistoryPage(0);
                    }}
                    style={{ width: "100%", background: "var(--soland-surface-0b0b0c)", color: "var(--soland-text-primary)", border: "1px solid #4a4a4a", padding: "10px 12px", borderRadius: 6 }}
                  >
                    <option value="all">Todos los resultados</option>
                    <option value="high">Cumplimiento alto · 70%+</option>
                    <option value="medium">En revisión · 40–69%</option>
                    <option value="low">Cumplimiento bajo · menos de 40%</option>
                    <option value="missing">Con EPP faltante</option>
                  </select>
                </Box>
              </Flex>

              {filteredHistory.length === 0 ? (
                <Center py={8} px={4} borderRadius="lg" bg="blackAlpha.200">
                  <Text color="gray.400" textAlign="center">
                    No hay inspecciones que coincidan. Prueba con otro texto o filtro.
                  </Text>
                </Center>
              ) : (
                <>
                  <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
                  {pagedHistory.map((item) => {
                    const score = Math.max(0, Math.min(100, Number(item.score) || 0));
                    const missingItems = (item.missing_items || "").split(",").map((value) => value.trim()).filter(Boolean);
                    const createdAt = new Date(item.created_at);
                    const formattedDate = Number.isNaN(createdAt.getTime())
                      ? "Fecha no disponible"
                      : createdAt.toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" });

                    return (
                      <Box
                        key={item.id}
                        p={4}
                        borderRadius="lg"
                        bg="blackAlpha.300"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        _hover={{ borderColor: "whiteAlpha.300", bg: "whiteAlpha.50" }}
                        transition="all 160ms ease"
                      >
                        <Flex gap={4} align="flex-start">
                          {item.thumbnail_path ? (
                            <Image
                              src={`${SECURITY_MEDIA_URL}${item.thumbnail_path}`}
                              alt={`Miniatura de inspección de ${item.operator_name || "operador"}`}
                              width={{ base: "76px", sm: "96px" }}
                              height={{ base: "76px", sm: "96px" }}
                              flexShrink={0}
                              objectFit="cover"
                              borderRadius="md"
                              border="1px solid"
                              borderColor="whiteAlpha.200"
                            />
                          ) : (
                            <Center
                              boxSize={{ base: "76px", sm: "96px" }}
                              flexShrink={0}
                              borderRadius="md"
                              bg="whiteAlpha.100"
                              color="gray.500"
                            >
                              <ClipboardList size={24} />
                            </Center>
                          )}
                          <VStack align="stretch" gap={2} minW={0} flex="1">
                            <Flex justify="space-between" align="flex-start" gap={2} flexWrap="wrap">
                              <Box minW={0}>
                                <Text fontWeight="bold" color="var(--soland-text-primary)" truncate>
                                  {item.operator_name || "Operador"}
                                </Text>
                                <Text fontSize="xs" color="gray.500" mt={1}>{formattedDate}</Text>
                              </Box>
                              <Badge colorScheme={statusColor(score)} flexShrink={0}>
                                {score}% · {score >= 70 ? "Alto" : score >= 40 ? "En revisión" : "Bajo"}
                              </Badge>
                            </Flex>
                            <Text fontSize="sm" color="gray.400">
                              Turno: {item.turno || "No indicado"}
                            </Text>
                            {item.access_decision && (
                              <HStack gap={2} flexWrap="wrap">
                                <Badge colorScheme={item.access_decision === "approved" ? "green" : "red"}>
                                  {item.access_decision === "approved" ? "Acceso aprobado" : "Acceso denegado"}
                                </Badge>
                                {item.decision_by_username && (
                                  <Text color="gray.500" fontSize="xs">
                                    Decidido por {item.decision_by_username}
                                  </Text>
                                )}
                              </HStack>
                            )}
                            <Box bg="whiteAlpha.100" borderRadius="full" overflow="hidden" h="6px">
                              <Box
                                bg={`${statusColor(score)}.400`}
                                w={`${score}%`}
                                h="100%"
                                transition="width 0.2s ease"
                              />
                            </Box>
                          </VStack>
                        </Flex>

                        <Text fontSize="sm" color="gray.300" mt={4} lineClamp={2}>
                          {item.summary || "Sin resumen disponible."}
                        </Text>

                        <Box mt={4}>
                          <Text fontSize="xs" color="gray.500" mb={2}>EPP faltante</Text>
                          {missingItems.length > 0 ? (
                            <HStack gap={2} flexWrap="wrap">
                              {missingItems.map((missingItem) => (
                                <Badge key={missingItem} colorScheme="red" variant="subtle">
                                  {missingItem}
                                </Badge>
                              ))}
                            </HStack>
                          ) : (
                            <Badge colorScheme="green" variant="subtle">Sin faltantes reportados</Badge>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                  </SimpleGrid>
                  <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
                    <Text color="gray.500" fontSize="sm">
                      Mostrando {currentHistoryPage * historyPageSize + 1}–
                      {Math.min((currentHistoryPage + 1) * historyPageSize, filteredHistory.length)} de {filteredHistory.length}
                    </Text>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryPage(currentHistoryPage - 1)}
                        disabled={currentHistoryPage === 0}
                      >
                        Anterior
                      </Button>
                      <Text color="gray.400" fontSize="sm">
                        Página {currentHistoryPage + 1} de {historyPageCount}
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryPage(currentHistoryPage + 1)}
                        disabled={currentHistoryPage + 1 >= historyPageCount}
                      >
                        Siguiente
                      </Button>
                    </HStack>
                  </Flex>
                </>
              )}
            </VStack>
            )
          )}
        </Box>
      </VStack>
    </Box>
  );
}
