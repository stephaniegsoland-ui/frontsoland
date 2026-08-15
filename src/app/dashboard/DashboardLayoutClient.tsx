"use client";
import React, { useEffect, useMemo, useState, useTransition } from "react";
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
import { usePathname, useRouter } from "next/navigation";
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
  Bell,
  Plus,
  Menu,
  LogOut,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { NotificationProvider, useNotifications } from "@/context/NotificationContext";

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
      { name: "Hoja de tiempo usuario", path: "/dashboard/tiempo", icon: Clock },
      { name: "Hoja de tiempo administración", path: "/dashboard/administracion/tiempo", icon: Clock },
    ],
  },
  {
    title: "Análisis",
    items: [
      { name: "Reportes", path: "/dashboard/reportes", icon: FileText },
      { name: "Chat interno", path: "/dashboard/chat", icon: Brain },
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
  const [imageError, setImageError] = useState(false);

  if (src && !imageError) {
    return (
      <Image
        src={src}
        alt={name}
        boxSize="44px"
        borderRadius="full"
        objectFit="cover"
        border="2px solid"
        borderColor="yellow.400"
        onError={() => setImageError(true)}
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

function NotificationHeader() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box px={6} py={4} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="#08080a">
      <Flex justify="space-between" align="center" gap={3}>
        <Text fontSize="lg" fontWeight="bold">
          Notificaciones
        </Text>
        <HStack gap={2} align="center">
          <Button
            variant="ghost"
            color="white"
            position="relative"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="0"
                right="0"
                transform="translate(25%, -25%)"
                borderRadius="full"
                bg="red.500"
                color="white"
                px={2}
                fontSize="xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            Marcar leídas
          </Button>
        </HStack>
      </Flex>
      {menuOpen && (
        <Box mt={3} bg="#0b0b0c" p={3} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
          {notifications.length === 0 ? (
            <Text color="gray.500">No hay notificaciones.</Text>
          ) : (
            notifications.map((item) => (
              <Box key={item.id} mb={3} p={3} bg="#121212" borderRadius="2xl">
                <Text
                  fontWeight="bold"
                  fontSize="sm"
                  color={item.type === "error" ? "red.300" : item.type === "success" ? "green.300" : "yellow.300"}
                >
                  {item.title}
                </Text>
                <Text color="gray.300" fontSize="sm" mt={1}>
                  {item.message}
                </Text>
                <Text color="gray.500" fontSize="xs" mt={1}>
                  {new Date(item.createdAt).toLocaleString("es-PE")}
                </Text>
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}

export function DashboardLayoutClient({
  children,
  username,
  roleDescription,
  photoData,
}: DashboardLayoutClientProps) {
  const router = useRouter();

  function SidebarButton({ href, children, variant }: { href: string; children: React.ReactNode; variant?: string }) {
    return (
      <Button
        size="sm"
        variant={(variant as any) || "solid"}
        bg={(variant === "outline") ? undefined : "yellow.400"}
        color={(variant === "outline") ? "white" : "black"}
        borderColor={variant === "outline" ? "whiteAlpha.200" : undefined}
        _hover={{ bg: variant === "outline" ? "whiteAlpha.100" : "yellow.500" }}
        onClick={() => router.push(href)}
        w="full"
      >
        <HStack gap={2} align="center">
          {children}
        </HStack>
      </Button>
    );
  }
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
              <Text fontWeight="bold" fontSize="sm" truncate>
                {username}
              </Text>
              <Text fontSize="xs" color="gray.400" truncate>
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
          <SidebarButton href="/dashboard/personal/nuevo">
            <Plus size={14} />
            <Text>Nuevo personal</Text>
          </SidebarButton>
          <SidebarButton href="/dashboard/vehiculos/nuevo" variant="outline">
            <Plus size={14} />
            <Text>Nuevo vehículo</Text>
          </SidebarButton>
          <SidebarButton href="/dashboard/administracion/companies" variant="outline">
            <Plus size={14} />
            <Text>Agregar empresa</Text>
          </SidebarButton>
          <SidebarButton href="/dashboard/tiempo" variant="outline">
            <Plus size={14} />
            <Text>Nueva actividad</Text>
          </SidebarButton>
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <NotificationProvider>
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
            <NotificationHeader />
          <Box px={6} py={4} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="#08080a">
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={3}>
              <Box>
                <Text fontSize="sm" color="gray.400" fontWeight="bold">
                  Acceso rápido
                </Text>
                <Text fontSize="lg" fontWeight="semibold">
                  Panel de control
                </Text>
              </Box>
              <HStack gap={2} flexWrap="wrap">
                {[
                  { name: "Inicio", href: "/dashboard" },
                  { name: "Stock", href: "/dashboard/stock" },
                  { name: "Procura", href: "/dashboard/procura" },
                  { name: "Personal", href: "/dashboard/personal" },
                  { name: "Vehículos", href: "/dashboard/vehiculos" },
                  { name: "Panel conductor", href: "/dashboard/vehiculos/monitor" },
                ].map((link) => (
                  <Button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    size="sm"
                    variant={pathname === link.href ? "solid" : "outline"}
                    colorScheme={pathname === link.href ? "yellow" : "gray"}
                  >
                    {link.name}
                  </Button>
                ))}
              </HStack>
            </Flex>
          </Box>
            {children}
          </Box>
        </Flex>
      </Flex>
    </NotificationProvider>
  );
}
