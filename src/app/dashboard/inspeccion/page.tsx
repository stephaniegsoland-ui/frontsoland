import { fetchFleetData } from "@/actions/vehiculos"
import { Box, Button, Text } from "@chakra-ui/react"
import { VehicleInspectionClient } from "@/app/dashboard/inspeccion/VehicleInspectionClient"
import Link from "next/link"

export default async function InspeccionPage() {
  const data = await fetchFleetData()

  if (data.error) {
    return (
      <Box p={6} bg="#08080a" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="red.400" fontSize="lg" fontWeight="bold">
          {data.error}
        </Text>
      </Box>
    )
  }

  if (!data.vehicles?.length) {
    return (
      <Box p={6} bg="#08080a" minH="100vh" color="white">
        <Text color="yellow.400" fontSize="2xl" fontWeight="bold" mb={3}>
          Inspección Vehicular
        </Text>
        <Box p={5} bg="#7C1200" borderRadius="lg" border="1px solid" borderColor="#B92B27">
          <Text mb={4}>No hay vehículos registrados. Registra uno antes de iniciar una inspección.</Text>
          <Button asChild bg="yellow.400" color="black" _hover={{ bg: "yellow.500" }}>
            <Link href="/dashboard/vehiculos/nuevo">Registrar vehículo</Link>
          </Button>
        </Box>
      </Box>
    )
  }

  return <VehicleInspectionClient vehicles={data.vehicles || []} />
}
