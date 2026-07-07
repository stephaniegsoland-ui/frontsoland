import { Box, Heading, Text } from "@chakra-ui/react";
import PendientesClient from "./PendientesClient";

export default function PendientesPage() {
  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="lg" color="yellow.400" mb={4}>Pendientes</Heading>
      <Text color="gray.300" mb={6}>Tareas pendientes de revisión y aprobación.</Text>
      <PendientesClient />
    </Box>
  );
}
