import { notFound } from "next/navigation";
import { fetchFleetData } from "@/actions/vehiculos";
import { NewRecordClient } from "./NewRecordClient";
import { Flex, Text, Box } from "@chakra-ui/react";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

export default async function NewRecordPage() {
  const data = await fetchFleetData();

  if ("error" in data && data.error?.includes("No autorizado")) {
    return notFound();
  }

  // Manejo de errores de conexión
  if ("error" in data) {
    return (
      <Flex minH="100vh" bg="#08080a" align="center" justify="center" p={6}>
        <Flex
          direction="column"
          align="center"
          gap={3}
          bg="#18181b"
          p={8}
          borderRadius="xl"
          border="1px solid"
          borderColor="red.900"
        >
          <AlertCircle color="#f87171" size={48} />
          <Text color="red.400" fontWeight="bold">
            Error cargando datos: {data.error}
          </Text>
        </Flex>
      </Flex>
    );
  }

  return (
    <Suspense
      fallback={
        <Box p={6} color="gray.400">
          Cargando formulario...
        </Box>
      }
    >
      <NewRecordClient vehiculos={data.vehicles} tipos={data.typeRecord} />
    </Suspense>
  );
}
