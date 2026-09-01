"use client";

import { useMemo, useState } from "react";
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
import NextLink from "next/link";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const initialInspections = [
  { title: "Inspección de EPP", site: "Planta Norte", responsable: "Carlos M.", status: "En revisión", due: "Hoy" },
  { title: "Inspección de vehículos", site: "Patio central", responsable: "Ariel R.", status: "OK", due: "Mañana" },
  { title: "Inspección de herramientas", site: "Taller mecánico", responsable: "Luis P.", status: "Pendiente", due: "Jueves" },
];

const initialCharlas = [
  { title: "Inducción de seguridad", date: "03 sep", audience: "Personal nuevo", owner: "Ana G." },
  { title: "Prevención de caídas", date: "05 sep", audience: "Operarios planta", owner: "Marcos T." },
  { title: "Charla de conducción defensiva", date: "12 sep", audience: "Conductores", owner: "Daniel H." },
];

const initialDrills = [
  { title: "Simulacro de incendios", date: "08 sep", area: "Planta principal", status: "Programado" },
  { title: "Simulacro de sismo", date: "18 sep", area: "Oficinas y patio", status: "Preparación" },
  { title: "Evacuación por derrame", date: "24 sep", area: "Zona de carga", status: "Pendiente" },
];

const activities = [
  { day: "Lun", label: "Revisión de EPP", time: "08:30" },
  { day: "Mar", label: "Capacitación semanal", time: "09:00" },
  { day: "Mié", label: "Inspección de patios", time: "07:30" },
  { day: "Jue", label: "Simulacro", time: "15:00" },
  { day: "Vie", label: "Cierre documental", time: "12:00" },
];

const docs = [
  { title: "Procedimientos de seguridad", type: "PDF", owner: "SS.OO." },
  { title: "Cronograma de capacitaciones", type: "XLSX", owner: "RRHH" },
  { title: "Checklist de inspección", type: "DOC", owner: "Seguridad" },
];

const statusColors: Record<string, string> = {
  "OK": "green",
  "En revisión": "yellow",
  "Pendiente": "orange",
  "Programado": "blue",
  "Preparación": "purple",
};

const complianceData = [
  { name: "EPP", cumplimiento: 92, objetivo: 100 },
  { name: "Inspecciones", cumplimiento: 84, objetivo: 100 },
  { name: "Charlas", cumplimiento: 76, objetivo: 100 },
  { name: "Simulacros", cumplimiento: 68, objetivo: 100 },
];

const trendData = [
  { mes: "Jul", cumplimiento: 58 },
  { mes: "Ago", cumplimiento: 67 },
  { mes: "Sep", cumplimiento: 74 },
  { mes: "Oct", cumplimiento: 81 },
  { mes: "Nov", cumplimiento: 88 },
];

const statusTotalData = [
  { name: "OK", value: 42, color: "#34d399" },
  { name: "Pendiente", value: 18, color: "#fbbf24" },
  { name: "Revisión", value: 11, color: "#f97316" },
  { name: "Crítico", value: 5, color: "#f87171" },
];

export default function SeguridadDashboardPage() {
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("PDF");
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("todos");
  const [activeAction, setActiveAction] = useState<"inspection" | "talk" | "drill" | "history" | null>(null);
  const [inspections, setInspections] = useState(initialInspections);
  const [charlas, setCharlas] = useState(initialCharlas);
  const [drills, setDrills] = useState(initialDrills);
  const [newInspection, setNewInspection] = useState({ title: "", site: "", responsable: "", status: "Pendiente", due: "Hoy" });
  const [newTalk, setNewTalk] = useState({ title: "", date: "", audience: "", owner: "" });
  const [newDrillForm, setNewDrillForm] = useState({ title: "", date: "", area: "", status: "Programado" });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleAddInspection = () => {
    if (!newInspection.title.trim() || !newInspection.site.trim()) return;
    setInspections((prev) => [{ ...newInspection, title: newInspection.title.trim(), site: newInspection.site.trim(), responsable: newInspection.responsable.trim() || "Sin responsable" }, ...prev]);
    setNewInspection({ title: "", site: "", responsable: "", status: "Pendiente", due: "Hoy" });
    setActiveAction("inspection");
    scrollToSection("inspecciones-panel");
  };

  const handleAddTalk = () => {
    if (!newTalk.title.trim() || !newTalk.owner.trim()) return;
    setCharlas((prev) => [{ title: newTalk.title.trim(), date: newTalk.date || "Próxima", audience: newTalk.audience.trim() || "Todo el personal", owner: newTalk.owner.trim() }, ...prev]);
    setNewTalk({ title: "", date: "", audience: "", owner: "" });
    setActiveAction("talk");
    scrollToSection("charlas-panel");
  };

  const handleAddDrill = () => {
    if (!newDrillForm.title.trim() || !newDrillForm.area.trim()) return;
    setDrills((prev) => [{ title: newDrillForm.title.trim(), date: newDrillForm.date || "Próxima", area: newDrillForm.area.trim(), status: newDrillForm.status }, ...prev]);
    setNewDrillForm({ title: "", date: "", area: "", status: "Programado" });
    setActiveAction("drill");
    scrollToSection("simulacros-panel");
  };

  const filteredInspections = useMemo(() => {
    if (filter === "todos") return inspections;
    return inspections.filter((item) => item.status.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, inspections]);

  const totalPending = inspections.filter((item) => item.status !== "OK").length;
  const totalActive = charlas.length + drills.length;

  const historyItems = [
    ...inspections.slice(0, 2).map((item) => ({ type: "Inspección", label: item.title, detail: `${item.site} • ${item.status}` })),
    ...charlas.slice(0, 2).map((item) => ({ type: "Charla", label: item.title, detail: `${item.date} • ${item.owner}` })),
    ...drills.slice(0, 2).map((item) => ({ type: "Simulacro", label: item.title, detail: `${item.date} • ${item.status}` })),
  ];

  return (
    <Box bg="#08080a" minH="100vh" color="white" p={{ base: 4, md: 6 }}>
      <VStack align="stretch" gap={6}>
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4}>
          <Box>
            <Text fontSize="sm" color="yellow.300" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
              Seguridad
            </Text>
            <Heading as="h1" size="lg" mt={1}>
              Dashboard de gestión
            </Heading>
          </Box>

          <HStack flexWrap="wrap" gap={2}>
            <NextLink href="/dashboard/seguridad-epp" passHref>
              <Button size="sm" colorScheme="yellow">EPP</Button>
            </NextLink>
            <NextLink href="/dashboard/seguridad-permisos" passHref>
              <Button size="sm" variant="outline" colorScheme="yellow">Permisos</Button>
            </NextLink>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Inspecciones</Text>
                <Heading as="h2" size="lg" mt={1}>{inspections.length}</Heading>
              </Box>
              <Box bg="yellow.500/10" color="yellow.300" p={2} borderRadius="lg">
                <ClipboardCheck size={20} />
              </Box>
            </Flex>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Pendientes</Text>
                <Heading as="h2" size="lg" mt={1}>{totalPending}</Heading>
              </Box>
              <Box bg="orange.500/10" color="orange.300" p={2} borderRadius="lg">
                <AlertTriangle size={20} />
              </Box>
            </Flex>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Charlas y capacitaciones</Text>
                <Heading as="h2" size="lg" mt={1}>{charlas.length}</Heading>
              </Box>
              <Box bg="green.500/10" color="green.300" p={2} borderRadius="lg">
                <BookOpen size={20} />
              </Box>
            </Flex>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="xs" color="gray.400">Simulacros activos</Text>
                <Heading as="h2" size="lg" mt={1}>{totalActive}</Heading>
              </Box>
              <Box bg="purple.500/10" color="purple.300" p={2} borderRadius="lg">
                <Activity size={20} />
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, xl: 3 }} gap={4}>
          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Text fontWeight="bold" mb={3}>Cumplimiento por área</Text>
            <Box h="220px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="name" stroke="#a0aec0" fontSize={12} />
                  <YAxis stroke="#a0aec0" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#111214", border: "1px solid #374151", color: "white" }} />
                  <Bar dataKey="cumplimiento" fill="#f6ad55" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Text fontWeight="bold" mb={3}>Tendencia de avance</Text>
            <Box h="220px">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="safetyTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f6ad55" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#f6ad55" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="mes" stroke="#a0aec0" fontSize={12} />
                  <YAxis stroke="#a0aec0" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#111214", border: "1px solid #374151", color: "white" }} />
                  <Area type="monotone" dataKey="cumplimiento" stroke="#f6ad55" fillOpacity={1} fill="url(#safetyTrendFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Text fontWeight="bold" mb={3}>Estado general</Text>
            <Box h="220px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusTotalData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={72} paddingAngle={3}>
                    {statusTotalData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111214", border: "1px solid #374151", color: "white" }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <VStack align="stretch" mt={2} gap={1}>
              {statusTotalData.map((item) => (
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
          <Box id="inspecciones-panel" bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">Inspecciones</Heading>
              <select value={filter} onChange={(event) => setFilter(event.target.value)} style={{ width: "180px", background: "#0b0b0c", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}>
                <option value="todos">Todos</option>
                <option value="ok">OK</option>
                <option value="pendiente">Pendiente</option>
                <option value="revisión">En revisión</option>
              </select>
            </Flex>

            {activeAction === "inspection" && (
              <Box bg="#0b0b0c" borderRadius="lg" p={4} border="1px solid" borderColor="whiteAlpha.200" mb={4}>
                <Text fontWeight="bold" mb={3}>Cargar inspección</Text>
                <VStack align="stretch" gap={3}>
                  <Input placeholder="Título de la inspección" value={newInspection.title} onChange={(e) => setNewInspection((prev) => ({ ...prev, title: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Input placeholder="Sitio / área" value={newInspection.site} onChange={(e) => setNewInspection((prev) => ({ ...prev, site: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Input placeholder="Responsable" value={newInspection.responsable} onChange={(e) => setNewInspection((prev) => ({ ...prev, responsable: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <HStack gap={3}>
                    <select value={newInspection.status} onChange={(e) => setNewInspection((prev) => ({ ...prev, status: e.target.value }))} style={{ flex: 1, background: "#111214", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "8px 12px" }}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En revisión">En revisión</option>
                      <option value="OK">OK</option>
                    </select>
                    <Input value={newInspection.due} onChange={(e) => setNewInspection((prev) => ({ ...prev, due: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" placeholder="Fecha" />
                  </HStack>
                  <Button colorScheme="yellow" onClick={handleAddInspection}>Guardar inspección</Button>
                </VStack>
              </Box>
            )}

            <VStack align="stretch" gap={3}>
              {filteredInspections.map((item) => (
                <Flex key={`${item.title}-${item.site}`} justify="space-between" align="center" bg="#0b0b0c" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.100">
                  <Box>
                    <Text fontWeight="bold">{item.title}</Text>
                    <Text fontSize="sm" color="gray.400">
                      {item.site} • {item.responsable}
                    </Text>
                  </Box>
                  <HStack gap={2}>
                    <Badge colorScheme={statusColors[item.status] || "gray"}>{item.status}</Badge>
                    <Text fontSize="xs" color="gray.400">{item.due}</Text>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </Box>

          <Box bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Cronograma de actividades</Heading>
            <VStack align="stretch" gap={3}>
              {activities.map((item) => (
                <Flex key={item.label} justify="space-between" align="center" bg="#0b0b0c" borderRadius="lg" p={3}>
                  <HStack gap={3}>
                    <Box bg="yellow.500/10" color="yellow.300" borderRadius="md" p={2}>
                      <CalendarDays size={16} />
                    </Box>
                    <Box>
                      <Text fontWeight="bold">{item.label}</Text>
                      <Text fontSize="sm" color="gray.400">{item.time}</Text>
                    </Box>
                  </HStack>
                  <Badge colorScheme="yellow">{item.day}</Badge>
                </Flex>
              ))}
            </VStack>
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          <Box id="charlas-panel" bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Charlas</Heading>
            {activeAction === "talk" && (
              <Box bg="#0b0b0c" borderRadius="lg" p={4} border="1px solid" borderColor="whiteAlpha.200" mb={4}>
                <Text fontWeight="bold" mb={3}>Cargar charla</Text>
                <VStack align="stretch" gap={3}>
                  <Input placeholder="Nombre de la charla" value={newTalk.title} onChange={(e) => setNewTalk((prev) => ({ ...prev, title: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <HStack gap={3}>
                    <Input placeholder="Fecha" value={newTalk.date} onChange={(e) => setNewTalk((prev) => ({ ...prev, date: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                    <Input placeholder="Audiencia" value={newTalk.audience} onChange={(e) => setNewTalk((prev) => ({ ...prev, audience: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  </HStack>
                  <Input placeholder="Responsable" value={newTalk.owner} onChange={(e) => setNewTalk((prev) => ({ ...prev, owner: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Button colorScheme="yellow" onClick={handleAddTalk}>Guardar charla</Button>
                </VStack>
              </Box>
            )}
            <VStack align="stretch" gap={3}>
              {charlas.map((item, index) => (
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

          <Box id="simulacros-panel" bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Simulacros</Heading>
            {activeAction === "drill" && (
              <Box bg="#0b0b0c" borderRadius="lg" p={4} border="1px solid" borderColor="whiteAlpha.200" mb={4}>
                <Text fontWeight="bold" mb={3}>Cargar simulacro</Text>
                <VStack align="stretch" gap={3}>
                  <Input placeholder="Nombre del simulacro" value={newDrillForm.title} onChange={(e) => setNewDrillForm((prev) => ({ ...prev, title: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Input placeholder="Fecha" value={newDrillForm.date} onChange={(e) => setNewDrillForm((prev) => ({ ...prev, date: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <Input placeholder="Área / zona" value={newDrillForm.area} onChange={(e) => setNewDrillForm((prev) => ({ ...prev, area: e.target.value }))} bg="#111214" borderColor="whiteAlpha.200" />
                  <select value={newDrillForm.status} onChange={(e) => setNewDrillForm((prev) => ({ ...prev, status: e.target.value }))} style={{ background: "#111214", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "8px 12px" }}>
                    <option value="Programado">Programado</option>
                    <option value="Preparación">Preparación</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                  <Button colorScheme="yellow" onClick={handleAddDrill}>Guardar simulacro</Button>
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
                  <Text fontSize="sm" color="gray.400" mt={2}>{item.area}</Text>
                  <Text fontSize="sm" color="gray.300">Fecha: {item.date}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr" }} gap={6}>
          <Box id="documentacion-panel" bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h3" size="md">Documentación</Heading>
              <Button size="sm" colorScheme="yellow">
                <HStack gap={2}>
                  <Upload size={15} />
                  <Text>Subir archivo</Text>
                </HStack>
              </Button>
            </Flex>

            <Stack gap={3}>
              {docs.map((item) => (
                <Flex key={item.title} justify="space-between" align="center" bg="#0b0b0c" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.100">
                  <HStack gap={3}>
                    <Box bg="blue.500/10" color="blue.300" borderRadius="md" p={2}>
                      <FileText size={16} />
                    </Box>
                    <Box>
                      <Text fontWeight="bold">{item.title}</Text>
                      <Text fontSize="sm" color="gray.400">{item.type} • {item.owner}</Text>
                    </Box>
                  </HStack>
                  <Button size="sm" variant="outline" colorScheme="yellow">Abrir</Button>
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
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} style={{ width: "100%", background: "#0b0b0c", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}>
                  <option value="PDF">PDF</option>
                  <option value="DOC">DOC</option>
                  <option value="XLSX">XLSX</option>
                  <option value="IMG">IMG</option>
                </select>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Comentario</Text>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} bg="#0b0b0c" borderColor="whiteAlpha.200" rows={4} />
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>Archivo</Text>
                <Input type="file" bg="#0b0b0c" borderColor="whiteAlpha.200" p={2} />
              </Box>

              <Button colorScheme="yellow">
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
            <Badge colorScheme="yellow">Gestión</Badge>
          </Flex>
          <Box h="1px" bg="whiteAlpha.100" my={4} />
          <HStack flexWrap="wrap" gap={3}>
            <Button colorScheme="yellow" onClick={() => { setActiveAction("inspection"); scrollToSection("inspecciones-panel"); }}>Cargar</Button>
            <Button variant="outline" colorScheme="yellow" onClick={() => { setActiveAction("talk"); scrollToSection("charlas-panel"); }}>Charla</Button>
            <Button variant="outline" colorScheme="yellow" onClick={() => { setActiveAction("drill"); scrollToSection("simulacros-panel"); }}>Simulacro</Button>
            <Button variant="ghost" colorScheme="yellow" onClick={() => { setActiveAction("history"); scrollToSection("historial-panel"); }}>Ver historial</Button>
          </HStack>
        </Box>

        {activeAction === "history" && (
          <Box id="historial-panel" bg="#111214" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4}>
            <Heading as="h3" size="md" mb={4}>Historial</Heading>
            <VStack align="stretch" gap={3}>
              {historyItems.map((item, index) => (
                <Flex key={`${item.type}-${item.label}-${index}`} justify="space-between" align="center" bg="#0b0b0c" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.100">
                  <Box>
                    <Text fontWeight="bold">{item.label}</Text>
                    <Text fontSize="sm" color="gray.400">{item.detail}</Text>
                  </Box>
                  <Badge colorScheme="yellow">{item.type}</Badge>
                </Flex>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
