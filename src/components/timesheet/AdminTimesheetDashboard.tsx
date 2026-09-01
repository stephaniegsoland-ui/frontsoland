"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Stack,
} from "@chakra-ui/react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Activity {
  description: string;
  start: string;
  end: string;
  viaticos: number;
  viatico_type?: string | null;
  hours: number;
}

interface AdminEntry {
  id: string;
  user_id: string;
  username: string;
  date: string;
  period_start?: string;
  period_end?: string;
  viaticos?: number;
  activities: Activity[];
  total_hours: number;
  notes?: string | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  department?: string | null;
  level?: number;
  is_active?: boolean;
  is_superuser?: boolean;
}

interface AdminTimesheetDashboardProps {
  initialEntries?: AdminEntry[];
  initialUsers?: AdminUser[];
  initialError?: string | null;
  initialUsersError?: string | null;
  initialPeriodYear?: number;
  initialPeriodMonth?: number;
}

interface UserStatusSummary {
  id: string;
  username: string;
  email?: string;
  department?: string | null;
  hasSubmitted: boolean;
  hours: number;
  lastSubmittedAt?: string | null;
}

interface UserSheetSummary {
  username: string;
  count: number;
  hours: number;
}

export default function AdminTimesheetDashboard({
  initialEntries = [],
  initialUsers = [],
  initialError = null,
  initialUsersError = null,
  initialPeriodYear,
  initialPeriodMonth,
}: AdminTimesheetDashboardProps) {
  const [entries] = useState<AdminEntry[]>(initialEntries);
  const [users] = useState<AdminUser[]>(initialUsers);
  const [error] = useState<string | null>(initialError);
  const [usersError] = useState<string | null>(initialUsersError);
  const [selectedYear, setSelectedYear] = useState(initialPeriodYear ?? new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialPeriodMonth ?? new Date().getMonth());

  const periodYear = selectedYear;
  const periodMonth = selectedMonth;

  const periodEntries = useMemo(() => {
    return entries.filter((entry) => {
      const sourceDate = entry.period_start || entry.created_at || entry.date;
      const parsed = new Date(sourceDate);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed.getFullYear() === periodYear && parsed.getMonth() === periodMonth;
    });
  }, [entries, periodMonth, periodYear]);

  const totalHours = useMemo(
    () => periodEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0),
    [periodEntries]
  );

  const totalViaticos = useMemo(
    () => periodEntries.reduce((sum, entry) => sum + (entry.viaticos || 0), 0),
    [periodEntries]
  );

  const averageHoursPerSheet = useMemo(
    () => (periodEntries.length ? totalHours / periodEntries.length : 0),
    [periodEntries.length, totalHours]
  );

  const activeUsersCount = useMemo(
    () => users.filter((user) => user.is_active !== false).length,
    [users]
  );

  const periodLabel = useMemo(() => {
    const monthName = new Date(periodYear, periodMonth, 1).toLocaleString("es-ES", { month: "long" });
    return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${periodYear}`;
  }, [periodMonth, periodYear]);

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        entries
          .map((entry) => {
            const date = new Date(entry.period_start || entry.created_at || entry.date);
            return Number.isNaN(date.getTime()) ? null : date.getFullYear();
          })
          .filter((year): year is number => year !== null)
      )
    ).sort((a, b) => b - a);
    return years.length ? years : [periodYear];
  }, [entries, periodYear]);

  const summaryByUser = useMemo(
    () =>
      Object.entries(
        periodEntries.reduce<Record<string, number>>((acc, entry) => {
          acc[entry.username] = (acc[entry.username] || 0) + entry.total_hours;
          return acc;
        }, {})
      )
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours),
    [periodEntries]
  );

  const sheetsByUser = useMemo<UserSheetSummary[]>(
    () =>
      Object.entries(
        periodEntries.reduce<Record<string, { count: number; hours: number }>>((acc, entry) => {
          const summary = acc[entry.username] ?? { count: 0, hours: 0 };
          summary.count += 1;
          summary.hours += entry.total_hours || 0;
          acc[entry.username] = summary;
          return acc;
        }, {})
      )
        .map(([username, value]) => ({ username, count: value.count, hours: value.hours }))
        .sort((a, b) => b.hours - a.hours || b.count - a.count),
    [periodEntries]
  );

  const trendByDate = useMemo(
    () =>
      Object.entries(
        periodEntries.reduce<Record<string, number>>((acc, entry) => {
          acc[entry.date] = (acc[entry.date] || 0) + entry.total_hours;
          return acc;
        }, {})
      )
        .map(([date, hours]) => ({ date, hours }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [periodEntries]
  );

  const userStatusSummary = useMemo<UserStatusSummary[]>(() => {
    const activeUsers = users.filter((user) => user.is_active !== false);

    return activeUsers
      .map((user) => {
        const matchingEntries = periodEntries.filter(
          (entry) => entry.user_id === user.id || entry.username === user.username
        );
        const latestEntry = [...matchingEntries].sort((a, b) => {
          const aDate = new Date(a.created_at || a.period_start || a.date).getTime();
          const bDate = new Date(b.created_at || b.period_start || b.date).getTime();
          return bDate - aDate;
        })[0];

        const hours = matchingEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          department: user.department,
          hasSubmitted: matchingEntries.length > 0,
          hours,
          lastSubmittedAt: latestEntry?.created_at || latestEntry?.period_start || latestEntry?.date || null,
        };
      })
      .sort((a, b) => Number(b.hasSubmitted) - Number(a.hasSubmitted) || a.username.localeCompare(b.username));
  }, [periodEntries, users]);

  const topContributors = useMemo(
    () => sheetsByUser.slice(0, 6),
    [sheetsByUser]
  );

  const lateUsers = useMemo(
    () => userStatusSummary.filter((user) => !user.hasSubmitted).slice(0, 6),
    [userStatusSummary]
  );

  const sentCount = userStatusSummary.filter((user) => user.hasSubmitted).length;
  const missingCount = userStatusSummary.length - sentCount;
  const completionRate = userStatusSummary.length > 0 ? Math.round((sentCount / userStatusSummary.length) * 100) : 0;

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Box bg="#18181b" p={6} borderRadius="2xl" border="1px solid" borderColor="yellow.600" maxW="7xl" mx="auto">
        <HStack justify="space-between" flexWrap="wrap" mb={4} gap={3}>
          <Box>
            <Heading size="lg" color="yellow.400" mb={2}>
              Hoja de Tiempo Administración
            </Heading>
            <Text color="gray.400">
              Resumen ejecutivo de las hojas de tiempo enviadas por los usuarios y estado de cumplimiento por colaborador.
            </Text>
          </Box>
          <Stack direction={{ base: "column", md: "row" }} gap={3} align="flex-end">
            <Box>
              <Text fontSize="sm" color="gray.400" mb={1}>Año</Text>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                style={{
                  background: "#0b0b0c",
                  border: "1px solid #29292f",
                  color: "white",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  width: "100%",
                }}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.400" mb={1}>Mes</Text>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                style={{
                  background: "#0b0b0c",
                  border: "1px solid #29292f",
                  color: "white",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  width: "100%",
                }}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index} value={index}>
                    {new Date(0, index).toLocaleString("es-ES", { month: "long" })}
                  </option>
                ))}
              </select>
            </Box>
          </Stack>
        </HStack>

        {(error || usersError) ? (
          <Box bg="#2a1518" p={4} borderRadius="lg" border="1px solid" borderColor="red.600" mb={6}>
            <Text color="red.200">{error || usersError}</Text>
          </Box>
        ) : null}

        <Box mb={6} p={4} bg="#0f0f10" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
          <Text color="gray.400" fontSize="sm" mb={2}>Período consultado</Text>
          <Text fontSize="2xl" fontWeight="bold" mb={1}>{periodLabel}</Text>
          <Text color="gray.400" fontSize="sm">Mostrando resumen de hojas de tiempo y cumplimiento administrativo.</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4} mb={6}>
          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="yellow.600" borderTopWidth="3px">
            <Text color="gray.400" fontSize="sm" mb={2}>Hojas recibidas</Text>
            <Text fontSize="3xl" fontWeight="bold">{periodEntries.length}</Text>
            <Text color="gray.400" fontSize="xs">Registros en el período seleccionado</Text>
          </Box>
          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="blue.600" borderTopWidth="3px">
            <Text color="gray.400" fontSize="sm" mb={2}>Horas totales</Text>
            <Text fontSize="3xl" fontWeight="bold">{totalHours.toFixed(1)}</Text>
            <Text color="gray.400" fontSize="xs">Horas acumuladas en el período</Text>
          </Box>
          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="orange.600" borderTopWidth="3px">
            <Text color="gray.400" fontSize="sm" mb={2}>Viáticos totales</Text>
            <Text fontSize="3xl" fontWeight="bold">{totalViaticos.toFixed(2)}</Text>
            <Text color="gray.400" fontSize="xs">Suma de viáticos registrados</Text>
          </Box>
          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="green.600" borderTopWidth="3px">
            <Text color="gray.400" fontSize="sm" mb={2}>Cumplimiento</Text>
            <Text fontSize="3xl" fontWeight="bold">{completionRate}%</Text>
            <Text color="gray.400" fontSize="xs">Usuarios con hoja de tiempo enviada</Text>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mb={6}>
          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
            <Text fontWeight="bold" mb={3}>Horas por usuario</Text>
            {summaryByUser.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={summaryByUser} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: "#CBD5E0", fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#718096" }} />
                  <Bar dataKey="hours" fill="#F6E05E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text color="gray.400">Aún no hay datos para mostrar.</Text>
            )}
          </Box>

          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
            <Text fontWeight="bold" mb={3}>Tendencia por fecha</Text>
            {trendByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendByDate} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#2d2d33" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#CBD5E0", fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#0f0f10", borderColor: "#718096" }} />
                  <Line type="monotone" dataKey="hours" stroke="#38B2AC" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Text color="gray.400">No hay registros recientes.</Text>
            )}
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={6}>
          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
            <Text fontWeight="bold" mb={3}>Top colaboradores</Text>
            {topContributors.length > 0 ? (
              <Box as="table" width="100%" borderCollapse="collapse">
                <Box as="thead">
                  <Box as="tr">
                    <Box as="th" textAlign="left" py={2} px={3} color="gray.400" fontSize="xs">Usuario</Box>
                    <Box as="th" textAlign="right" py={2} px={3} color="gray.400" fontSize="xs">Hojas</Box>
                    <Box as="th" textAlign="right" py={2} px={3} color="gray.400" fontSize="xs">Horas</Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  {topContributors.map((user) => (
                    <Box as="tr" key={user.username} borderTop="1px solid" borderColor="whiteAlpha.100">
                      <Box as="td" py={3} px={3}>{user.username}</Box>
                      <Box as="td" py={3} px={3} textAlign="right">{user.count}</Box>
                      <Box as="td" py={3} px={3} textAlign="right">{user.hours.toFixed(1)}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Text color="gray.400">No hay datos de contribución para este período.</Text>
            )}
          </Box>

          <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
            <Text fontWeight="bold" mb={3}>Usuarios pendientes</Text>
            {lateUsers.length > 0 ? (
              <VStack align="stretch" gap={3}>
                {lateUsers.map((user) => (
                  <Box key={user.id} p={3} bg="#0b0b0c" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
                    <HStack justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="bold">{user.username}</Text>
                        <Text color="gray.400" fontSize="sm">
                          {user.email || user.department || "Sin departamento"}
                        </Text>
                      </Box>
                      <Badge colorScheme="red">Falta hoja</Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text color="gray.400">Todos los usuarios activos ya han enviado su hoja de tiempo.</Text>
            )}
          </Box>
        </SimpleGrid>

        <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100" mb={6}>
          <Heading size="md" color="yellow.400" mb={3}>
            Estado de envío por usuario
          </Heading>
          {userStatusSummary.length === 0 ? (
            <Text color="gray.400">No hay usuarios registrados para evaluar.</Text>
          ) : (
            <VStack align="stretch" gap={3}>
              {userStatusSummary.map((user) => (
                <Box key={user.id} bg="#0b0b0c" p={3} borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
                  <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <Box>
                      <Text fontWeight="bold">{user.username}</Text>
                      <Text color="gray.400" fontSize="sm">
                        {user.email || user.department || "Sin departamento registrado"}
                      </Text>
                    </Box>
                    <Badge colorScheme={user.hasSubmitted ? "green" : "red"}>
                      {user.hasSubmitted ? "Enviado" : "Falta"}
                    </Badge>
                  </HStack>
                  <Text color="gray.400" fontSize="sm" mt={2}>
                    Horas del período: {user.hours.toFixed(1)} · Último envío: {user.lastSubmittedAt ? new Date(user.lastSubmittedAt).toLocaleDateString() : "Sin registro"}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <VStack align="stretch" gap={4}>
          <Heading size="md" color="yellow.400">Últimas hojas recibidas en el período</Heading>
          {periodEntries.length === 0 ? (
            <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
              <Text color="gray.400">No hay hojas de tiempo para el período seleccionado.</Text>
            </Box>
          ) : (
            periodEntries.slice(0, 8).map((entry) => (
              <Box key={entry.id} bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
                <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
                  <Text fontWeight="bold">{entry.username}</Text>
                  <Badge colorScheme="yellow">{entry.date}</Badge>
                  {entry.period_start && entry.period_end ? (
                    <Badge colorScheme="purple">
                      {new Date(entry.period_start).toLocaleDateString()} - {new Date(entry.period_end).toLocaleDateString()}
                    </Badge>
                  ) : null}
                  {entry.viaticos !== undefined ? (
                    <Badge colorScheme="green">Viáticos totales: {entry.viaticos.toFixed(2)}</Badge>
                  ) : null}
                </HStack>
                <Text color="gray.400" mb={2}>Horas: {entry.total_hours.toFixed(1)}</Text>
                <Text color="gray.300" fontSize="sm" mb={3}>{entry.activities.length} actividad(es)</Text>
                {entry.activities.map((activity, index) => (
                  <Box key={`${entry.id}-${index}`} bg="#0b0b0c" p={3} borderRadius="md" mb={2}>
                    <Text fontWeight="semibold">{activity.description}</Text>
                    <Text color="gray.400" fontSize="sm">
                      {activity.start} - {activity.end} · {activity.hours} horas
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      Viáticos: {activity.viaticos.toFixed(2)}{activity.viatico_type ? ` · Tipo: ${activity.viatico_type}` : ""}
                    </Text>
                  </Box>
                ))}
              </Box>
            ))
          )}
        </VStack>
      </Box>
    </Box>
  );
}
