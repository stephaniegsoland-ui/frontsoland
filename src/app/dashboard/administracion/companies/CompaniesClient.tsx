"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, SimpleGrid, Text, Heading } from "@chakra-ui/react";

export default function CompaniesClient() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // placeholder: in future, fetch from action or API
    setItems([
      { id: "1", name: "Empresa A", ruc: "J-12345678-9" },
      { id: "2", name: "Empresa B", ruc: "J-98765432-1" },
    ]);
  }, []);

  return (
    <Box>
      <Button colorScheme="yellow" mb={4}>Agregar empresa</Button>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {items.map((c) => (
          <Box key={c.id} p={4} bg="#0b0b0b" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
            <Heading size="sm" mb={1}>{c.name}</Heading>
            <Text color="gray.400">RUC: {c.ruc}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
