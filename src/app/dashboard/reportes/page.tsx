"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchReportsData } from "@/actions/reportes";
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
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  BarChart3,
  CalendarDays,
  Download,
  FileCheck2,
  FileText,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  Leaf,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ReportArea = "General" | "Inventario" | "Seguridad" | "Flota" | "ART / VIT";
type ReportStatus = "Todos" | "Completado" | "Pendiente" | "Alerta";
type JsonRecord = Record<string, unknown>;

interface ReportRow {
  id: string;
  date: string;
  area: Exclude<ReportArea, "General">;
  title: string;
  owner: string;
  status: Exclude<ReportStatus, "Todos">;
  value: string;
}

const reportRows: ReportRow[] = [
  { id: "REP-1048", date: "2026-08-28", area: "Seguridad", title: "Inspección EPP planta norte", owner: "Carlos Mendoza", status: "Completado", value: "94%" },
  { id: "REP-1047", date: "2026-08-28", area: "ART / VIT", title: "Validación ART trabajo en caliente", owner: "María Salas", status: "Completado", value: "Aprobado" },
  { id: "REP-1046", date: "2026-08-27", area: "Inventario", title: "Reposición de guantes anticorte", owner: "Almacén central", status: "Pendiente", value: "18 und." },
  { id: "REP-1045", date: "2026-08-27", area: "Flota", title: "Inspección unidad FL-204", owner: "Operaciones", status: "Completado", value: "Apto" },
  { id: "REP-1044", date: "2026-08-26", area: "Seguridad", title: "Hallazgo en zona de soldadura", owner: "Jorge Paredes", status: "Alerta", value: "Alta" },
  { id: "REP-1043", date: "2026-08-26", area: "ART / VIT", title: "VIT pendiente de firma", owner: "Supervisión", status: "Pendiente", value: "1 firma" },
  { id: "REP-1042", date: "2026-08-25", area: "Inventario", title: "Conteo semanal de EPP", owner: "Almacén central", status: "Completado", value: "184 ítems" },
];

const inventoryData = [
  { name: "EPP", total: 68, low: 3 },
  { name: "Señalización", total: 42, low: 1 },
  { name: "Herramientas", total: 31, low: 2 },
  { name: "Emergencia", total: 18, low: 0 },
  { name: "Bloqueo", total: 25, low: 1 },
];

const safetyData = [
  { day: "Lun", inspecciones: 18, hallazgos: 3 },
  { day: "Mar", inspecciones: 24, hallazgos: 5 },
  { day: "Mié", inspecciones: 21, hallazgos: 2 },
  { day: "Jue", inspecciones: 29, hallazgos: 4 },
  { day: "Vie", inspecciones: 34, hallazgos: 1 },
  { day: "Sáb", inspecciones: 16, hallazgos: 2 },
  { day: "Hoy", inspecciones: 27, hallazgos: 1 },
];

const documentData = [
  { name: "ART", value: 24, color: "#22d3ee" },
  { name: "VIT", value: 18, color: "#eab308" },
  { name: "EPP", value: 31, color: "#4ade80" },
];

const areaOptions: ReportArea[] = ["General", "Inventario", "Seguridad", "Flota", "ART / VIT"];
const statusOptions: ReportStatus[] = ["Todos", "Completado", "Pendiente", "Alerta"];

const emptyInventoryData: typeof inventoryData = [];
const emptyDocumentData: typeof documentData = [];

function statusColor(status: ReportRow["status"]) {
  if (status === "Completado") return "green";
  if (status === "Alerta") return "red";
  return "yellow";
}

function complianceLabel(value: number) {
  if (value >= 90) return "Sobre la meta";
  if (value > 0) return "Requiere seguimiento";
  return "Sin inspecciones";
}

export default function ReportesPage() {
  const [area, setArea] = useState<ReportArea>("General");
  const [status, setStatus] = useState<ReportStatus>("Todos");
  const [period, setPeriod] = useState("2026-08");
  const [query, setQuery] = useState("");
  const [liveRows, setLiveRows] = useState<ReportRow[] | null>(null);
  const [liveInventory, setLiveInventory] = useState<typeof inventoryData | null>(null);
  const [liveDocuments, setLiveDocuments] = useState<typeof documentData | null>(null);
  const [liveStats, setLiveStats] = useState({
    totalRecords: 0,
    eppCompliance: 0,
    documentCount: 0,
    fleetActive: 0,
    fleetTotal: 0,
  });
  const [liveSafety, setLiveSafety] = useState<Array<{ day: string; inspecciones: number; hallazgos: number }>>([]);
  const [liveTimesheet, setLiveTimesheet] = useState<Array<{ name: string; hours: number }>>([]);
  const [liveRetentionTrend, setLiveRetentionTrend] = useState<Array<{ date: string; value: number }>>([]);
  const [liveFleet, setLiveFleet] = useState<Array<{ name: string; value: number }>>([]);
  const [liveEnvironment, setLiveEnvironment] = useState<Array<{ name: string; value: number }>>([]);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [chartPage, setChartPage] = useState(1);
  const reportsPerPage = 5;

  useEffect(() => {
    let active = true;
    fetchReportsData().then((data) => {
      if (!active || !data.authenticated) return;

      const rows: ReportRow[] = [
        ...data.inventory.map((item, index) => ({
          id: `INV-${String(index + 1).padStart(3, "0")}`,
          date: String(item.updated_at || item.created_at || new Date().toISOString()).slice(0, 10),
          area: "Inventario" as const,
          title: `Existencia: ${String(item.name || "Suministro")}`,
          owner: "Almacén central",
          status: Number(item.quantity || 0) <= 5 ? "Pendiente" as const : "Completado" as const,
          value: `${Number(item.quantity || 0)} und.`,
        })),
        ...data.procurement.map((item, index) => ({
          id: `PRO-${String(index + 1).padStart(3, "0")}`,
          date: String(item.updated_at || item.requested_at || new Date().toISOString()).slice(0, 10),
          area: "Inventario" as const,
          title: `Solicitud: ${String(item.usage || item.description || "Materiales")}`,
          owner: String(item.requester_name || "Solicitante"),
          status: /reject|alert|recha/i.test(String(item.status)) ? "Alerta" as const : /pending|pendiente/i.test(String(item.status)) ? "Pendiente" as const : "Completado" as const,
          value: `${Number(item.total_cost || 0).toFixed(2)}`,
        })),
        ...data.timesheets.map((item, index) => ({
          id: `TMS-${String(index + 1).padStart(3, "0")}`,
          date: String(item.period_end || item.period_start || new Date().toISOString()).slice(0, 10),
          area: "Seguridad" as const,
          title: `Hoja de tiempo: ${String(item.user_name || "Usuario")}`,
          owner: String(item.user_department || "Operaciones"),
          status: item.status ? "Completado" as const : "Pendiente" as const,
          value: `${Number(item.total_hours || 0).toFixed(1)} h`,
        })),
        ...data.security.map((item, index) => ({
          id: `EPP-${String(index + 1).padStart(3, "0")}`,
          date: String(item.created_at || new Date().toISOString()).slice(0, 10),
          area: "Seguridad" as const,
          title: `Inspección EPP: ${String(item.operator_name || "Operador")}`,
          owner: String(item.turno || "Turno operativo"),
          status: Number(item.score || 0) < 70 ? "Alerta" as const : "Completado" as const,
          value: `${Number(item.score || 0).toFixed(0)}%`,
        })),
        ...data.companies.map((item, index) => ({
          id: `EMP-${String(index + 1).padStart(3, "0")}`,
          date: String(item.updated_at || item.created_at || new Date().toISOString()).slice(0, 10),
          area: "ART / VIT" as const,
          title: `Empresa: ${String(item.name || "Sin nombre")}`,
          owner: String(item.contact_name || item.rif || "Sin contacto"),
          status: /inactiv|suspend/i.test(String(item.status)) ? "Pendiente" as const : "Completado" as const,
          value: String(item.status || "activo"),
        })),
        ...data.invoices.map((item, index) => ({
          id: `RET-${String(index + 1).padStart(3, "0")}`,
          date: String(item.created_at || new Date().toISOString()).slice(0, 10),
          area: "ART / VIT" as const,
          title: `Retención: ${String(item.supplier_name || item.rif || "Factura")}`,
          owner: String(item.rif || "Sin RIF"),
          status: item.collected ? "Completado" as const : "Pendiente" as const,
          value: `Bs. ${Number(item.retention_amount || 0).toFixed(2)}`,
        })),
        ...data.fleet.map((item, index) => ({
          id: `FLT-${String(index + 1).padStart(3, "0")}`,
          date: String(item.updated_at || item.created_at || new Date().toISOString()).slice(0, 10),
          area: "Flota" as const,
          title: `Vehículo: ${String(item.plate || item.code || item.model || "Unidad")}`,
          owner: String(item.driver || item.brand || "Operaciones"),
          status: /manten|inactiv|repar/i.test(String(item.status)) ? "Alerta" as const : "Completado" as const,
          value: String(item.status || "Operativo"),
        })),
        ...data.peajes.map((item, index) => ({
          id: `PEA-${String(index + 1).padStart(3, "0")}`,
          date: String(item.date || item.created_at || new Date().toISOString()).slice(0, 10),
          area: "Flota" as const,
          title: `Peaje: ${String(item.route || "Ruta registrada")}`,
          owner: String(item.driver || item.plate || "Operaciones"),
          status: "Completado" as const,
          value: `Bs. ${Number(item.amount || 0).toFixed(2)}`,
        })),
        ...[
          ...data.environment.talks.map((item) => ({ type: "Charla", item })),
          ...data.environment.drills.map((item) => ({ type: "Simulacro", item })),
          ...data.environment.documents.map((item) => ({ type: "Documento", item })),
        ].map(({ type, item }, index) => ({
          id: `AMB-${String(index + 1).padStart(3, "0")}`,
          date: String(item.created_at || new Date().toISOString()).slice(0, 10),
          area: "Seguridad" as const,
          title: `${type}: ${String(item.title || "Registro ambiental")}`,
          owner: String(item.owner || item.zone || "Ambiente"),
          status: /pend|program/i.test(String(item.status)) ? "Pendiente" as const : "Completado" as const,
          value: type,
        })),
      ];

      if (data.inventory.length > 0) {
        const grouped = new Map<string, number>();
        data.inventory.forEach((item) => {
          const category = typeof item.category === "object" && item.category ? String((item.category as JsonRecord).name || "Sin categoría") : "Sin categoría";
          grouped.set(category, (grouped.get(category) || 0) + Number(item.quantity || 0));
        });
        setLiveInventory(Array.from(grouped, ([name, total]) => ({ name, total, low: total <= 5 ? total : 0 })));
      } else setLiveInventory([]);
      setLiveDocuments([
        { name: "EPP", value: data.security.length, color: "#4ade80" },
        { name: "Facturas", value: data.invoices.length, color: "#22d3ee" },
        { name: "Empresas", value: data.companies.length, color: "#eab308" },
      ]);
      const safetyByDate = new Map<string, { inspecciones: number; hallazgos: number }>();
      data.security.forEach((item) => {
        const date = String(item.created_at || new Date().toISOString()).slice(0, 10);
        const current = safetyByDate.get(date) || { inspecciones: 0, hallazgos: 0 };
        current.inspecciones += 1;
        if (Number(item.score || 0) < 70) current.hallazgos += 1;
        safetyByDate.set(date, current);
      });
      setLiveSafety(Array.from(safetyByDate.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, values]) => ({
        day: new Date(`${date}T12:00:00`).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" }),
        ...values,
      })));
      const scored = data.security.map((item) => Number(item.score || 0)).filter((score) => score > 0);
      const activeFleet = data.fleet.filter((item) => !/manten|inactiv|repar/i.test(String(item.status))).length;
      setLiveStats({
        totalRecords: rows.length,
        eppCompliance: scored.length ? Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length) : 0,
        documentCount: data.invoices.length,
        fleetActive: activeFleet,
        fleetTotal: data.fleet.length,
      });
      const fleetStatus = data.fleet.reduce<Record<string, number>>((summary, item) => {
        const status = /manten/i.test(String(item.status)) ? "Mantenimiento" : /repar/i.test(String(item.status)) ? "Reparación" : "Operativos";
        summary[status] = (summary[status] || 0) + 1;
        return summary;
      }, {});
      setLiveFleet(Object.entries(fleetStatus).map(([name, value]) => ({ name, value })));
      setLiveEnvironment([
        { name: "Charlas", value: data.environment.talks.length },
        { name: "Simulacros", value: data.environment.drills.length },
        { name: "Documentos", value: data.environment.documents.length },
      ]);
      const timesheetByUser = new Map<string, number>();
      data.timesheets.forEach((item) => {
        const username = String(item.user_name || item.username || "Usuario");
        timesheetByUser.set(username, (timesheetByUser.get(username) || 0) + Number(item.total_hours || 0));
      });
      setLiveTimesheet(Array.from(timesheetByUser, ([name, hours]) => ({ name, hours })).sort((first, second) => second.hours - first.hours).slice(0, 10));
      const retentionTrend = data.adminOverview?.retentions_trend;
      setLiveRetentionTrend(Array.isArray(retentionTrend) ? retentionTrend.map((item) => ({
        date: String(item.date || ""),
        value: Number(item.value || 0),
      })) : []);
      setLiveRows(rows);
    });
    return () => { active = false; };
  }, []);

  const reportInventoryData = liveInventory || emptyInventoryData;
  const reportDocumentData = liveDocuments || emptyDocumentData;
  const reportSourceRows = liveRows || [];
  const reportSafetyData = liveSafety;

  const printChart = (chartId: string) => {
    document.body.classList.add("printing-report-chart", `print-chart-${chartId}`);
    document.body.dataset.printChart = chartId;
    const clearPrintTarget = () => {
      delete document.body.dataset.printChart;
      document.body.classList.remove("printing-report-chart", `print-chart-${chartId}`);
      window.removeEventListener("afterprint", clearPrintTarget);
    };
    window.addEventListener("afterprint", clearPrintTarget);
    window.print();
  };

  const filteredRows = useMemo(() => reportSourceRows
    .filter((row) => {
      const matchesArea = area === "General" || row.area === area;
      const matchesStatus = status === "Todos" || row.status === status;
      const matchesPeriod = row.date.startsWith(period);
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery = !normalizedQuery || [row.id, row.title, row.owner, row.area].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesArea && matchesStatus && matchesPeriod && matchesQuery;
    })
    .sort((first, second) => second.date.localeCompare(first.date)), [area, period, query, reportSourceRows, status]);

  const totalReportPages = Math.max(1, Math.ceil(filteredRows.length / reportsPerPage));
  const paginatedRows = filteredRows.slice((reportPage - 1) * reportsPerPage, reportPage * reportsPerPage);

  useEffect(() => {
    setReportPage(1);
  }, [area, period, query, status]);

  const exportCsv = () => {
    const header = "ID,Fecha,Área,Reporte,Responsable,Estado,Resultado";
    const rows = filteredRows.map((row) => [row.id, row.date, row.area, row.title, row.owner, row.status, row.value].map((value) => `"${value.replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-soland-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setArea("General");
    setStatus("Todos");
    setPeriod("2026-08");
    setQuery("");
  };

  return (
    <Box p={{ base: 4, md: 8 }} bg="#08080a" minH="100vh" color="white">
      <style>{`@media print { body.printing-report-chart [data-printable-chart] { display: none !important; } body.print-chart-inventory [data-printable-chart="inventory"], body.print-chart-security [data-printable-chart="security"], body.print-chart-documents [data-printable-chart="documents"], body.print-chart-timesheet [data-printable-chart="timesheet"], body.print-chart-retentions [data-printable-chart="retentions"], body.print-chart-fleet [data-printable-chart="fleet"], body.print-chart-environment [data-printable-chart="environment"] { display: block !important; } body.printing-report-chart { background: white !important; } }`}</style>
      <Box maxW="7xl" mx="auto">
        <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={7}>
          <Box>
            <HStack gap={3} mb={2}>
              <Box p={2} bg="yellow.400" color="black" borderRadius="lg"><FileText size={21} /></Box>
              <Heading size="lg" color="yellow.300">Centro de reportes</Heading>
            </HStack>
            <Text color="gray.400">Consolida inventario, seguridad, flota y documentos operativos en una sola vista.</Text>
          </Box>
          <HStack gap={2} wrap="wrap">
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={15} /> Imprimir</Button>
            <Button size="sm" colorScheme="yellow" color="black" onClick={exportCsv}><Download size={15} /> Exportar CSV</Button>
          </HStack>
        </Flex>

        <Box bg="#151518" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={4} mb={6}>
          <Flex gap={3} align={{ base: "stretch", lg: "center" }} direction={{ base: "column", lg: "row" }}>
            <HStack gap={2} flex="1" bg="#0d0d0f" px={3} borderRadius="md">
              <Search size={16} color="#9ca3af" />
              <Input border="none" px={1} placeholder="Buscar reporte, responsable o código..." value={query} onChange={(event) => setQuery(event.target.value)} _focus={{ boxShadow: "none" }} />
            </HStack>
            <HStack gap={2} wrap="wrap">
              <Text color="gray.500" fontSize="sm"><CalendarDays size={15} /></Text>
              <Input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} bg="#0d0d0f" maxW="150px" />
              {areaOptions.map((option) => <Button key={option} size="sm" variant={area === option ? "solid" : "outline"} colorScheme={area === option ? "yellow" : "gray"} color={area === option ? "black" : "white"} onClick={() => setArea(option)}>{option}</Button>)}
              <Button size="sm" variant="ghost" onClick={resetFilters} title="Restablecer filtros"><RefreshCw size={16} /></Button>
            </HStack>
          </Flex>
        </Box>

        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4} mb={6}>
          {[
            { label: "Registros consolidados", value: liveStats.totalRecords, detail: "Todos los módulos conectados", color: "cyan.300", icon: BarChart3 },
            { label: "Cumplimiento EPP", value: `${liveStats.eppCompliance}%`, detail: `${complianceLabel(liveStats.eppCompliance)} según inspecciones reales`, color: "green.300", icon: ShieldCheck },
            { label: "Facturas procesadas", value: liveStats.documentCount, detail: "Retenciones registradas", color: "yellow.300", icon: FileCheck2 },
            { label: "Flota operativa", value: `${liveStats.fleetActive} / ${liveStats.fleetTotal}`, detail: "Vehículos activos registrados", color: "orange.300", icon: Truck },
          ].map((metric) => {
            const Icon = metric.icon;
            return <Box key={metric.label} bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5}><Flex justify="space-between"><Box><Text color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="bold">{metric.label}</Text><Text color={metric.color} fontSize="3xl" fontWeight="extrabold" mt={2}>{metric.value}</Text><Text color="gray.400" fontSize="sm" mt={1}>{metric.detail}</Text></Box><Icon size={22} color="currentColor" /></Flex></Box>;
          })}
        </SimpleGrid>

        <Flex justify="space-between" align="center" mb={4} bg="#151518" border="1px solid" borderColor="whiteAlpha.100" borderRadius="lg" p={3}>
          <Text color="gray.300" fontSize="sm">Gráficas del informe: página {chartPage} de 2</Text>
          <HStack gap={2}>
            <Button size="sm" variant="outline" disabled={chartPage === 1} onClick={() => setChartPage(1)}>Página 1</Button>
            <Button size="sm" variant="outline" disabled={chartPage === 2} onClick={() => setChartPage(2)}>Página 2</Button>
          </HStack>
        </Flex>

        <Grid display={chartPage === 1 ? "grid" : "none"} templateColumns={{ base: "1fr", xl: "1.25fr 1fr" }} gap={5} mb={6} alignItems="start">
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5} data-printable-chart="inventory">
            <Flex justify="space-between" align="center" mb={4}><Box><Text fontWeight="bold">Inventario y reposición</Text><Text color="gray.500" fontSize="sm">Existencias actuales frente a alertas de stock bajo</Text></Box><HStack gap={2}><Badge colorScheme="cyan">{area === "General" || area === "Inventario" ? "Vista activa" : "Referencia"}</Badge><Button size="xs" variant="outline" onClick={() => printChart("inventory")}><Printer size={13} /> Imprimir</Button></HStack></Flex>
            <ResponsiveContainer width="100%" height={260}><BarChart data={reportInventoryData} margin={{ top: 10, right: 8, left: -20, bottom: 5 }}><CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} /><YAxis stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} /><Bar dataKey="total" name="Disponibles" fill="#22d3ee" radius={[5, 5, 0, 0]} /><Bar dataKey="low" name="Stock bajo" fill="#f97316" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
          </Box>
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5} data-printable-chart="security">
            <Flex justify="space-between" align="center" mb={4}><Box><Text fontWeight="bold">Actividad de seguridad</Text><Text color="gray.500" fontSize="sm">Inspecciones y alertas registradas</Text></Box><HStack gap={2}><Badge colorScheme="green">{liveSafety.reduce((sum, item) => sum + item.inspecciones, 0)} inspecciones</Badge><Button size="xs" variant="outline" onClick={() => printChart("security")}><Printer size={13} /> Imprimir</Button></HStack></Flex>
            {reportSafetyData.length > 0 ? <ResponsiveContainer width="100%" height={260}><AreaChart data={reportSafetyData}><defs><linearGradient id="reportSafety" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ade80" stopOpacity={0.35} /><stop offset="95%" stopColor="#4ade80" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} /><YAxis stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} /><Area type="monotone" dataKey="inspecciones" name="Inspecciones" stroke="#4ade80" fill="url(#reportSafety)" strokeWidth={2} /><Area type="monotone" dataKey="hallazgos" name="Alertas" stroke="#f97316" fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <Text color="gray.400">No hay inspecciones registradas.</Text>}
          </Box>
        </Grid>

        <Grid display={chartPage === 1 ? "grid" : "none"} templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={5} mb={6}>
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5} data-printable-chart="timesheet">
            <Flex justify="space-between" align="center" mb={4}><Box><Text fontWeight="bold">Horas por usuario</Text><Text color="gray.500" fontSize="sm">Hojas de tiempo registradas</Text></Box><Button size="xs" variant="outline" onClick={() => printChart("timesheet")}><Printer size={13} /> Imprimir</Button></Flex>
            {liveTimesheet.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={liveTimesheet}><CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} /><YAxis stroke="#9ca3af" /><Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} /><Bar dataKey="hours" name="Horas" fill="#a78bfa" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <Text color="gray.400">No hay hojas de tiempo registradas.</Text>}
          </Box>
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5} data-printable-chart="retentions">
            <Flex justify="space-between" align="center" mb={4}><Box><Text fontWeight="bold">Tendencia de retenciones</Text><Text color="gray.500" fontSize="sm">Montos retenidos por fecha</Text></Box><Button size="xs" variant="outline" onClick={() => printChart("retentions")}><Printer size={13} /> Imprimir</Button></Flex>
            {liveRetentionTrend.length > 0 ? <ResponsiveContainer width="100%" height={260}><LineChart data={liveRetentionTrend}><CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} /><YAxis stroke="#9ca3af" /><Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} /><Line type="monotone" dataKey="value" name="Retención" stroke="#f6c84a" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer> : <Text color="gray.400">No hay retenciones registradas.</Text>}
          </Box>
        </Grid>

        <Grid display={chartPage === 2 ? "grid" : "none"} templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={5} mb={6}>
        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5} data-printable-chart="fleet">
          <Flex justify="space-between" align="center" mb={4}><Box><Text fontWeight="bold">Estado de flota</Text><Text color="gray.500" fontSize="sm">Distribución de vehículos registrados</Text></Box><Button size="xs" variant="outline" onClick={() => printChart("fleet")}><Printer size={13} /> Imprimir</Button></Flex>
          {liveFleet.length > 0 ? <ResponsiveContainer width="100%" height={220}><BarChart data={liveFleet} layout="vertical" margin={{ left: 20, right: 20 }}><CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" stroke="#9ca3af" allowDecimals={false} /><YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} /><Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} /><Bar dataKey="value" name="Vehículos" fill="#fb923c" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer> : <Text color="gray.400">No hay vehículos registrados.</Text>}
        </Box>
        <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5} data-printable-chart="environment">
          <Flex justify="space-between" align="center" mb={4}><Box><Text fontWeight="bold">Gestión ambiental</Text><Text color="gray.500" fontSize="sm">Charlas, simulacros y documentos</Text></Box><Button size="xs" variant="outline" onClick={() => printChart("environment")}><Printer size={13} /> Imprimir</Button></Flex>
          {liveEnvironment.length > 0 ? <ResponsiveContainer width="100%" height={220}><BarChart data={liveEnvironment}><CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#cbd5e0", fontSize: 11 }} /><YAxis stroke="#9ca3af" allowDecimals={false} /><Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} /><Bar dataKey="value" name="Registros" fill="#84cc16" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <Text color="gray.400">No hay registros ambientales.</Text>}
        </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={5} mb={6} alignItems="start">
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5} data-printable-chart="documents">
            <Flex justify="space-between" align="center"><Box><Text fontWeight="bold">Control documental</Text><Text color="gray.500" fontSize="sm" mb={2}>Distribución de documentos revisados</Text></Box><Button size="xs" variant="outline" onClick={() => printChart("documents")}><Printer size={13} /> Imprimir</Button></Flex>
            <Box h="205px"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportDocumentData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={4}>{reportDocumentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#4a5568" }} /></PieChart></ResponsiveContainer></Box>
            <VStack align="stretch" gap={2}>{reportDocumentData.map((entry) => <Flex key={entry.name} justify="space-between" align="center"><HStack gap={2}><Box boxSize="9px" borderRadius="full" bg={entry.color} /><Text color="gray.300" fontSize="sm">{entry.name}</Text></HStack><Text color="white" fontWeight="bold">{entry.value}</Text></Flex>)}</VStack>
          </Box>
          <Box bg="#18181b" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" p={5}>
            <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
              <Button variant="ghost" color="white" px={0} onClick={() => setReportsExpanded((current) => !current)}>
                <HStack gap={2}>
                  <Box textAlign="left"><Text fontWeight="bold">Registro de reportes</Text><Text color="gray.500" fontSize="sm">Resultados filtrados: {filteredRows.length}</Text></Box>
                  {reportsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </HStack>
              </Button>
              <HStack gap={2}>{statusOptions.map((option) => <Button key={option} size="xs" variant={status === option ? "solid" : "outline"} colorScheme={status === option ? "yellow" : "gray"} color={status === option ? "black" : "white"} onClick={() => setStatus(option)}>{option}</Button>)}</HStack>
            </Flex>
            {reportsExpanded && <Box mt={4}><Box overflowX="auto"><Box as="table" w="100%" minW="680px" borderCollapse="collapse"><Box as="thead"><Box as="tr" color="gray.500" fontSize="xs" textTransform="uppercase"><Box as="th" textAlign="left" p={3}>Reporte</Box><Box as="th" textAlign="left" p={3}>Área</Box><Box as="th" textAlign="left" p={3}>Responsable</Box><Box as="th" textAlign="left" p={3}>Estado</Box><Box as="th" textAlign="right" p={3}>Resultado</Box></Box></Box><Box as="tbody">{paginatedRows.map((row) => <Box as="tr" key={row.id} borderTop="1px solid" borderColor="whiteAlpha.100"><Box as="td" p={3}><Text color="white" fontSize="sm" fontWeight="semibold">{row.title}</Text><Text color="gray.500" fontSize="xs">{row.id} · {row.date}</Text></Box><Box as="td" p={3}><Badge colorScheme="cyan" variant="subtle">{row.area}</Badge></Box><Box as="td" p={3} color="gray.300" fontSize="sm">{row.owner}</Box><Box as="td" p={3}><Badge colorScheme={statusColor(row.status)}>{row.status}</Badge></Box><Box as="td" p={3} textAlign="right" color="gray.200" fontWeight="semibold">{row.value}</Box></Box>)}{filteredRows.length === 0 && <Box as="tr"><Box as="td" p={8} textAlign="center" color="gray.500">No hay reportes para los filtros seleccionados.</Box></Box>}</Box></Box></Box><Flex justify="space-between" align="center" mt={3} gap={3}><Text color="gray.500" fontSize="sm">Mostrando {filteredRows.length === 0 ? 0 : (reportPage - 1) * reportsPerPage + 1}-{Math.min(reportPage * reportsPerPage, filteredRows.length)} de {filteredRows.length}</Text><HStack gap={2}><Button size="sm" variant="outline" disabled={reportPage <= 1} onClick={() => setReportPage((current) => Math.max(1, current - 1))}>Anterior</Button><Text color="gray.400" fontSize="sm">Página {reportPage} de {totalReportPages}</Text><Button size="sm" variant="outline" disabled={reportPage >= totalReportPages} onClick={() => setReportPage((current) => Math.min(totalReportPages, current + 1))}>Siguiente</Button></HStack></Flex></Box>}
          </Box>
        </Grid>

        <Box bg="#101014" border="1px solid" borderColor="yellow.700" borderRadius="xl" p={4}>
          <Flex align="start" gap={3}><Box color="yellow.300" mt={1}><FileCheck2 size={18} /></Box><Box><Text color="yellow.200" fontWeight="bold">Lectura operativa</Text><Text color="gray.400" fontSize="sm" mt={1}>El resumen reúne los registros disponibles de los módulos conectados. Los filtros, la impresión y la exportación CSV funcionan sobre el conjunto visible.</Text></Box></Flex>
        </Box>
      </Box>
    </Box>
  );
}
