import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Box, Flex, Heading, Text, Button } from "@chakra-ui/react";
import { PersonalClient } from "./PersonalClient";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";

export default async function PersonalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return notFound();

  const user = await getCurrentUser();

  if (!user || (user.level !== 1 && !user.is_superuser)) {
    return (
      <Flex minH="80vh" align="center" justify="center" p={6} bg="#08080a">
        <Flex
          direction="column"
          align="center"
          gap={4}
          textAlign="center"
          bg="#18181b"
          p={8}
          borderRadius="xl"
          border="1px solid"
          borderColor="red.900"
        >
          <ShieldAlert size={64} color="#f87171" />
          <Heading color="white" size="lg">
            Acceso Denegado
          </Heading>
          <Text color="gray.400" maxW="md">
            No tienes los permisos de Administrador necesarios para acceder al
            registro de personal.
          </Text>
          <Button
            asChild
            mt={4}
            bg="whiteAlpha.200"
            color="white"
            _hover={{ bg: "whiteAlpha.300" }}
          >
            <Link href="/dashboard">Volver al Dashboard</Link>
          </Button>
        </Flex>
      </Flex>
    );
  }

  return <PersonalClient />;
}
