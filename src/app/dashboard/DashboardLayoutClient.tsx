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
  Leaf,
  Menu,
  LogOut,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { NotificationProvider, useNotifications } from "@/context/NotificationContext";
import { ChatInternalClient } from "./chat/ChatInternalClient";
import { hasModuleAccess, permissionForPath } from "@/lib/permissions";
import { AvatarConfig, CartoonAvatar, DEFAULT_AVATAR_CONFIG } from "@/components/CartoonAvatar";
import { ThreeDAvatar } from "@/components/ThreeDAvatar";

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
      { name: "Hoja de tiempo usuarios", path: "/dashboard/tiempo", icon: Clock },
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
      { name: "Dpto de seguridad", path: "/dashboard/operaciones-seguridad", icon: ShieldAlert },
      { name: "Seguridad EPP", path: "/dashboard/seguridad-epp", icon: ShieldCheck },
      { name: "Permisología", path: "/dashboard/seguridad-permisos", icon: FileText },
      { name: "Dpto de ambiente", path: "/dashboard/ambiente", icon: Leaf },
    ],
  },
  {
    title: "Administración",
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
  currentUser?: CurrentUser;
}

interface CurrentUser {
  id: string;
  username: string;
  level: number;
  email: string;
  permissions?: string[] | null;
  avatar_config?: AvatarConfig | null;
}

function UserAvatar({ src, name, avatarConfig }: { src?: string | null; name: string; avatarConfig?: AvatarConfig | null }) {
  const photoConfig = src
    ? { ...DEFAULT_AVATAR_CONFIG, ...(avatarConfig ?? {}), mode: "foto" as const, usePhoto: true }
    : undefined;

  if (src) {
    return (
      <Circle size="44px" border="1px solid" borderColor="yellow.400" bg="transparent" overflow="hidden">
        <CartoonAvatar username={name} photoData={src} config={photoConfig} size={44} />
      </Circle>
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
      <ThreeDAvatar config={avatarConfig} />
    </Circle>
  );
}

function SolandLogo() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Circle size="46px" border="2px solid" borderColor="yellow.400" bg="white" overflow="hidden">
      {!logoFailed ? (
        <Image src="/LOGODEF.png" alt="Logo de Soland" width="100%" height="100%" objectFit="contain" onError={() => setLogoFailed(true)} />
      ) : (
        <Text color="yellow.500" fontWeight="black" fontSize="xl">S</Text>
      )}
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
            color={unreadCount > 0 ? "yellow.300" : "white"}
            position="relative"
            onClick={() => setMenuOpen((prev) => !prev)}
            _before={
              unreadCount > 0
                ? {
                    content: '""',
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "9999px",
                    border: "2px solid",
                    borderColor: "red.400",
                    animation: "pulse 1.6s ease-in-out infinite",
                  }
                : undefined
            }
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

function FloatingChatButton({ currentUser }: { currentUser?: CurrentUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/dashboard/chat") || !hasModuleAccess(currentUser?.level ?? 1, currentUser?.permissions, "chat")) return null;

  return (
    <>
      {open && currentUser ? (
        <Box position="fixed" right={{ base: 3, md: 6 }} bottom={{ base: 24, md: 28 }} zIndex={39} width={{ base: "calc(100vw - 24px)", sm: "420px" }} height={{ base: "min(72vh, 680px)", md: "680px" }} bg="#0f1012" border="1px solid" borderColor="whiteAlpha.200" borderRadius="xl" overflow="hidden" boxShadow="0 18px 50px rgba(0,0,0,0.55)">
          <ChatInternalClient currentUser={currentUser} compact />
        </Box>
      ) : null}
      <Box position="fixed" right={{ base: 4, md: 6 }} bottom={{ base: 4, md: 6 }} zIndex={40}>
        {unreadCount > 0 && (
          <>
            <Box
              position="absolute"
              top="-2px"
              right="-2px"
              width="14px"
              height="14px"
              borderRadius="full"
              bg="red.500"
              border="2px solid"
              borderColor="#0f1012"
              boxShadow="0 0 0 4px rgba(239, 68, 68, 0.22)"
              animation="pulse 1.3s ease-in-out infinite"
            />
            <Badge
              position="absolute"
              top="-8px"
              right="-8px"
              borderRadius="full"
              bg="red.500"
              color="white"
              px={2}
              py={1}
              fontSize="10px"
              fontWeight="bold"
              boxShadow="0 0 0 3px rgba(15,15,18,0.95)"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          </>
        )}
        <IconButton
          aria-label={open ? "Cerrar chat interno" : "Abrir chat interno"}
          title={open ? "Cerrar chat interno" : "Abrir chat interno"}
          position="relative"
          size="lg"
          borderRadius="full"
          bg={unreadCount > 0 ? "red.500" : "yellow.400"}
          color={unreadCount > 0 ? "white" : "black"}
          border="2px solid"
          borderColor={unreadCount > 0 ? "red.300" : "yellow.200"}
          boxShadow="0 8px 24px rgba(0, 0, 0, 0.38)"
          _hover={{ bg: unreadCount > 0 ? "red.400" : "yellow.300", transform: "translateY(-2px)", boxShadow: "0 12px 28px rgba(0, 0, 0, 0.48)" }}
          _active={{ transform: "translateY(0)" }}
          transition="all 160ms ease"
          onClick={() => currentUser ? setOpen((value) => !value) : router.push("/dashboard/chat")}
        >
          <MessageCircle size={23} strokeWidth={2.4} />
        </IconButton>
      </Box>
    </>
  );
}

function FloatingAvatarButton({ currentUser, photoData }: { currentUser?: CurrentUser; photoData?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const username = currentUser?.username || "Usuario";

  return (
    <>
      {open && (
        <Box position="fixed" right={{ base: 3, md: 6 }} bottom={{ base: 24, md: 28 }} zIndex={61} width={{ base: "calc(100vw - 24px)", sm: "290px" }} bg="#151719" border="1px solid" borderColor="yellow.500" borderRadius="xl" p={4} boxShadow="0 18px 48px rgba(0,0,0,0.55)">
          <HStack justify="space-between" mb={3}>
            <HStack gap={2}><Sparkles size={16} color="#facc15" /><Text fontWeight="bold">Mi avatar IA</Text></HStack>
            <Button size="xs" variant="ghost" color="gray.400" onClick={() => setOpen(false)}>Cerrar</Button>
          </HStack>
          <Flex direction="column" align="center" gap={3}>
            <Box width="128px" height="176px" borderRadius="54px 54px 24px 24px" overflow="hidden" bg="transparent" border="1px solid" borderColor="yellow.300" animation="assistantFloat 3.2s ease-in-out infinite">
              {photoData ? (
                <CartoonAvatar username={username} photoData={photoData} config={{ ...DEFAULT_AVATAR_CONFIG, ...(currentUser?.avatar_config ?? {}), mode: "foto", usePhoto: true }} size={176} />
              ) : (
                <ThreeDAvatar config={currentUser?.avatar_config} />
              )}
            </Box>
            <Text textAlign="center" color="gray.300" fontSize="sm">Tu asistente visual está listo. Personalízalo en el módulo IA.</Text>
            <Button size="sm" bg="yellow.400" color="black" onClick={() => router.push("/dashboard/ia")}>Abrir creador IA</Button>
          </Flex>
        </Box>
      )}
      <Button position="fixed" right={{ base: 4, md: 6 }} bottom={{ base: 20, md: 20 }} zIndex={60} width="54px" height="54px" minW="54px" p={0} borderRadius="full" bg="yellow.400" color="black" border="3px solid" borderColor="yellow.200" boxShadow="0 8px 24px rgba(0,0,0,0.45)" aria-label="Abrir avatar IA" title="Abrir avatar IA" onClick={() => setOpen((value) => !value)}>
        <Box width="44px" height="44px" borderRadius="full" overflow="hidden" bg="yellow.300">
          {photoData ? (
            <CartoonAvatar username={username} photoData={photoData} config={{ ...DEFAULT_AVATAR_CONFIG, ...(currentUser?.avatar_config ?? {}), mode: "foto", usePhoto: true }} size={44} />
          ) : (
            <ThreeDAvatar config={currentUser?.avatar_config} />
          )}
        </Box>
      </Button>
    </>
  );
}

export function DashboardLayoutClient({
  children,
  username,
  roleDescription,
  photoData,
  currentUser,
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
  const [mounted, setMounted] = useState(false);

  const activePath = useMemo(() => {
    const candidates = menuSections.flatMap((section) => section.items.map((item) => item.path));
    return (
      candidates
        .sort((a, b) => b.length - a.length)
        .find((path) => pathname === path || pathname.startsWith(`${path}/`)) || ""
    );
  }, [pathname]);

  const canAccessPath = (path: string) => {
    const permission = permissionForPath(path);
    return permission === null || hasModuleAccess(currentUser?.level ?? 1, currentUser?.permissions, permission);
  };

  const hasCurrentRouteAccess = pathname === "/dashboard" || canAccessPath(pathname);

  const filteredSections = useMemo(
    () =>
      menuSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              canAccessPath(item.path) &&
              (item.name.toLowerCase().includes(searchText.toLowerCase()) ||
              item.path.toLowerCase().includes(searchText.toLowerCase()))
          ),
        }))
        .filter((section) => section.items.length > 0),
    [currentUser, searchText]
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
            <SolandLogo />
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
            <UserAvatar src={photoData} name={username} avatarConfig={currentUser?.avatar_config} />
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
          {canAccessPath("/dashboard/personal/nuevo") && <SidebarButton href="/dashboard/personal/nuevo">
            <Plus size={14} />
            <Text>Nuevo personal</Text>
          </SidebarButton>}
          {canAccessPath("/dashboard/vehiculos/nuevo") && <SidebarButton href="/dashboard/vehiculos/nuevo" variant="outline">
            <Plus size={14} />
            <Text>Nuevo vehículo</Text>
          </SidebarButton>}
          {canAccessPath("/dashboard/administracion/companies") && <SidebarButton href="/dashboard/administracion/companies" variant="outline">
            <Plus size={14} />
            <Text>Agregar empresa</Text>
          </SidebarButton>}
          {canAccessPath("/dashboard/tiempo") && <SidebarButton href="/dashboard/tiempo" variant="outline">
            <Plus size={14} />
            <Text>Nueva actividad</Text>
          </SidebarButton>}
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
                ].filter((link) => canAccessPath(link.href)).map((link) => (
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
            {hasCurrentRouteAccess ? children : (
              <Flex minH="55vh" align="center" justify="center" p={6}>
                <Box maxW="md" width="full" bg="#18181b" border="1px solid" borderColor="yellow.700" borderRadius="xl" p={8} textAlign="center">
                  <AlertTriangle size={40} color="#facc15" style={{ margin: "0 auto 16px" }} />
                  <Text fontSize="xl" fontWeight="bold" color="yellow.300">Módulo no autorizado</Text>
                  <Text color="gray.400" mt={2}>Tu perfil no tiene permisos para acceder a este módulo.</Text>
                  <Button mt={6} bg="yellow.400" color="black" onClick={() => router.replace("/dashboard")}>
                    Volver al inicio
                  </Button>
                </Box>
              </Flex>
            )}
          </Box>
        </Flex>
        <FloatingAvatarButton currentUser={currentUser} photoData={photoData} />
        <FloatingChatButton currentUser={currentUser} />
      </Flex>
    </NotificationProvider>
  );
}
