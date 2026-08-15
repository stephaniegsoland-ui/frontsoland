"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Heading, Input, Button, Text, SimpleGrid, Textarea } from "@chakra-ui/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$|\/$/, "") || "http://localhost:8000";

interface PeajeClientProps {
  initialVehicles: any[];
  initialUsers: any[];
  initialFetchError?: string | null;
}

const demoSubmissions = [
  { id: 1, vehicle: "Camión 02", plate: "ABC-123", route: "Ruta Norte", amount: 240, status: "pendiente", created_at: "2026-07-06" },
  { id: 2, vehicle: "Volqueta 11", plate: "DEF-456", route: "Ruta Sur", amount: 180, status: "aprobado", created_at: "2026-07-05" },
];

export function PeajeClient({ initialVehicles, initialUsers, initialFetchError }: PeajeClientProps) {
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [plate, setPlate] = useState("");
  const [route, setRoute] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState("");
  const [tripType, setTripType] = useState("ida");
  const [submissions, setSubmissions] = useState<any[]>(demoSubmissions);
  const [vehicleId, setVehicleId] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError ?? null);

  const vehicleOptions = useMemo(() => {
    return Array.isArray(initialVehicles) && Array.isArray(initialUsers)
      ? initialVehicles
          .map((veh: any) => {
            const user = initialUsers.find((u: any) => u.id === veh.user_id);
            return {
              vehicle_id: veh.id,
              license_plate: veh.license_plate,
              model: veh.model,
              driver_id: veh.user_id,
              driver_name: user?.username || "",
              label: `${veh.license_plate} — ${veh.model}`,
            };
          })
          .filter((item: any) => item.driver_id)
      : [];
  }, [initialVehicles, initialUsers]);

  useEffect(() => {
    const saved = window.localStorage.getItem("vehiculoPeajeSubmissions");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSubmissions(parsed);
      }
    } catch {
      // ignore invalid localStorage data
    }
    // set default date on client after mount to avoid hydration mismatches
    if (!date) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, []);

  const saveSubmissions = (items: any[]) => {
    window.localStorage.setItem("vehiculoPeajeSubmissions", JSON.stringify(items));
    window.localStorage.setItem("vehiculoPeajeSync", Date.now().toString());
  };

  const handleVehicleSelection = (selectedId: string) => {
    setVehicleId(selectedId);
    const option = vehicleOptions.find((item: any) => item.vehicle_id === selectedId);
    if (option) {
      setVehicle(option.label);
      setPlate(option.license_plate);
      setDriver(option.driver_name);
    } else {
      setVehicle("");
      setPlate("");
      setDriver("");
    }
  };

  const getDateKey = (dateValue: Date) => dateValue.toISOString().slice(0, 10);

  const getMonthTollStatus = (entries: any[], monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const expected = [] as Array<{ key: string; label: string }>;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(year, month, day);
      const weekday = current.getDay();
      if (weekday === 1 || weekday === 5) {
        const type = weekday === 1 ? "ida" : "regreso";
        expected.push({
          key: getDateKey(current),
          label: `${current.toLocaleDateString("es-VE", { weekday: "long", day: "2-digit", month: "2-digit" })} (${type})`,
        });
      }
    }

    const submittedKeys = new Set(
      entries
        .filter((entry) => {
          if (!entry.date) return false;
          const entryDate = new Date(entry.date);
          return (
            entryDate.getFullYear() === year &&
            entryDate.getMonth() === month &&
            ((entry.type === "ida" && entryDate.getDay() === 1) ||
              (entry.type === "regreso" && entryDate.getDay() === 5))
          );
        })
        .map((entry) => getDateKey(new Date(entry.date)))
    );

    const missing = expected.filter((item) => !submittedKeys.has(item.key));
    return { monthLabel: monthDate.toLocaleDateString("es-VE", { month: "long", year: "numeric" }), missing };
  };

  const monthTollStatus = getMonthTollStatus(submissions, new Date());

  const submit = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!driver.trim() || !vehicle.trim() || !plate.trim() || !route.trim() || !amount.trim()) {
      setErrorMessage("Debes completar todos los campos obligatorios: chofer, vehículo, placa, ruta y monto.");
      return;
    }

    if (vehicleOptions.length > 0 && !vehicleId) {
      setErrorMessage("Selecciona un vehículo registrado para cargar el peaje.");
      return;
    }

    if (!file) {
      setErrorMessage("Falta adjuntar la factura de peaje.");
      return;
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    const weekday = selectedDate.getDay();
    if (tripType === "ida" && weekday !== 1) {
      setErrorMessage("El peaje de ida debe corresponder a un día lunes.");
      return;
    }
    if (tripType === "regreso" && weekday !== 5) {
      setErrorMessage("El peaje de regreso debe corresponder a un día viernes.");
      return;
    }

    const form = new FormData();
    form.append("driver", driver);
    form.append("vehicle", vehicle);
    form.append("plate", plate);
    form.append("route", route);
    form.append("amount", amount);
    form.append("date", date);
    form.append("type", tripType);
    form.append("notes", notes);
    form.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/admin/peaje`, {
      method: "POST",
      body: form,
      credentials: "include",
    });

    if (!response.ok) {
      let detail = "Error al cargar el peaje. Intenta de nuevo.";
      try {
        const json = await response.json();
        if (json && json.detail) {
          detail = typeof json.detail === "string" ? json.detail : JSON.stringify(json.detail);
        }
      } catch {
        // ignore parse failure
      }
      setErrorMessage(detail);
      return;
    }

    const newEntry = {
      id: Date.now(),
      driver,
      vehicle,
      plate,
      route,
      amount: Number(amount || 0),
      date,
      type: tripType,
      status: "pendiente",
      notes,
      fileName: file?.name,
      created_at: new Date().toISOString(),
    };

    setSubmissions((s) => {
      const next = [newEntry, ...s];
      saveSubmissions(next);
      return next;
    });
    setStatusMessage("Peaje cargado correctamente.");
    setDriver("");
    setVehicle("");
    setPlate("");
    setRoute("");
    setAmount("");
    setNotes("");
    setFile(null);
  };

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="md" mb={2}>Peajes del vehículo</Heading>
      <Text color="gray.400" mb={6}>Formulario para que el chofer registre peajes asociados al vehículo asignado.</Text>

      <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200" mb={6}>
        <Box mb={4} p={4} bg="whiteAlpha.50" borderRadius="md">
          <Text fontSize="sm" mb={2} color="gray.300">Control mensual de peajes</Text>
          {monthTollStatus.missing.length === 0 ? (
            <Box bg="green.500" color="white" p={3} borderRadius="md">
              Todos los peajes de {monthTollStatus.monthLabel} están cargados: lunes ida y viernes regreso.
            </Box>
          ) : (
            <Box bg="yellow.400" color="black" p={3} borderRadius="md">
              Faltan {monthTollStatus.missing.length} peaje(s) de {monthTollStatus.monthLabel}. Fechas pendientes: {monthTollStatus.missing.slice(0, 3).map((item) => item.label).join(", ")}{monthTollStatus.missing.length > 3 ? ` y ${monthTollStatus.missing.length - 3} más` : ""}.
            </Box>
          )}
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Vehículo registrado</Text>
            <select
              value={vehicleId}
              onChange={(e) => handleVehicleSelection(e.target.value)}
              style={{
                border: "1px solid rgba(255,255,255,0.24)",
                borderRadius: "0.5rem",
                background: "#0b0b0b",
                color: "white",
                padding: "0.5rem",
                width: "100%",
              }}
            >
              <option value="">Selecciona un vehículo</option>
              {vehicleOptions.map((option: any) => (
                <option key={option.vehicle_id} value={option.vehicle_id}>
                  {option.label} / {option.driver_name}
                </option>
              ))}
            </select>
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Chofer</Text>
            <Input value={driver} readOnly placeholder="Nombre del chofer" />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Placa</Text>
            <Input value={plate} readOnly placeholder="ABC-123" />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Ruta</Text>
            <Input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="Ruta Norte" />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Tipo de peaje</Text>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              style={{
                border: "1px solid rgba(255,255,255,0.24)",
                borderRadius: "0.5rem",
                background: "#0b0b0b",
                color: "white",
                padding: "0.5rem",
                width: "100%",
              }}
            >
              <option value="ida">Ida (lunes)</option>
              <option value="regreso">Regreso (viernes)</option>
            </select>
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Fecha del peaje</Text>
            <Input value={date} type="date" onChange={(e) => setDate(e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Monto</Text>
            <Input value={amount} type="number" onChange={(e) => setAmount(e.target.value)} placeholder="Ej. 180" />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="gray.300">Adjuntar factura</Text>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Box>
          <Box gridColumn={{ base: "span 1", md: "span 2" }}>
            <Text fontSize="sm" mb={1} color="gray.300">Notas</Text>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} minH="96px" placeholder="Describe el peaje o el recorrido" />
          </Box>
        </SimpleGrid>
        <Button mt={4} colorScheme="yellow" onClick={submit}>Enviar peaje del vehículo</Button>
        {initialFetchError ? (
          <Box bg="orange.400" color="black" mt={3} p={3} borderRadius="md">
            {initialFetchError}
          </Box>
        ) : null}
        {statusMessage ? (
          <Box bg="green.500" color="white" mt={3} p={3} borderRadius="md">
            {statusMessage}
          </Box>
        ) : null}
        {errorMessage ? (
          <Box bg="red.500" color="white" mt={3} p={3} borderRadius="md">
            {errorMessage}
          </Box>
        ) : null}
        {fetchError ? (
          <Box bg="orange.400" color="black" mt={3} p={3} borderRadius="md">
            {fetchError}
          </Box>
        ) : null}
      </Box>

      <Box bg="#0b0b0b" p={4} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.200">
        <Heading size="sm" mb={3}>Tus envíos recientes</Heading>
        {submissions.length === 0 ? (
          <Text color="gray.400">Aún no has cargado ningún peaje.</Text>
        ) : (
          submissions.map((item) => (
            <Box key={item.id} p={3} borderRadius="md" bg="whiteAlpha.50" mb={3}>
              <Text fontWeight="bold">{item.vehicle} — {item.plate}</Text>
              <Text fontSize="sm" color="gray.400">Chofer: {item.driver || "—"} | Ruta: {item.route} | Tipo: {item.type || "—"}</Text>
              <Text fontSize="sm" color="gray.400">Monto: Bs. {Number(item.amount || 0).toLocaleString("es-VE")} | Estado: {item.status}</Text>
              <Text fontSize="sm" color="gray.400">Fecha de peaje: {item.date ? new Date(item.date).toLocaleDateString("es-VE") : new Date(item.created_at).toLocaleDateString("es-VE")}</Text>
              {item.fileName ? <Text fontSize="sm" color="gray.400">Archivo: {item.fileName}</Text> : null}
              {item.notes ? <Text fontSize="sm" color="gray.400">Notas: {item.notes}</Text> : null}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
