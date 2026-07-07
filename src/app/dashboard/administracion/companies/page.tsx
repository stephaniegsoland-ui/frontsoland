import { Box, Heading, Text } from "@chakra-ui/react";
import CompaniesClient from "./CompaniesClient";

export default function CompaniesPage() {
  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      <Heading size="lg" color="yellow.400" mb={4}>Empresas</Heading>
      <Text color="gray.300" mb={6}>Gestiona las empresas asociadas al sistema.</Text>
      <CompaniesClient />
    </Box>
  );
}
