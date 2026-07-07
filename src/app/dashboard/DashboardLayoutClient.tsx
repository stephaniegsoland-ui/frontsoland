"use client";
import React, { useMemo, useState, useTransition } from "react";
import {
  Box,
  Flex,
  VStack,
  Text,
  Link,
  Button,
  Circle,
  Image,
  IconButton,
  HStack,
  Input,
  InputGroup,
  Badge,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ShieldCheck,
  ShieldAlert,
  Car,
  ClipboardCheck,
  Scan,
  Clock,
  FileText,
  Brain,
  Settings,
  Search,
  Plus,
  Menu,
  LogOut,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
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
    title: "Datos generales",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Stock", path: "/dashboard/stock", icon: Package },
      { name: "Procura", path: "/dashboard/procura", icon: ShoppingCart },
    ],
  },
  {
    title: "Gestión de personas",
    items: [{ name: "Personal", path: "/dashboard/personal", icon: Users }],
  },
  {
    title: "Flota",
    items: [
      { name: "Vehículos", path: "/dashboard/vehiculos", icon: Car },
      { name: "Peajes del vehículo", path: "/dashboard/vehiculos/peaje", icon: FileText },
      { name: "Inspección vehicular", path: "/dashboard/inspeccion", icon: ClipboardCheck },
    ],
  },
  {
    title: "Seguridad",
    items: [
      { name: "Seguridad EPP", path: "/dashboard/seguridad-epp", icon: ShieldCheck },
      { name: "Seguridad", path: "/dashboard/operaciones-seguridad", icon: ShieldAlert },
      { name: "Scanner", path: "/dashboard/scanner", icon: Scan },
    ],
  },
  {
    title: "Retención / Administración",
    items: [
      { name: "Administración", path: "/dashboard/administracion", icon: Settings },
      { name: "Empresas", path: "/dashboard/administracion/companies", icon: Users },
      { name: "Pendientes", path: "/dashboard/administracion/pendientes", icon: Clock },
      { name: "Peajes administrativos", path: "/dashboard/administracion/peaje", icon: FileText },
      { name: "Retenciones", path: "/dashboard/administracion/retencion", icon: ClipboardCheck },
      { name: "Hoja de tiempo administración", path: "/dashboard/administracion/tiempo", icon: Clock },
    ],
  },
  {
    title: "Análisis",
    items: [
      { name: "Reportes", path: "/dashboard/reportes", icon: FileText },
      { name: "IA", path: "/dashboard/ia", icon: Brain },
    ],
  },
  {
    title: "Sistema",
    items: [{ name: "Configuración", path: "/dashboard/configuracion", icon: Settings }],
  },
];

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  username: string;
  roleDescription: string;
  photoData?: string | null;
}

function UserAvatar({ src, name }: { src?: string | null; name: string }) {
  const inicial = name.charAt(0).toUpperCase();
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        boxSize="44px"
        borderRadius="full"
        objectFit="cover"
        border="2px solid"
        borderColor="yellow.400"
      />
    );
  }

  return (
    <Circle
      size="44px"
      bg="yellow.400"
      color="black"
      border="2px solid"
      borderColor="yellow.400"
    >
      <Text fontWeight="black">{inicial}</Text>
    </Circle>
  );
}

export function DashboardLayoutClient({
  children,
  username,
  roleDescription,
  photoData,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const [searchText, setSearchText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(menuSections.map((section) => [section.title, true]))
  );
  const [isPending, startTransition] = useTransition();

  const activePath = useMemo(() => {
    const candidates = menuSections.flatMap((section) => section.items.map((item) => item.path));
    return (
      candidates
        .sort((a, b) => b.length - a.length)
        .find((path) => pathname === path || pathname.startsWith(`${path}/`)) || ""
    );
  }, [pathname]);

  const filteredSections = useMemo(
    () =>
      menuSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.name.toLowerCase().includes(searchText.toLowerCase()) ||
              item.path.toLowerCase().includes(searchText.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0),
    [searchText]
  );

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  const sidebarContent = (
    <Box bg="#0a0a0a" h="100%" display="flex" flexDirection="column">
      <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
        <HStack justify="space-between" align="center" gap={3}>
          <HStack gap={3}>
            <Circle size="46px" border="2px solid" borderColor="yellow.400" bg="black">
              <Text color="yellow.400" fontWeight="black" fontSize="xl">
                S
              </Text>
            </Circle>
            <Box>
              <Text fontWeight="bold">Soland</Text>
              <Text fontSize="xs" color="gray.500">
                Menú de navegación
              </Text>
            </Box>
          </HStack>
        </HStack>

        <Box mt={4} p={3} borderRadius="2xl" bg="whiteAlpha.50" border="1px solid" borderColor="whiteAlpha.100">
          <HStack gap={3} align="center">
            <UserAvatar src={photoData} name={username} />
            <Box minW={0}>
              <Text fontWeight="bold" fontSize="sm" isTruncated>
                {username}
              </Text>
              <Text fontSize="xs" color="gray.400" isTruncated>
                {roleDescription}
              </Text>
            </Box>
          </HStack>
          <HStack gap={2} mt={3} flexWrap="wrap">
            <Badge colorScheme="green" variant="subtle">
              Activo
            </Badge>
            <Badge colorScheme="yellow" variant="subtle">
              Sesión
            </Badge>
          </HStack>
        </Box>

        <VStack gap={2} mt={4} align="stretch">
          <Link as={NextLink} href="/dashboard/personal/nuevo" _hover={{ textDecoration: "none" }}>
            <Button size="sm" bg="yellow.400" color="black" _hover={{ bg: "yellow.500" }}>
              <HStack gap={2} align="center">
                <Plus size={14} />
                <Text>Nuevo personal</Text>
              </HStack>
            </Button>
          </Link>
          <Link as={NextLink} href="/dashboard/vehiculos/nuevo" _hover={{ textDecoration: "none" }}>
            <Button size="sm" variant="outline" borderColor="whiteAlpha.200" _hover={{ bg: "whiteAlpha.100" }}>
              <HStack gap={2} align="center">
                <Plus size={14} />
                <Text>Nuevo vehículo</Text>
              </HStack>
            </Button>
          </Link>
          <Link as={NextLink} href="/dashboard/administracion/companies" _hover={{ textDecoration: "none" }}>
            <Button size="sm" variant="outline" borderColor="whiteAlpha.200" _hover={{ bg: "whiteAlpha.100" }}>
              <HStack gap={2} align="center">
                <Plus size={14} />
                <Text>Agregar empresa</Text>
              </HStack>
            </Button>
          </Link>
          <Link as={NextLink} href="/dashboard/tiempo" _hover={{ textDecoration: "none" }}>
            <Button size="sm" variant="outline" borderColor="whiteAlpha.200" _hover={{ bg: "whiteAlpha.100" }}>
              <HStack gap={2} align="center">
                <Plus size={14} />
                <Text>Nueva actividad</Text>
              </HStack>
            </Button>
          </Link>
        </VStack>

        <Box mt={4}>
          <InputGroup startElement={<Box pl={3} color="gray.400"><Search size={16} /></Box>}>
            <Input
              placeholder="Buscar ruta..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              color="white"
              _placeholder={{ color: "gray.500" }}
            />
          </InputGroup>
        </Box>
      </Box>

      <Box flex="1" overflowY="auto" px={3} py={4} css={{
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": { background: "#333", borderRadius: "999px" },
      }}>
        <VStack align="stretch" gap={5}>
          {filteredSections.map((section) => (
            <Box key={section.title}>
              <HStack justify="space-between" mb={2} px={1}>
                <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="gray.500">
                  {section.title}
                </Text>
                <Button
                  aria-label={`Alternar ${section.title}`}
                  size="sm"
                  variant="ghost"
                  color="gray.400"
                  onClick={() =>
                    setOpenSections((state) => ({
                      ...state,
                      [section.title]: !state[section.title],
                    }))
                  }
                >
                  {openSections[section.title] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </Button>
              </HStack>

              {openSections[section.title] && (
                <VStack align="stretch" gap={1}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path === activePath;
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
                        color={isActive ? "yellow.400" : "gray.300"}
                        _hover={{ bg: "whiteAlpha.150", color: "white" }}
                        textDecoration="none"
                      >
                        <Box
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          w="30px"
                          h="30px"
                          borderRadius="md"
                          bg={isActive ? "yellow.400" : "whiteAlpha.100"}
                          color={isActive ? "black" : "gray.300"}
                        >
                          <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                        </Box>
                        <Text flex="1" truncate>
                          {item.name}
                        </Text>
                      </Link>
                    );
                  })}
                </VStack>
              )}
            </Box>
          ))}
        </VStack>
      </Box>

      <Box p={4} borderTop="1px solid" borderColor="whiteAlpha.100">
        <Button
          w="full"
          size="sm"
          bg="yellow.400"
          color="black"
          _hover={{ bg: "yellow.500" }}
          onClick={handleLogout}
          loading={isPending}
        >
          <HStack gap={2} align="center" justify="center">
            <LogOut size={16} />
            <Text>Cerrar sesión</Text>
          </HStack>
        </Button>
        <Text mt={2} fontSize="xs" color="gray.500">
          Usa el buscador o expande secciones para encontrar rutas rápido.
        </Text>
      </Box>
    </Box>
  );

  const firstName = username.split(" ")[0] || "Usuario";

  return (
    <Flex suppressHydrationWarning minH="100vh" bg="#08080a" color="white" flexDirection="column">
      <Box display={{ base: "flex", md: "none" }} alignItems="center" justifyContent="space-between" px={4} py={3} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="#0b0b0b">
        <HStack gap={3}>
          <IconButton
            aria-label="Abrir menú"
            size="md"
            variant="ghost"
            color="white"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
          </IconButton>
          <Box>
            <Text fontWeight="bold">Panel</Text>
            <Text fontSize="xs" color="gray.400">
              Hola, {firstName}
            </Text>
          </Box>
        </HStack>
      </Box>

      <Flex flex="1" direction={{ base: "column", md: "row" }}>
        <Box display={{ base: "none", md: "block" }} width="280px" borderRight="1px solid" borderColor="whiteAlpha.100">
          {sidebarContent}
        </Box>

        {drawerOpen && (
          <Box position="fixed" inset={0} bg="rgba(0,0,0,0.65)" zIndex={50}>
            <Box width="80vw" maxW="320px" height="100%" bg="#0a0a0a" boxShadow="lg">
              <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
                <HStack justify="space-between" align="center" gap={3}>
                  <Text fontWeight="bold">Navegación</Text>
                  <IconButton
                    aria-label="Cerrar menú"
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ChevronUp size={16} />
                  </IconButton>
                </HStack>
              </Box>
              <Box height="calc(100% - 64px)" overflowY="auto">
                {sidebarContent}
              </Box>
            </Box>
          </Box>
        )}

        <Box flex="1" overflowY="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
