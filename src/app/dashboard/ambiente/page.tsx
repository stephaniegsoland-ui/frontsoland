"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, BookOpen, CalendarDays, Download, Leaf, ShieldCheck, Upload } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const initialTalks = [
  { title: "Manejo responsable de residuos", date: "03 sep", audience: "Operarios planta", owner: "Ana G." },
  { title: "Uso eficiente de agua", date: "08 sep", audience: "Taller y patios", owner: "Marcos T." },
  { title: "Prevención de contaminación", date: "12 sep", audience: "Personal administrativo", owner: "Diana R." },
];

const initialDrills = [
  { title: "Simulacro de derrame químico", date: "06 sep", zone: "Bodega química", status: "Programado" },
  { title: "Evacuación por incendio ambiental", date: "18 sep", zone: "Planta principal", status: "Preparación" },
  { title: "Respuesta ante fuga de agua", date: "25 sep", zone: "Sistema de tratamiento", status: "Pendiente" },
];

const initialDocs = [
  { title: "Plan de gestión ambiental", type: "PDF", owner: "Dpto. Ambiente" },
  { title: "Monitoreo de calidad de agua", type: "XLSX", owner: "Laboratorio" },
  { title: "Procedimiento de residuos peligrosos", type: "DOC", owner: "HSE" },
];

const activities = [
  { day: "Lun", label: "Monitoreo de efluentes", time: "08:00" },
  { day: "Mar", label: "Inspección de residuos", time: "09:00" },
  { day: "Mié", label: "Capacitación ambiental", time: "10:30" },
  { day: "Jue", label: "Simulacro de derrame", time: "15:00" },
  { day: "Vie", label: "Cierre documental", time: "12:00" },
];

const statusColors: Record<string, string> = {
  "Programado": "blue",
  "Preparación": "purple",
  "Pendiente": "orange",
  "OK": "green",
};

const waterQualityData = [
  { month: "Ene", ph: 7.3, turbidez: 5.8 },
  { month: "Feb", ph: 7.5, turbidez: 5.2 },
  { month: "Mar", ph: 7.7, turbidez: 4.6 },
  { month: "Abr", ph: 7.8, turbidez: 4.3 },
  { month: "May", ph: 7.6, turbidez: 3.9 },
  { month: "Jun", ph: 7.9, turbidez: 3.7 },
];

const emissionData = [
  { area: "Planta", value: 68 },
  { area: "Patio", value: 52 },
  { area: "Oficina", value: 31 },
  { area: "Transporte", value: 45 },
];

const wasteData = [
  { name: "Reciclables", value: 42, color: "#34d399" },
  { name: "Peligrosos", value: 26, color: "#fbbf24" },
  { name: "Orgánicos", value: 18, color: "#60a5fa" },
  { name: "Otros", value: 14, color: "#f87171" },
];

const trendData = [
  { mes: "Ene", cumplimiento: 62 },
  { mes: "Feb", cumplimiento: 68 },
  { mes: "Mar", cumplimiento: 71 },
  { mes: "Abr", cumplimiento: 78 },
  { mes: "May", cumplimiento: 83 },
  { mes: "Jun", cumplimiento: 89 },
];

export default function AmbienteDashboardPage() {
  const [talks, setTalks] = useState(initialTalks);
  const [drills, setDrills] = useState(initialDrills);
  const [documents, setDocuments] = useState(initialDocs);
  const [activeAction, setActiveAction] = useState<"talk" | "drill" | "document" | "history" | null>(null);
  const [newTalk, setNewTalk] = useState({ title: "", date: "", audience: "", owner: "" });
  const [newDrill, setNewDrill] = useState({ title: "", date: "", zone: "", status: "Programado" });
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("PDF");
  const [documentComment, setDocumentComment] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironmentData = async () => {
    try {
      setLoading(true);
      const [talksRes, drillsRes, docsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/environment/talks`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/environment/drills`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/environment/documents`, { credentials: "include" }),
      ]);

      if (talksRes.ok) {
        const talksData = await talksRes.json();
        if (Array.isArray(talksData) && talksData.length > 0) setTalks(talksData.map((item: any) => ({ title: item.title, date: item.date, audience: item.audience, owner: item.owner })));
      }

      if (drillsRes.ok) {
        const drillsData = await drillsRes.json();
        if (Array.isArray(drillsData) && drillsData.length > 0) setDrills(drillsData.map((item: any) => ({ title: item.title, date: item.date, zone: item.zone, status: item.status })));
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        if (Array.isArray(docsData) && docsData.length > 0) setDocuments(docsData.map((item: any) => ({ title: item.title, type: item.type, owner: item.owner })));
      }
    } catch (err) {
      console.error("No se pudo cargar ambiente desde backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironmentData();
  }, []);

  const totalCompliant = useMemo(() => Math.round((89 + 92 + 87 + 94) / 4), []);

  const historyItems = [
    ...talks.slice(0, 2).map((item) => ({ type: "Charla", label: item.title, detail: `${item.date} • ${item.owner}` })),
    ...drills.slice(0, 2).map((item) => ({ type: "Simulacro", label: item.title, detail: `${item.date} • ${item.status}` })),
    ...documents.slice(0, 2).map((item) => ({ type: "Archivo", label: item.title, detail: `${item.type} • ${item.owner}` })),
  ];

  const handleAddTalk = async () => {
    if (!newTalk.title.trim() || !newTalk.owner.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/environment/talks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newTalk.title.trim(),
          date: newTalk.date || "Próxima",
          audience: newTalk.audience.trim() || "Todo el personal",
          owner: newTalk.owner.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la charla ambiental");
      }

      const savedTalk = await response.json();
      setTalks((prev) => [{
        title: savedTalk.title,
        date: savedTalk.date,
        audience: savedTalk.audience,
        owner: savedTalk.owner,
      }, ...prev]);
      setNewTalk({ title: "", date: "", audience: "", owner: "" });
      setError(null);
      setActiveAction("talk");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la charla. Revisa que el backend esté disponible.");
    }
  };

  const handleAddDrill = async () => {
    if (!newDrill.title.trim() || !newDrill.zone.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/environment/drills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newDrill.title.trim(),
          date: newDrill.date || "Próxima",
          zone: newDrill.zone.trim(),
          status: newDrill.status,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el simulacro");
      }

      const savedDrill = await response.json();
      setDrills((prev) => [{
        title: savedDrill.title,
        date: savedDrill.date,
        zone: savedDrill.zone,
        status: savedDrill.status,
      }, ...prev]);
      setNewDrill({ title: "", date: "", zone: "", status: "Programado" });
      setError(null);
      setActiveAction("drill");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el simulacro. Revisa que el backend esté disponible.");
    }
  };

  const handleAddDocument = async () => {
    if (!documentName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("title", documentName.trim());
      formData.append("doc_type", documentType);
      formData.append("owner", "Dpto. Ambiente");
      if (documentComment.trim()) formData.append("comment", documentComment.trim());
      if (uploadFile) formData.append("file", uploadFile);

      const response = await fetch(`${API_BASE_URL}/api/environment/documents/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "No se pudo guardar el documento");
      }

      const savedDocument = await response.json();
      const filePath = savedDocument.file_name || savedDocument.file || "";
      setDocuments((prev) => [{ title: savedDocument.title, type: savedDocument.type, owner: savedDocument.owner, filePath }, ...prev]);
      setDocumentName("");
      setDocumentType("PDF");
      setDocumentComment("");
      setUploadFile(null);
      setError(null);
      setActiveAction("document");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No se pudo guardar el documento. Revisa que el backend esté disponible.");
    }
  };

  return (
    <Box bg="#08080a" minH="100vh" color="white" p={{ base: 4, md: 6 }}>
      <VStack align="stretch" gap={6}>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4}>
          <Box>
            <Text fontSize="sm" color="green.300" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
              Ambiente
            </Text>
            <Heading as="h1" size="lg" mt={1}>
              Departamento ambiental
            </Heading>
          </Box>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Cumplimiento</Text>
                <Heading as="h2" size="lg" mt={1}>{totalCompliant}%</Heading>
              </Box>
              <Box bg="green.500/10" color="green.300" p={2} borderRadius="lg">
                <Leaf size={20} />
              </Box>
            </Flex>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Capacitaciones</Text>
                <Heading as="h2" size="lg" mt={1}>{talks.length}</Heading>
              </Box>
              <Box bg="blue.500/10" color="blue.300" p={2} borderRadius="lg">
                <BookOpen size={20} />
              </Box>
            </Flex>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Simulacros</Text>
                <Heading as="h2" size="lg" mt={1}>{drills.length}</Heading>
              </Box>
              <Box bg="yellow.500/10" color="yellow.300" p={2} borderRadius="lg">
                <Activity size={20} />
              </Box>
            </Flex>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Alertas</Text>
                <Heading as="h2" size="lg" mt={1}>2</Heading>
              </Box>
              <Box bg="red.500/10" color="red.300" p={2} borderRadius="lg">
                <AlertTriangle size={20} />
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>

        {error && (
          <Box bg="red.500/10" border="1px solid" borderColor="red.400" color="red.200" p={3} borderRadius="lg">
            {error}
          </Box>
        )}

        {loading && (
          <Box bg="green.500/10" border="1px solid" borderColor="green.400" color="green.200" p={3} borderRadius="lg">
            Actualizando información ambiental...
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, xl: 3 }} gap={4}>
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Text fontWeight="bold" mb={3}>Calidad de agua</Text>
            <Box h="220px">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={waterQualityData}>
                  <defs>
                    <linearGradient id="waterTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="month" stroke="#a0aec0" fontSize={12} />
                  <YAxis stroke="#a0aec0" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#111214", border: "1px solid #374151", color: "white" }} />
                  <Area type="monotone" dataKey="ph" stroke="#34d399" fillOpacity={1} fill="url(#waterTrend)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Text fontWeight="bold" mb={3}>Emisiones por área</Text>
            <Box h="220px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="area" stroke="#a0aec0" fontSize={12} />
                  <YAxis stroke="#a0aec0" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#111214", border: "1px solid #374151", color: "white" }} />
                  <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Text fontWeight="bold" mb={3}>Gestión de residuos</Text>
            <Box h="220px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wasteData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={72} paddingAngle={3}>
                    {wasteData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111214", border: "1px solid #374151", color: "white" }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <VStack align="stretch" mt={2} gap={1}>
              {wasteData.map((item) => (
                <Flex key={item.name} justify="space-between" align="center" fontSize="sm" color="gray.300">
                  <HStack gap={2}>
                    <Box w={3} h={3} borderRadius="full" bg={item.color} />
                    <Text>{item.name}</Text>
                  </HStack>
                  <Text>{item.value}%</Text>
                </Flex>
              ))}
            </VStack>
          </Box>
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", xl: "1.7fr 1fr" }} gap={6}>
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">Estadísticas ambientales</Heading>
              <Badge colorScheme="green">Meta anual 90%</Badge>
            </Flex>
            <Box h="240px">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="envTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="mes" stroke="#a0aec0" fontSize={12} />
                  <YAxis stroke="#a0aec0" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#111214", border: "1px solid #374151", color: "white" }} />
                  <Area type="monotone" dataKey="cumplimiento" stroke="#10b981" fillOpacity={1} fill="url(#envTrend)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Cronograma</Heading>
            <VStack align="stretch" gap={3}>
              {activities.map((item) => (
                <Flex key={item.label} justify="space-between" align="center" bg="#0b0b0c" borderRadius="lg" p={3}>
                  <HStack gap={3}>
                    <Box bg="green.500/10" color="green.300" borderRadius="md" p={2}>
                      <CalendarDays size={16} />
                    </Box>
                    <Box>
                      <Text fontWeight="bold">{item.label}</Text>
                      <Text fontSize="sm" color="gray.400">{item.time}</Text>
                    </Box>
                  </HStack>
                  <Badge colorScheme="green">{item.day}</Badge>
                </Flex>
              ))}
            </VStack>
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Charlas ambientales</Heading>
            {activeAction === "talk" && (
              <Box bg="#0b0b0c" borderRadius="lg" p={4} border="1px solid" borderColor="whiteAlpha.200" mb={4}>
                <Text fontWeight="bold" mb={3}>Cargar charla</Text>
                <VStack align="stretch" gap={3}>
                  <Input placeholder="Tema de la charla" value={newTalk.title} onChange={(e) => setNewTalk((prev) => ({ ...prev, title: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <HStack gap={3}>
                    <Input placeholder="Fecha" value={newTalk.date} onChange={(e) => setNewTalk((prev) => ({ ...prev, date: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                    <Input placeholder="Audiencia" value={newTalk.audience} onChange={(e) => setNewTalk((prev) => ({ ...prev, audience: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  </HStack>
                  <Input placeholder="Responsable" value={newTalk.owner} onChange={(e) => setNewTalk((prev) => ({ ...prev, owner: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Button colorScheme="green" onClick={handleAddTalk}>Guardar charla</Button>
                </VStack>
              </Box>
            )}
            <VStack align="stretch" gap={3}>
              {talks.map((item, index) => (
                <Box key={`${item.title}-${item.date}-${index}`} bg="#0b0b0c" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.100">
                  <Flex justify="space-between" align="center" gap={3}>
                    <Text fontWeight="bold">{item.title}</Text>
                    <Badge colorScheme="green">{item.date}</Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.400" mt={2}>{item.audience}</Text>
                  <Text fontSize="sm" color="gray.300">Responsable: {item.owner}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Simulacros ambientales</Heading>
            {activeAction === "drill" && (
              <Box bg="#0b0b0c" borderRadius="lg" p={4} border="1px solid" borderColor="whiteAlpha.200" mb={4}>
                <Text fontWeight="bold" mb={3}>Cargar simulacro</Text>
                <VStack align="stretch" gap={3}>
                  <Input placeholder="Nombre del simulacro" value={newDrill.title} onChange={(e) => setNewDrill((prev) => ({ ...prev, title: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Input placeholder="Fecha" value={newDrill.date} onChange={(e) => setNewDrill((prev) => ({ ...prev, date: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Input placeholder="Zona / área" value={newDrill.zone} onChange={(e) => setNewDrill((prev) => ({ ...prev, zone: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <select value={newDrill.status} onChange={(e) => setNewDrill((prev) => ({ ...prev, status: e.target.value }))} style={{ background: "#111214", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "8px 12px" }}>
                    <option value="Programado">Programado</option>
                    <option value="Preparación">Preparación</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                  <Button colorScheme="green" onClick={handleAddDrill}>Guardar simulacro</Button>
                </VStack>
              </Box>
            )}
            <VStack align="stretch" gap={3}>
              {drills.map((item, index) => (
                <Box key={`${item.title}-${item.date}-${index}`} bg="#0b0b0c" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.100">
                  <Flex justify="space-between" align="center" gap={3}>
                    <Text fontWeight="bold">{item.title}</Text>
                    <Badge colorScheme={statusColors[item.status] || "gray"}>{item.status}</Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.400" mt={2}>{item.zone}</Text>
                  <Text fontSize="sm" color="gray.300">Fecha: {item.date}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr" }} gap={6}>
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">Archivos importantes</Heading>
              <Button size="sm" colorScheme="green">
                <HStack gap={2}>
                  <Upload size={15} />
                  <Text>Subir</Text>
                </HStack>
              </Button>
            </Flex>
            <Stack gap={3}>
              {documents.map((item) => (
                <Flex key={item.title} justify="space-between" align="center" bg="#0b0b0c" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.100">
                  <HStack gap={3}>
                    <Box bg="green.500/10" color="green.300" borderRadius="md" p={2}>
                      <Download size={16} />
                    </Box>
                    <Box>
                      <Text fontWeight="bold">{item.title}</Text>
                      <Text fontSize="sm" color="gray.400">{item.type} • {item.owner}</Text>
                    </Box>
                  </HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="green"
                    onClick={() => {
                      const fileUrl = (item as any).filePath || (item as any).file_name || "";
                      if (fileUrl) {
                        const url = `${API_BASE_URL}${fileUrl}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Abrir
                  </Button>
                </Flex>
              ))}
            </Stack>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Registrar documento</Heading>
            <VStack align="stretch" gap={3}>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Nombre</Text>
                <Input value={documentName} onChange={(e) => setDocumentName(e.target.value)} bg="#0b0b0c" borderColor="whiteAlpha.200" />
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Tipo</Text>
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} style={{ width: "100%", background: "#0b0b0c", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "8px 12px" }}>
                  <option value="PDF">PDF</option>
                  <option value="DOC">DOC</option>
                  <option value="XLSX">XLSX</option>
                  <option value="IMG">IMG</option>
                </select>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Comentario</Text>
                <Textarea value={documentComment} onChange={(e) => setDocumentComment(e.target.value)} bg="#0b0b0c" borderColor="whiteAlpha.200" rows={4} />
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Archivo</Text>
                <Input type="file" bg="#0b0b0c" borderColor="whiteAlpha.200" p={2} onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
              </Box>

              <Button colorScheme="green" onClick={handleAddDocument}>
                <HStack gap={2}>
                  <ShieldCheck size={16} />
                  <Text>Guardar documento</Text>
                </HStack>
              </Button>
            </VStack>
          </Box>
        </Grid>

        <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading as="h3" size="md">Acciones rápidas</Heading>
            <Badge colorScheme="green">Gestión ambiental</Badge>
          </Flex>
          <Box h="1px" bg="whiteAlpha.100" my={4} />
          <HStack flexWrap="wrap" gap={3}>
            <Button colorScheme="green" onClick={() => setActiveAction("talk")}>Charla</Button>
            <Button variant="outline" colorScheme="green" onClick={() => setActiveAction("drill")}>Simulacro</Button>
            <Button variant="outline" colorScheme="green" onClick={() => setActiveAction("document")}>Subir archivo</Button>
            <Button variant="ghost" colorScheme="green" onClick={() => setActiveAction("history")}>Ver historial</Button>
          </HStack>
        </Box>

        {activeAction === "history" && (
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Historial</Heading>
            <VStack align="stretch" gap={3}>
              {historyItems.map((item, index) => (
                <Flex key={`${item.type}-${item.label}-${index}`} justify="space-between" align="center" bg="#0b0b0c" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.100">
                  <Box>
                    <Text fontWeight="bold">{item.label}</Text>
                    <Text fontSize="sm" color="gray.400">{item.detail}</Text>
                  </Box>
                  <Badge colorScheme="green">{item.type}</Badge>
                </Flex>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
