import { fetchStockData } from "@/actions/inventario";
import { getCurrentUser } from "@/actions/auth";
import { StockClient } from "./StockClient";
import { Box, Text } from "@chakra-ui/react";

export default async function StockPage() {
  // Disparamos ambas peticiones en paralelo para máxima velocidad
  const [data, user] = await Promise.all([
    fetchStockData(),
    getCurrentUser()
  ]);

  if (data.error) {
    return (
      <Box p={6} bg="#08080a" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="red.400" fontSize="lg" fontWeight="bold">{data.error}</Text>
      </Box>
    );
  }

  // LA LÓGICA DE PERMISOS REAL CONECTADA A TU BACKEND
  // Evaluamos si el usuario existe y si su nivel es 1 (Admin), 2 (Supervisor) 
  // o si tiene la bandera de superusuario activada.
  const isSupervisorOrAdmin = user 
    ? (user.level <= 2 || user.is_superuser === true) 
    : false;

  return (
    <StockClient 
      categorias={data.categorias} 
      resumen={data.resumen} 
      canCreateCategory={isSupervisorOrAdmin} 
    />
  );
}