import { fetchFleetData } from "@/actions/vehiculos"
import { Box, Text } from "@chakra-ui/react"
import { VehicleInspectionClient } from "@/app/dashboard/inspeccion/VehicleInspectionClient"

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

  return <VehicleInspectionClient vehicles={data.vehicles || []} />
}
