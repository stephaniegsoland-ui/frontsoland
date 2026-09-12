"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDescription,
  AlertIndicator,
  AlertRoot,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Activity = { description: string; start: string; end: string; hours: number }

type AdminTimesheetEntry = {
  id: string
  user_id: string
  username: string
  date: string
  activities: Activity[]
  total_hours: number
  notes?: string | null
  created_at: string
}

type CurrentUser = {
  id: string
  username: string
  level: number
  is_superuser: boolean
}

function parseHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const s = sh * 60 + sm
  const e = eh * 60 + em
  const diff = Math.max(0, e - s)
  return Math.round((diff / 60) * 100) / 100
}

interface TimesheetClientProps {
  showAdminMetrics?: boolean
}

export default function TimesheetClient({ showAdminMetrics = false }: TimesheetClientProps) {
  const router = useRouter()
  const [date, setDate] = useState<string>("")
  const [description, setDescription] = useState("")
  const [start, setStart] = useState("08:00")
  const [end, setEnd] = useState("12:00")
  const [notes, setNotes] = useState("")
  const [activities, setActivities] = useState<Activity[]>([])
  const [adminEntries, setAdminEntries] = useState<AdminTimesheetEntry[]>([])
  const [isAdminView, setIsAdminView] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10))
    if (showAdminMetrics) {
      void fetchCurrentUser()
    }
  }, [showAdminMetrics])

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" })
      if (res.status === 401) {
        setMessage({ type: "error", text: "No autorizado. Por favor inicia sesión." })
        router.push("/")
        return
      }
      if (!res.ok) return
      const user: CurrentUser = await res.json()
      const canReview = user.is_superuser || user.level === 1 || user.level === 2
      setIsAdminView(canReview)
      if (canReview) {
        await fetchAdminEntries()
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchAdminEntries() {
    try {
      const res = await fetch("/api/timesheet/all", { credentials: "include" })
      if (res.status === 401) {
        setMessage({ type: "error", text: "No autorizado. Por favor inicia sesión." })
        router.push("/")
        return
      }
      if (res.ok) {
        const data = await res.json()
        setAdminEntries(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  function addActivity() {
    const hours = parseHours(start, end)
    if (!description.trim()) {
      setMessage({ type: "error", text: "Describe la actividad antes de agregarla." })
      return
    }
    if (hours <= 0) {
      setMessage({ type: "error", text: "La hora de fin debe ser mayor a la hora de inicio." })
      return
    }
    setActivities((prev) => [...prev, { description, start, end, hours }])
    setDescription("")
    setStart("08:00")
    setEnd("12:00")
    setMessage({ type: "info", text: "Tienes actividades pendientes de enviar. Presiona Guardar y Enviar para enviar tu hoja de tiempo." })
  }

  function totalHours() {
    return activities.reduce((sum, activity) => sum + activity.hours, 0)
  }

  async function submit() {
    if (activities.length === 0) {
      setMessage({ type: "error", text: "Agrega al menos una actividad antes de guardar." })
      return
    }
    const payload = { date, activities, notes }
    const res = await fetch("/api/timesheet/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => null)
    if (res.status === 401) {
      setMessage({ type: "error", text: "No autorizado. Redirigiendo a login..." })
      router.push("/")
      return
    }
    if (res.ok) {
      setActivities([])
      setNotes("")
      if (showAdminMetrics && isAdminView) {
        await fetchAdminEntries()
      }
      setMessage({ type: "success", text: "Hoja de tiempo enviada correctamente." })
      return
    }
    setMessage({ type: "error", text: "Error: " + (data?.detail || data?.error || res.statusText) })
  }

  const summaryByUser = useMemo(() => {
    const totals = adminEntries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.username] = (acc[entry.username] || 0) + entry.total_hours
      return acc
    }, {})

    return Object.entries(totals)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
  }, [adminEntries])

  const recentAdminTrend = useMemo(() => {
    const grouped = adminEntries.reduce<Record<string, number>>((acc, entry) => {
      const day = entry.date
      acc[day] = (acc[day] || 0) + entry.total_hours
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-7)
  }, [adminEntries])

  const selectedEntry = useMemo(
    () => adminEntries.find((entry) => entry.id === selectedEntryId) ?? null,
    [adminEntries, selectedEntryId],
  )

  return (
    <Box p={6} bg="#08080a" color="white" minH="80vh">
      <Heading size="lg" color="yellow.400" mb={4}>
        Hoja de Tiempo
      </Heading>

      <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100" mb={4}>
        <Text mb={4} color="gray.300">
          Carga cada actividad individualmente y cuando termines presiona "Guardar y Enviar" para enviar tu hoja de tiempo.
        </Text>
        {message ? (
          <AlertRoot status={message.type} mb={4} borderRadius="md">
            <AlertIndicator />
            <AlertDescription>{message.text}</AlertDescription>
          </AlertRoot>
        ) : null}
        {activities.length > 0 ? (
          <AlertRoot status="info" mb={4} borderRadius="md">
            <AlertIndicator />
            <AlertDescription>
              Tienes {activities.length} actividad(es) cargada(s). Debes enviar la hoja de tiempo.
            </AlertDescription>
          </AlertRoot>
        ) : null}

        <HStack gap={3} mb={3} flexWrap="wrap">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Input placeholder="Actividad" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          <Input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          <Button onClick={addActivity} colorScheme="yellow">
            Agregar
          </Button>
        </HStack>

        <VStack align="stretch" gap={2} mb={3}>
          <HStack fontWeight="bold" color="gray.400">
            <Text flex="1">Actividad</Text>
            <Text w="80px">Inicio</Text>
            <Text w="80px">Fin</Text>
            <Text w="80px">Horas</Text>
          </HStack>
          {activities.map((activity, index) => (
            <HStack key={`${activity.description}-${index}`} bg="#0b0b0c" p={2} borderRadius="md" align="center">
              <Text flex="1">{activity.description}</Text>
              <Text w="80px">{activity.start}</Text>
              <Text w="80px">{activity.end}</Text>
              <Text w="80px">{activity.hours}</Text>
            </HStack>
          ))}
        </VStack>

        <HStack justify="space-between" flexWrap="wrap">
          <Text>
            Total horas: <strong>{totalHours()}</strong>
          </Text>
          <Button onClick={submit} colorScheme="yellow" disabled={activities.length === 0}>
            Guardar y Enviar
          </Button>
        </HStack>
      </Box>

      {showAdminMetrics && isAdminView && (
        <Box bg="#0f0f10" p={4} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
          <HStack justify="space-between" mb={4} flexWrap="wrap">
            <Heading size="sm">Recepción de hojas enviadas</Heading>
            <Badge colorScheme="green">Vista administrativa</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
            <Box bg="#141417" p={3} borderRadius="md">
              <Text color="gray.400" fontSize="sm" mb={1}>Hojas recibidas</Text>
              <Text fontSize="2xl" fontWeight="bold">{adminEntries.length}</Text>
            </Box>
            <Box bg="#141417" p={3} borderRadius="md">
              <Text color="gray.400" fontSize="sm" mb={1}>Total horas</Text>
              <Text fontSize="2xl" fontWeight="bold">
                {adminEntries.reduce((sum, entry) => sum + entry.total_hours, 0).toFixed(1)}
              </Text>
            </Box>
            <Box bg="#141417" p={3} borderRadius="md">
              <Text color="gray.400" fontSize="sm" mb={1}>Usuarios activos</Text>
              <Text fontSize="2xl" fontWeight="bold">{new Set(adminEntries.map((entry) => entry.username)).size}</Text>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mb={4}>
            <Box bg="#141417" p={3} borderRadius="md">
              <Text fontWeight="bold" mb={3}>Horas por colaborador</Text>
              {summaryByUser.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={summaryByUser}>
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#38B2AC" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text color="gray.400">Aún no hay datos para graficar.</Text>
              )}
            </Box>

            <Box bg="#141417" p={3} borderRadius="md">
              <Text fontWeight="bold" mb={3}>Tendencia semanal</Text>
              {recentAdminTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={recentAdminTrend}>
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#F6E05E" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text color="gray.400">No hay registros recientes.</Text>
              )}
            </Box>
          </SimpleGrid>

          <VStack align="stretch" gap={2}>
            <Text fontWeight="bold">Últimas hojas recibidas</Text>
            {adminEntries.length > 0 ? (
              <>
                {adminEntries.slice(0, 8).map((entry) => {
                  const isSelected = selectedEntryId === entry.id
                  return (
                    <Box
                      key={entry.id}
                      bg="#0b0b0c"
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={isSelected ? "yellow.400" : "whiteAlpha.100"}
                    >
                      <HStack justify="space-between" mb={2} flexWrap="wrap">
                        <Text fontWeight="bold">{entry.username}</Text>
                        <Badge colorScheme="yellow">{entry.date}</Badge>
                      </HStack>
                      <Text color="gray.400" fontSize="sm" mb={2}>
                        Total horas: {entry.total_hours} · Actividades: {entry.activities.length}
                      </Text>
                      {entry.notes ? <Text fontSize="sm" mb={3}>{entry.notes}</Text> : null}
                      <Button size="sm" variant="outline" colorScheme="yellow" onClick={() => setSelectedEntryId(isSelected ? null : entry.id)}>
                        {isSelected ? "Ocultar tareas" : "Ver tareas"}
                      </Button>

                      {isSelected && selectedEntry ? (
                        <Box mt={3} bg="#141417" p={3} borderRadius="md">
                          <Text fontWeight="bold" mb={2}>Tareas cargadas</Text>
                          {selectedEntry.activities.length > 0 ? (
                            selectedEntry.activities.map((activity, index) => (
                              <Box key={`${activity.description}-${index}`} bg="#0b0b0c" p={2} borderRadius="md" mb={2}>
                                <Text fontWeight="semibold">{activity.description}</Text>
                                <Text fontSize="sm" color="gray.400">
                                  {activity.start} - {activity.end} · {activity.hours} horas
                                </Text>
                              </Box>
                            ))
                          ) : (
                            <Text color="gray.400">No hay tareas registradas en esta hoja.</Text>
                          )}
                        </Box>
                      ) : null}
                    </Box>
                  )
                })}
              </>
            ) : (
              <Text color="gray.400">No hay hojas recibidas todavía.</Text>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  )
}
