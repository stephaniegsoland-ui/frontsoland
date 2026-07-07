"use client";

import React, { useEffect, useState } from "react";
import { Box, VStack, Text, Badge, Button } from "@chakra-ui/react";

export default function PendientesClient() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    setItems([
      { id: "1", title: "Aprobar peaje #123", type: "peaje", created_at: new Date().toISOString() },
      { id: "2", title: "Revisar inspección vehículo 45", type: "inspeccion", created_at: new Date().toISOString() },
    ]);
  }, []);

  return (
    <Box>
      <Button colorScheme="yellow" mb={4}>Procesar todos</Button>
      <VStack align="stretch" gap={3}>
        {items.map((it) => (
          <Box key={it.id} p={3} bg="#0b0b0b" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
            <Text fontWeight="bold">{it.title}</Text>
            <Text fontSize="sm" color="gray.400">Tipo: {it.type} • {new Date(it.created_at).toLocaleString()}</Text>
            <Badge mt={2} colorScheme="red">Pendiente</Badge>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
