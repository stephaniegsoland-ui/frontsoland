import { getCurrentUser } from "@/actions/auth";
import { Box, Heading, Text, VStack, Grid, GridItem } from "@chakra-ui/react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const username = user ? user.username : "Usuario";

  return (
    <Box p={8} bg="#08080a" minH="100vh" color="white">
      <VStack align="start" gap={2} mb={8}>
        {/* Saludo dinámico con el nombre real de la base de datos */}
        <Heading as="h1" size="xl" color="yellow.400">
          ¡Bienvenido de vuelta, {username}!
        </Heading>
        <Text color="gray.400" fontSize="md">
          Este es el centro de control operativo de Soland. Selecciona un módulo en la barra lateral para comenzar.
        </Text>
      </VStack>

      {/* RECUADROS DE RESUMEN RÁPIDO (MOCK PARA COMPLETAR LA VISTA) */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        <GridItem 
          bg="#18181b" 
          p={6} 
          borderRadius="xl" 
          border="1px solid" 
          borderColor="whiteAlpha.100"
        >
          <Text fontSize="sm" color="gray.400" fontWeight="bold">ESTADO DEL SISTEMA</Text>
          <Text fontSize="2xl" fontWeight="bold" color="green.400" mt={2}>Óptimo</Text>
        </GridItem>

        <GridItem 
          bg="#18181b" 
          p={6} 
          borderRadius="xl" 
          border="1px solid" 
          borderColor="whiteAlpha.100"
        >
          <Text fontSize="sm" color="gray.400" fontWeight="bold">TU NIVEL DE ACCESO</Text>
          <Text fontSize="2xl" fontWeight="bold" color="yellow.400" mt={2}>
            Nivel {user?.level || 3}
          </Text>
        </GridItem>

        <GridItem 
          bg="#18181b" 
          p={6} 
          borderRadius="xl" 
          border="1px solid" 
          borderColor="whiteAlpha.100"
        >
          <Text fontSize="sm" color="gray.400" fontWeight="bold">ALERTAS ACTIVAS</Text>
          <Text fontSize="2xl" fontWeight="bold" color="red.400" mt={2}>0</Text>
        </GridItem>
      </Grid>
    </Box>
  );
}