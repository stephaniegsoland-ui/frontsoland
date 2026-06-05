"use client";
import { useTransition } from "react";
import {
  Box,
  Flex,
  VStack,
  Text,
  Link,
  Button,
  Circle,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ShieldAlert,
  Car,
  ClipboardCheck,
  ShieldCheck,
  Scan,
  Clock,
  FileText,
  Brain,
  Settings,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "PRINCIPAL",
    items: [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "GESTIÓN",
    items: [
      { name: "Stock", path: "/dashboard/stock", icon: Package },
      { name: "Procura", path: "/dashboard/procura", icon: ShoppingCart },
      { name: "Personal", path: "/dashboard/personal", icon: Users },
      {
        name: "Seguridad EPP",
        path: "/dashboard/seguridad-epp",
        icon: ShieldAlert,
      },
      { name: "Vehículos", path: "/dashboard/vehiculos", icon: Car },
      {
        name: "Inspección Vehicular",
        path: "/dashboard/inspeccion",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "OPERACIONES",
    items: [
      {
        name: "Seguridad",
        path: "/dashboard/operaciones-seguridad",
        icon: ShieldCheck,
      },
      { name: "Scanner", path: "/dashboard/scanner", icon: Scan },
      { name: "Hoja de Tiempo", path: "/dashboard/tiempo", icon: Clock },
    ],
  },
  {
    title: "ANÁLISIS",
    items: [
      { name: "Reportes", path: "/dashboard/reportes", icon: FileText },
      { name: "IA", path: "/dashboard/ia", icon: Brain },
    ],
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      {
        name: "Configuración",
        path: "/dashboard/configuracion",
        icon: Settings,
      },
    ],
  },
];

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  username: string;
  roleDescription: string;
}

export function DashboardLayoutClient({
  children,
  username,
  roleDescription,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Extraemos la primera letra del nombre para el avatar
  const inicial = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <Flex minH="100vh" bg="#08080a" color="white">
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <Box
        w="260px"
        bg="#0a0a0a"
        borderRight="1px solid"
        borderColor="whiteAlpha.100"
        display="flex"
        flexDirection="column"
      >
        {/* Logo Superior */}
        <Flex justify="center" align="center" p={6}>
          <Circle
            size="60px"
            border="2px solid"
            borderColor="yellow.400"
            bg="black"
            boxShadow="0 0 15px rgba(236, 201, 75, 0.3)"
          >
            <Text
              color="yellow.400"
              fontWeight="black"
              fontSize="2xl"
              fontStyle="italic"
            >
              S
            </Text>
          </Circle>
        </Flex>

        {/* Contenedor de Menús */}
        <Box
          flex="1"
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": {
              background: "#333",
              borderRadius: "4px",
            },
          }}
        >
          <VStack as="nav" align="stretch" px={4} pb={4} gap={6}>
            {menuSections.map((section, idx) => (
              <Box key={idx}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="gray.500"
                  mb={2}
                  px={3}
                >
                  {section.title}
                </Text>

                <VStack align="stretch" gap={1}>
                  {section.items.map((item) => {
                    const isActive =
                      item.path === "/dashboard"
                        ? pathname === item.path
                        : pathname.startsWith(item.path);

                    const Icon = item.icon;

                    return (
                      <Link
                        as={NextLink}
                        key={item.name}
                        href={item.path}
                        display="flex"
                        alignItems="center"
                        gap={3}
                        px={3}
                        py={2}
                        borderRadius="md"
                        fontSize="sm"
                        fontWeight={isActive ? "bold" : "medium"}
                        bg={isActive ? "whiteAlpha.100" : "transparent"}
                        color={isActive ? "yellow.400" : "gray.400"}
                        _hover={{
                          bg: "whiteAlpha.200",
                          color: isActive ? "yellow.400" : "white",
                        }}
                        textDecoration="none"
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        {item.name}
                      </Link>
                    );
                  })}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* ================= BLOQUE DE USUARIO (DINÁMICO) ================= */}
        <Box
          p={4}
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          bg="#0a0a0a"
        >
          <Flex align="center" gap={3} mb={4} px={2}>
            {/* Inicial del usuario con estilo */}
            <Flex
              w="40px"
              h="40px"
              bg="yellow.400"
              borderRadius="md"
              align="center"
              justify="center"
              color="black"
              fontWeight="bold"
              fontSize="lg"
            >
              {inicial}
            </Flex>
            <Box overflow="hidden" flex="1">
              <Text
                fontWeight="bold"
                fontSize="sm"
                color="white"
                lineHeight="tight"
                truncate
              >
                {username}
              </Text>
              <Text fontSize="xs" color="gray.500" truncate>
                {roleDescription}
              </Text>
            </Box>
          </Flex>

          {/* Botón Salir */}
          <Button
            w="full"
            bg="yellow.400"
            color="black"
            _hover={{ bg: "yellow.500" }}
            fontWeight="bold"
            display="flex"
            gap={2}
            onClick={handleLogout}
            loading={isPending} // Chakra UI v3 desactivará el botón e indicará que está cargando automáticamente
          >
            <LogOut size={16} />
            Salir
          </Button>
        </Box>
      </Box>

      {/* ================= ÁREA DE CONTENIDO PRINCIPAL ================= */}
      <Box flex="1" overflowY="auto">
        {children}
      </Box>
    </Flex>
  );
}
