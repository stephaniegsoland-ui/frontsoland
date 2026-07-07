import Link from "next/link";
import { Box, Heading, Text, SimpleGrid, Button } from "@chakra-ui/react";

export default function AdministracionPage() {
  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="lg" color="yellow.400" mb={4}>Administración</Heading>
      <Text color="gray.300" mb={6}>Panel administrativo: gestiona empresas, pendientes y peajes administrativos.</Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Box p={4} bg="#0b0b0b" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
          <Heading size="sm" mb={2}>Empresas</Heading>
          <Text color="gray.400" mb={3}>Lista y edición de empresas registradas.</Text>
          <Button as={Link} href="/dashboard/administracion/companies" colorScheme="yellow">Abrir empresas</Button>
        </Box>

        <Box p={4} bg="#0b0b0b" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
          <Heading size="sm" mb={2}>Pendientes</Heading>
          <Text color="gray.400" mb={3}>Tareas y elementos pendientes de aprobación.</Text>
          <Button as={Link} href="/dashboard/administracion/pendientes" colorScheme="yellow">Ver pendientes</Button>
        </Box>

        <Box p={4} bg="#0b0b0b" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
          <Heading size="sm" mb={2}>Peajes administrativos</Heading>
          <Text color="gray.400" mb={3}>Control de peajes de administración.</Text>
          <Button as={Link} href="/dashboard/administracion/peaje" colorScheme="yellow">Ir a peajes</Button>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
