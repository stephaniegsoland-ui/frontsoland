"use client";

import React from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface StatsProps {
  procuras: Array<{ usage?: string; status?: string; items?: Array<{ name?: string; quantity?: number }> }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Finalizado",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export function ProcuraStats({ procuras }: StatsProps) {
  const usageCount = React.useMemo(() => {
    const counts: Record<string, number> = {};
    procuras.forEach((procura) => {
      const key = procura.usage?.trim() || "Sin uso";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([usage, value]) => ({ usage, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [procuras]);

  const statusCount = React.useMemo(() => {
    const counts: Record<string, number> = {};
    procuras.forEach((procura) => {
      const status = procura.status || "pending";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({ status, value }));
  }, [procuras]);

  return (
    <Box bg="#121212" p={6} borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.100">
      <Text fontSize="2xl" fontWeight="bold" mb={4} color="white">
        Estadísticas de Procura
      </Text>
      <Flex gap={6} wrap="wrap">
        <Box flex="1" minW="280px" bg="#0d0d0f" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="sm" color="gray.400" mb={3}>
            Usos más repetidos
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={usageCount} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="usage" width={130} tick={{ fill: "#cbd5e0", fontSize: 12 }} />
              <Tooltip formatter={(value: any) => [`${value ?? ""}`, "Solicitudes"]} />
              <Bar dataKey="value" fill="#f6e05e">
                {usageCount.map((entry, index) => (
                  <Cell key={index} fill={index % 2 === 0 ? "#f6e05e" : "#ecc94b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box flex="1" minW="280px" bg="#0d0d0f" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="sm" color="gray.400" mb={3}>
            Estado de solicitudes
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusCount} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <XAxis dataKey="status" tick={{ fill: "#cbd5e0", fontSize: 12 }} />
              <YAxis tick={{ fill: "#cbd5e0", fontSize: 12 }} />
              <Tooltip formatter={(value: any) => [`${value ?? ""}`, "Solicitudes"]} labelFormatter={(label: any) => STATUS_LABELS[label] || label} />
              <Bar dataKey="value" fill="#4fd1c5">
                {statusCount.map((entry, index) => (
                  <Cell key={index} fill={entry.status === "pending" ? "#f6e05e" : entry.status === "in_progress" ? "#63b3ed" : entry.status === "approved" || entry.status === "completed" ? "#48bb78" : "#f56565"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
    </Box>
  );
}
