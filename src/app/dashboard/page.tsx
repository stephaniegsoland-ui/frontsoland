"use client";

import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Separator,
} from "@chakra-ui/react";

// --- COMPONENTE AUXILIAR: Tarjeta del Dashboard ---
function DashboardCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="#111216"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      p={5}
      h="full"
    >
      <Heading
        size="xs"
        color="gray.400"
        mb={4}
        textTransform="uppercase"
        letterSpacing="wider"
      >
        {title}
      </Heading>
      {children}
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <Box p={6} bg="#08080a" minH="100vh">
      {/* GRID PRINCIPAL: 1 columna en móviles, 3 columnas en pantallas grandes */}
      <Grid templateColumns={{ base: "1fr", xl: "1fr 2.5fr 1fr" }} gap={6}>
        {/* ================= COLUMNA 1: MÉTRICAS Y TICKETS ================= */}
        <GridItem display="flex" flexDirection="column" gap={6}>
          {/* Tarjeta 1: Rendimiento del Sistema */}
          <DashboardCard title="System Performance">
            <Text color="gray.300" fontSize="sm" mb={4}>
              📈 Rendimiento del Sistema
            </Text>
            <Grid templateColumns="1fr 1fr" gap={4}>
              <Box>
                <Text color="gray.500" fontSize="xs">
                  ⚡ Eficiencia
                </Text>
                <Text color="cyan.400" fontSize="2xl" fontWeight="bold">
                  94%
                </Text>
              </Box>
              <Box>
                <Text color="gray.500" fontSize="xs">
                  ⏱️ Resolución
                </Text>
                <Text color="blue.400" fontSize="2xl" fontWeight="bold">
                  88%
                </Text>
              </Box>
              <Box>
                <Text color="gray.500" fontSize="xs">
                  ⭐ Satisfacción
                </Text>
                <Text color="yellow.400" fontSize="2xl" fontWeight="bold">
                  96%
                </Text>
              </Box>
              <Box>
                <Text color="gray.500" fontSize="xs">
                  🛡️ Disponibilidad
                </Text>
                <Text color="purple.400" fontSize="2xl" fontWeight="bold">
                  100%
                </Text>
              </Box>
            </Grid>
          </DashboardCard>

          {/* Tarjeta 2: Cola de Tickets */}
          <DashboardCard title="Service Ticket Queue">
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Text color="yellow.400" fontWeight="bold">
                  Pendientes
                </Text>
                <Text color="white" fontWeight="bold">
                  12
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="blue.400" fontWeight="bold">
                  En Proceso
                </Text>
                <Text color="white" fontWeight="bold">
                  8
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="green.400" fontWeight="bold">
                  Completados
                </Text>
                <Text color="white" fontWeight="bold">
                  24
                </Text>
              </HStack>

              <Separator borderColor="whiteAlpha.200" />

              <Box>
                <Text color="gray.400" fontSize="xs" mb={1}>
                  Métricas de Resolución
                </Text>
                <HStack justify="space-between">
                  <Text color="green.300" fontSize="sm">
                    2.4 hrs Promedio
                  </Text>
                  <Text color="purple.300" fontSize="sm">
                    96% SLA
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </DashboardCard>
        </GridItem>

        {/* ================= COLUMNA 2: EL MAPA CENTRAL ================= */}
        <GridItem display="flex" flexDirection="column" gap={6}>
          <DashboardCard title="Regional Supply Chain Status">
            <Flex
              direction="column"
              h="full"
              justify="space-between"
              align="center"
            >
              {/* Aquí irá el mapa real después. Por ahora un placeholder visual */}
              <Box
                w="full"
                h="300px"
                bg="whiteAlpha.50"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="1px dashed"
                borderColor="whiteAlpha.200"
                position="relative"
              >
                {/* Logo brillante en el centro */}
                <Box
                  w="60px"
                  h="60px"
                  bg="black"
                  borderRadius="full"
                  border="2px solid"
                  borderColor="yellow.400"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 0 20px rgba(236, 201, 75, 0.5)"
                >
                  <Text color="yellow.400" fontWeight="bold" fontSize="xl">
                    S
                  </Text>
                </Box>
                <Text
                  position="absolute"
                  bottom="4"
                  color="gray.500"
                  fontSize="sm"
                >
                  [ El Mapa Interactivo se renderizará aquí ]
                </Text>
              </Box>

              {/* Relojes Mundiales */}
              {/* ================= INICIO DE LA SECCIÓN INFERIOR DEL MAPA ================= */}
              <VStack
                w="full"
                mt={6}
                pt={6}
                gap={8}
                borderTop="1px solid"
                borderColor="whiteAlpha.200"
              >
                {/* 1. Leyenda de Sedes (Puntos de colores) */}
                <HStack justify="center" gap={6} flexWrap="wrap">
                  {[
                    { name: "Almacén Cebástica", color: "green.400" },
                    { name: "Logística Avanzada", color: "purple.400" },
                    { name: "HQ Principal", color: "yellow.400" },
                    { name: "Distribución Regional", color: "blue.400" },
                    { name: "Entrega Estratégica", color: "red.400" },
                  ].map((sede) => (
                    <HStack key={sede.name} gap={2}>
                      {/* El punto de color con un borde blanco sutil */}
                      <Box
                        w="12px"
                        h="12px"
                        bg={sede.color}
                        borderRadius="full"
                        border="2px solid"
                        borderColor="whiteAlpha.400"
                      />
                      <Text color={sede.color} fontSize="xs" fontWeight="bold">
                        {sede.name}
                      </Text>
                    </HStack>
                  ))}
                </HStack>

                {/* 2. Tarjetas de Relojes Mundiales */}
                <HStack justify="center" gap={4} flexWrap="wrap">
                  {[
                    {
                      country: "VENEZUELA",
                      time: "09:51:51",
                      date: "15/04/2026",
                    },
                    {
                      country: "ESTADOS UNIDOS",
                      time: "09:51:51",
                      date: "15/04/2026",
                    },
                    { country: "ESPAÑA", time: "15:51:51", date: "15/04/2026" },
                    { country: "CHINA", time: "21:51:51", date: "15/04/2026" },
                  ].map((zone) => (
                    <Box
                      key={zone.country}
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      borderRadius="md"
                      p={3}
                      minW="120px"
                      textAlign="center"
                      bg="blackAlpha.300"
                    >
                      <Text
                        color="gray.400"
                        fontSize="xs"
                        fontWeight="bold"
                        letterSpacing="wider"
                        mb={1}
                      >
                        {zone.country}
                      </Text>
                      <Text
                        color="yellow.400"
                        fontSize="md"
                        fontWeight="bold"
                        fontFamily="mono"
                      >
                        {zone.time}
                      </Text>
                      <Text color="gray.500" fontSize="xs" mt={1}>
                        {zone.date}
                      </Text>
                    </Box>
                  ))}
                </HStack>

                {/* 3. Título Inferior */}
                <Text
                  color="yellow.400"
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="widest"
                  mt={2}
                >
                  MONITOREO GLOBAL DE SUMINISTROS
                </Text>
              </VStack>
              {/* ================= FIN DE LA SECCIÓN INFERIOR DEL MAPA ================= */}
            </Flex>
          </DashboardCard>
        </GridItem>

        {/* ================= COLUMNA 3: GRÁFICOS DE BARRAS ================= */}
        <GridItem display="flex" flexDirection="column" gap={6}>
          {/* Gráfico 1: Inventario Disponible (Mockup CSS) */}
          <DashboardCard title="Inventario Disponible">
            <Flex h="150px" align="flex-end" justify="space-around" pt={4}>
              <Box w="12px" h="40%" bg="yellow.400" borderRadius="t-sm" />
              <Box w="12px" h="30%" bg="orange.400" borderRadius="t-sm" />
              <Box w="12px" h="80%" bg="cyan.400" borderRadius="t-sm" />
              <Box w="12px" h="100%" bg="purple.500" borderRadius="t-sm" />
              <Box w="12px" h="60%" bg="green.400" borderRadius="t-sm" />
            </Flex>
            <HStack justify="space-around" mt={2}>
              <Text fontSize="xs" color="gray.500">
                Alicate
              </Text>
              <Text fontSize="xs" color="gray.500">
                N95
              </Text>
              <Text fontSize="xs" color="gray.500">
                Escritorio
              </Text>
            </HStack>
          </DashboardCard>

          {/* Gráfico 2: Pedidos en Proceso (Mockup CSS) */}
          <DashboardCard title="Pedidos en Proceso">
            <Flex h="150px" align="flex-end" justify="space-around" pt={4}>
              <Box w="20px" h="20%" bg="blue.400" borderRadius="t-md" />
              <Box w="20px" h="20%" bg="yellow.400" borderRadius="t-md" />
              <Box w="20px" h="90%" bg="green.400" borderRadius="t-md" />
              <Box w="20px" h="30%" bg="purple.400" borderRadius="t-md" />
            </Flex>
            <HStack justify="space-around" mt={2}>
              <Text fontSize="xs" color="gray.500">
                Botas
              </Text>
              <Text fontSize="xs" color="gray.500">
                Sumin.
              </Text>
              <Text fontSize="xs" color="gray.500">
                Equipos
              </Text>
            </HStack>
          </DashboardCard>
        </GridItem>
      </Grid>
    </Box>
  );
}
