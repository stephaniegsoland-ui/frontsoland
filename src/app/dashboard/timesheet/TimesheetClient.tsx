"use client";

import React from "react";
import { useActionState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Grid,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { createTimesheetAction } from "@/actions/timesheet";

interface TrendPoint {
  label: string;
  value: number;
}

interface TimesheetClientProps {
  timesheets?: any[];
  error?: string;
  trend?: TrendPoint[];
}

export function TimesheetClient({ timesheets, error, trend }: TimesheetClientProps) {
  const [state, formAction, isPending] = useActionState(createTimesheetAction, null as any);
  const [entries, setEntries] = React.useState([{ date: "", start: "08:00", end: "17:00", activity: "", viaticos: 0 }]);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const chartData = trend ?? [];
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const points = chartData.map((item, index) => {
    const x = 24 + (index * (492 / Math.max(chartData.length - 1, 1)));
    const y = 156 - (item.value / maxValue) * 116;
    return { ...item, x, y };
  });
  const chartPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  function addRow() {
    setEntries((s) => [...s, { date: "", start: "08:00", end: "17:00", activity: "" }]);
  }

  function removeRow(i: number) {
    setEntries((s) => s.filter((_, idx) => idx !== i));
  }

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Box bg="#18181b" p={6} borderRadius="xl" border="1px solid" borderColor="yellow.600" maxW="5xl" mx="auto">
        <Flex align="center" gap={3} mb={4}>
          <Text fontSize="xl" fontWeight="bold" color="yellow.400">Hoja de Tiempo</Text>
        </Flex>

        <form
          action={formAction}
          onSubmit={(e) => {
            setLocalError(null);
            const form = e.currentTarget as HTMLFormElement;
            const start = (form.elements.namedItem("period_start") as HTMLInputElement)?.value;
            const end = (form.elements.namedItem("period_end") as HTMLInputElement)?.value;
            if (!start || !end) {
              e.preventDefault();
              setLocalError("Complete las fechas de periodo antes de enviar.");
              return;
            }
          }}
        >
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mb={4}>
            <Input name="period_start" type="date" bg="black" defaultValue={today} required />
            <Input name="period_end" type="date" bg="black" defaultValue={today} required />
          </Grid>

          <Text mb={2}>Entradas</Text>
          <VStack align="start" gap={2} mb={4}>
            {entries.map((e, idx) => (
              <HStack key={idx} w="full">
                <Input name="entry_date[]" type="date" defaultValue={e.date || today} bg="black" required />
                <Input name="entry_start[]" placeholder="Inicio (HH:MM)" defaultValue={e.start} bg="black" required />
                <Input name="entry_end[]" placeholder="Fin (HH:MM)" defaultValue={e.end} bg="black" required />
                <Input name="entry_activity[]" placeholder="Actividad" defaultValue={e.activity} bg="black" required />
                <Input name="entry_viaticos[]" placeholder="Viáticos" type="number" step="0.01" defaultValue={e.viaticos ?? 0} bg="black" />
                <Button size="sm" colorScheme="red" onClick={() => removeRow(idx)}>Eliminar</Button>
              </HStack>
            ))}
            <Button size="sm" onClick={addRow} leftIcon={<Plus size={14} />}>Agregar fila</Button>
          </VStack>

          {localError && <Text color="red.400" mb={3}>{localError}</Text>}
          {error && <Text color="red.400" mb={3}>{error}</Text>}
          {state?.error && <Text color="red.400" mb={3}>{state.error}</Text>}
          {state?.success && <Text color="green.400" mb={3}>Hoja creada.</Text>}

          <Button type="submit" w="full" bg="whiteAlpha.400" color="white" _hover={{ bg: "yellow.400", color: "black" }} py={4} loading={isPending}>
            Crear Hoja
          </Button>
        </form>

        <Box mt={6}>
          <Text fontSize="lg" fontWeight="bold" mb={3}>Hojas recientes</Text>
          {timesheets?.length === 0 && <Text color="gray.400">No hay hojas registradas.</Text>}
          {timesheets?.map((t) => (
            <Box key={t.id} bg="#0b0b0c" p={3} borderRadius="md" mb={2} border="1px solid" borderColor="whiteAlpha.50">
              <Flex justify="space-between" mb={2}>
                <Text fontWeight="bold">{t.user_name || t.id}</Text>
                <Text color="gray.400">Horas: {t.total_hours ?? 0}</Text>
              </Flex>
              <Text color="gray.400" fontSize="sm">Periodo: {new Date(t.period_start).toLocaleDateString()} — {new Date(t.period_end).toLocaleDateString()}</Text>
            </Box>
          ))}
        </Box>

        <Box mt={8} p={4} bg="#0b0b0c" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="lg" fontWeight="bold" mb={3}>Tendencia últimos 6 meses</Text>
          {chartData.length > 0 ? (
            <>
              <Box overflow="hidden" borderRadius="md" bg="#020202" mb={4}>
                <svg viewBox="0 0 540 180" width="100%" height="180" role="img" aria-label="Tendencia de horas últimos 6 meses">
                  <path d={chartPath} fill="none" stroke="#ECC94B" strokeWidth="3" strokeLinecap="round" />
                  {points.map((point) => (
                    <circle key={`dot-${point.label}`} cx={point.x} cy={point.y} r="4" fill="#F6E05E" />
                  ))}
                  {points.map((point) => (
                    <text key={`label-${point.label}`} x={point.x} y={172} fontSize="10" fill="#A0AEC0" textAnchor="middle">
                      {point.label}
                    </text>
                  ))}
                </svg>
              </Box>
              <Grid templateColumns="repeat(6, minmax(0, 1fr))" gap={2}>
                {chartData.map((item) => (
                  <Box key={`metric-${item.label}`} p={2} bg="#131313" borderRadius="md" textAlign="center">
                    <Text fontSize="xs" color="gray.400">{item.label}</Text>
                    <Text fontWeight="bold" color="white">{item.value}</Text>
                  </Box>
                ))}
              </Grid>
            </>
          ) : (
            <Text color="gray.400">No hay datos de tendencia.</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
