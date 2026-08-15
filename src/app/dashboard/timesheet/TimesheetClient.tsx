"use client";

import React, { useEffect, useMemo, useState } from "react";
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

interface Entry {
  date: string;
  start: string;
  end: string;
  activity: string;
  viaticos: number;
  viatico_type: string;
}

interface TimesheetClientProps {
  timesheets?: any[];
  error?: string;
  trend?: TrendPoint[];
  monthlySummary?: { year: number; month: number; total_hours: number } | null;
  currentYear?: number;
  currentMonth?: number;
}

const initialEntry = (date: string): Entry => ({
  date,
  start: "08:00",
  end: "17:00",
  activity: "",
  viaticos: 0,
  viatico_type: "",
});

export function TimesheetClient({
  timesheets,
  error,
  trend,
  monthlySummary,
  currentYear,
  currentMonth,
}: TimesheetClientProps) {
  const [state, formAction, isPending] = useActionState(createTimesheetAction, null as any);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [entries, setEntries] = useState<Entry[]>([{ ...initialEntry(today) }]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [serializedEntries, setSerializedEntries] = useState<string>(JSON.stringify([{ ...initialEntry(today) }]));

  useEffect(() => {
    setSerializedEntries(JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (state?.success) {
      setEntries([{ ...initialEntry(today) }]);
    }
  }, [state?.success, today]);

  const chartData = trend ?? [];
  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const points = chartData.map((item, index) => {
    const x = 24 + (index * (492 / Math.max(chartData.length - 1, 1)));
    const y = 156 - (item.value / maxValue) * 116;
    return { ...item, x, y };
  });
  const chartPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  const updateEntry = (index: number, field: keyof Entry, value: string | number) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === "viaticos" ? Number(value) : value,
      } as Entry;
      return next;
    });
  };

  const addRow = () => {
    setEntries((prev) => [...prev, { ...initialEntry(today) }]);
  };

  const removeRow = (index: number) => {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setLocalError(null);
    const form = event.currentTarget;
    const start = (form.elements.namedItem("period_start") as HTMLInputElement)?.value;
    const end = (form.elements.namedItem("period_end") as HTMLInputElement)?.value;

    if (!start || !end) {
      event.preventDefault();
      setLocalError("Complete las fechas del periodo antes de enviar.");
      return;
    }

    const invalidRow = entries.find((entry) => !entry.date || !entry.start || !entry.end || !entry.activity);
    if (invalidRow) {
      event.preventDefault();
      setLocalError("Cada fila necesita fecha, hora de inicio, hora de fin y descripción de actividad.");
      return;
    }
  };

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Box bg="#18181b" p={6} borderRadius="xl" border="1px solid" borderColor="yellow.600" maxW="5xl" mx="auto">
        <Flex align="center" gap={3} mb={4}>
          <Text fontSize="xl" fontWeight="bold" color="yellow.400">
            Hoja de Tiempo
          </Text>
        </Flex>

        <form action={formAction} onSubmit={handleSubmit}>
          <input type="hidden" name="entries" value={serializedEntries} />

          <Text mb={4} color="gray.300">
            Completa tus actividades, horas y viáticos. Al enviar, se registrará en administración.
          </Text>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mb={4}>
            <Input name="period_start" type="date" bg="black" defaultValue={today} required />
            <Input name="period_end" type="date" bg="black" defaultValue={today} required />
          </Grid>

          {monthlySummary ? (
            <Box mb={4} p={4} bg="#0f0f10" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Text fontWeight="bold" mb={2}>
                Resumen del mes actual
              </Text>
              <Text color="gray.300" fontSize="sm">
                {currentMonth}/{currentYear} · Total horas cargadas: <Text as="span" color="yellow.300" fontWeight="bold">{monthlySummary.total_hours.toFixed(1)}</Text>
              </Text>
            </Box>
          ) : (
            <Box mb={4} p={4} bg="#0f0f10" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Text color="gray.400">No se pudo obtener el resumen del mes actual.</Text>
            </Box>
          )}

          <Text mb={2}>Entradas</Text>
          <VStack align="start" gap={2} mb={4}>
            {entries.map((entry, index) => (
              <HStack key={index} w="full" wrap="wrap" gap={2}>
                <Input
                  name={`entry_date_${index}`}
                  type="date"
                  bg="black"
                  value={entry.date || today}
                  onChange={(event) => updateEntry(index, "date", event.target.value)}
                  required
                  flex="1 1 160px"
                />
                <Input
                  name={`entry_start_${index}`}
                  placeholder="Inicio (HH:MM)"
                  bg="black"
                  value={entry.start}
                  onChange={(event) => updateEntry(index, "start", event.target.value)}
                  required
                  flex="1 1 120px"
                />
                <Input
                  name={`entry_end_${index}`}
                  placeholder="Fin (HH:MM)"
                  bg="black"
                  value={entry.end}
                  onChange={(event) => updateEntry(index, "end", event.target.value)}
                  required
                  flex="1 1 120px"
                />
                <Input
                  name={`entry_activity_${index}`}
                  placeholder="Actividad"
                  bg="black"
                  value={entry.activity}
                  onChange={(event) => updateEntry(index, "activity", event.target.value)}
                  required
                  flex="2 1 240px"
                />
                <Input
                  name={`entry_viaticos_${index}`}
                  placeholder="Viáticos locales"
                  type="number"
                  step="0.01"
                  bg="black"
                  value={entry.viaticos}
                  onChange={(event) => updateEntry(index, "viaticos", event.target.value)}
                  flex="1 1 140px"
                />
                <Input
                  name={`entry_viatico_type_${index}`}
                  placeholder="Tipo de viático"
                  bg="black"
                  value={entry.viatico_type}
                  onChange={(event) => updateEntry(index, "viatico_type", event.target.value)}
                  flex="1 1 160px"
                />
                <Button type="button" size="sm" colorScheme="red" onClick={() => removeRow(index)}>
                  Eliminar
                </Button>
              </HStack>
            ))}
            <Button type="button" size="sm" onClick={addRow}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Plus size={14} />
                Agregar fila
              </span>
            </Button>
          </VStack>

          {localError && (
            <Text color="red.400" mb={3}>
              {localError}
            </Text>
          )}
          {error && (
            <Text color="red.400" mb={3}>
              {error}
            </Text>
          )}
          {state?.error && (
            <Text color="red.400" mb={3}>
              {state.error}
            </Text>
          )}
          {state?.success && (
            <Text color="green.400" mb={3}>
              Hoja enviada correctamente al módulo administrativo.
            </Text>
          )}

          <Button type="submit" w="full" bg="whiteAlpha.400" color="white" _hover={{ bg: "yellow.400", color: "black" }} py={4} loading={isPending}>
            Enviar Hoja de Tiempo
          </Button>
        </form>

        <Box mt={6}>
          <Text fontSize="lg" fontWeight="bold" mb={3}>
            Hojas recientes
          </Text>
          {timesheets?.length === 0 && <Text color="gray.400">No hay hojas registradas.</Text>}
          {timesheets?.map((t) => (
            <Box key={t.id} bg="#0b0b0c" p={3} borderRadius="md" mb={2} border="1px solid" borderColor="whiteAlpha.50">
              <Flex justify="space-between" mb={2}>
                <Text fontWeight="bold">{t.user_name || t.id}</Text>
                <Text color="gray.400">Horas: {t.total_hours ?? 0}</Text>
              </Flex>
              <Text color="gray.400" fontSize="sm">
                Periodo: {new Date(t.period_start).toLocaleDateString()} — {new Date(t.period_end).toLocaleDateString()}
              </Text>
            </Box>
          ))}
        </Box>

        <Box mt={8} p={4} bg="#0b0b0c" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="lg" fontWeight="bold" mb={3}>
            Tendencia últimos 6 meses
          </Text>
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
                    <Text fontSize="xs" color="gray.400">
                      {item.label}
                    </Text>
                    <Text fontWeight="bold" color="white">
                      {item.value}
                    </Text>
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
