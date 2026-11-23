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
  Leaf,
  Menu,
  LogOut,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
  AlertTriangle,
  DraftingCompass,
  Bell,
  Check,
  CheckCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { NotificationProvider, useNotifications } from "@/context/NotificationContext";
import { ChatInternalClient } from "./chat/ChatInternalClient";
import { hasModuleAccess, permissionForPath } from "@/lib/permissions";
import { AvatarConfig, CartoonAvatar, DEFAULT_AVATAR_CONFIG } from "@/components/CartoonAvatar";
import { ThreeDAvatar } from "@/components/ThreeDAvatar";
import { ColorModeButton } from "@/components/ui/color-mode";

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

function NotificationHeader({ username, showDashboardGreeting }: { username: string; showDashboardGreeting: boolean }) {
  const { notifications, unreadCount, markNotificationAsRead, markAllAsRead } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box position="relative" zIndex={30} px={{ base: 4, md: 6 }} py={4} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="var(--soland-surface-08080a)">
      <Flex justify="space-between" align="center" gap={3}>
        <Box>
          {showDashboardGreeting && (
            <Text fontSize="xs" color="gray.400">
              Bienvenido de vuelta, {username}
            </Text>
          )}
        </Box>
        <HStack gap={2}>
          <ColorModeButton color="yellow.300" _hover={{ bg: "whiteAlpha.100" }} />
          <IconButton
            aria-label={menuOpen ? "Cerrar notificaciones" : "Abrir notificaciones"}
            aria-expanded={menuOpen}
            variant="outline"
            borderColor={unreadCount > 0 ? "red.400" : "whiteAlpha.200"}
            color={unreadCount > 0 ? "red.300" : "var(--soland-text-primary)"}
            position="relative"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={19} /> : <Bell size={19} />}
            {unreadCount > 0 && (
              <Circle
                position="absolute"
                top="-7px"
                right="-7px"
                size="20px"
                bg="red.500"
                color="var(--soland-overlay-text)"
                border="2px solid"
                borderColor="var(--soland-surface-08080a)"
                fontSize="10px"
                fontWeight="bold"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Circle>
            )}
          </IconButton>
        </HStack>
      </Flex>
      {menuOpen && (
        <Box
          position="absolute"
          top="calc(100% - 4px)"
          right={{ base: 3, md: 6 }}
          width={{ base: "calc(100vw - 24px)", sm: "420px" }}
          maxH="min(620px, calc(100vh - 100px))"
          bg="var(--soland-surface-0f1012)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="xl"
          boxShadow="0 18px 50px rgba(0,0,0,0.55)"
          overflow="hidden"
        >
          <Flex px={4} py={3} align="center" justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.100">
            <Box>
              <Text fontWeight="bold">Actividad reciente</Text>
              <Text fontSize="xs" color="gray.500">
                {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
              </Text>
            </Box>
            <Button
              size="xs"
              variant="ghost"
              color="yellow.300"
              disabled={unreadCount === 0}
              onClick={() => void markAllAsRead()}
            >
              <CheckCheck size={15} />
              Marcar todas
            </Button>
          </Flex>
          <Box maxH="520px" overflowY="auto" p={2}>
            {notifications.length === 0 ? (
              <Text px={4} py={8} textAlign="center" color="gray.500" fontSize="sm">
                No tienes notificaciones
              </Text>
            ) : notifications.map((item) => (
              <Flex
                key={item.id}
                gap={3}
                p={3}
                mb={1}
                borderRadius="lg"
                border="1px solid"
                borderColor={item.read ? "transparent" : "whiteAlpha.100"}
                bg={item.read ? "transparent" : "var(--soland-surface-18181b)"}
                opacity={item.read ? 0.72 : 1}
              >
                <Circle size="36px" bg={item.type === "error" ? "red.950" : item.type === "success" ? "green.950" : "yellow.950"} border="1px solid" borderColor={item.type === "error" ? "red.400" : item.type === "success" ? "green.400" : "yellow.400"} flexShrink={0}>
                  <Bell size={16} />
                </Circle>
                <Box flex="1" minW={0}>
                  <Text fontSize="sm" fontWeight="bold" color={item.type === "error" ? "red.300" : item.type === "success" ? "green.300" : "yellow.300"} truncate>
                    {item.title}
                  </Text>
                  <Text mt={1} fontSize="sm" color="gray.200" lineClamp={3}>
                    {item.message}
                  </Text>
                  <Flex mt={2} align="center" justify="space-between" gap={2}>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(item.createdAt).toLocaleString("es-PE")}
                    </Text>
                    {!item.read && (
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        onClick={() => void markNotificationAsRead(item.id)}
                      >
                        <Check size={13} />
                        Leída
                      </Button>
                    )}
                  </Flex>
                </Box>
              </Flex>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
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
    title: "Calidad e ingeniería",
    items: [
      { name: "Calidad", path: "/dashboard/calidad", icon: ClipboardCheck },
      { name: "CAD y planos", path: "/dashboard/cad", icon: DraftingCompass },
    ],
  },
  {
    title: "Administración",
    items: [
      { name: "Administración", path: "/dashboard/administracion", icon: Settings },
      { name: "Documentos", path: "/dashboard/documentos", icon: FileText },
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
    <Flex
      w="full"
      maxW="250px"
      h="72px"
      align="center"
      justify="center"
      border="1px solid"
      borderColor="yellow.400"
      borderRadius="xl"
      bg="#ffffff"
      px={3}
      py={2}
      overflow="hidden"
    >
      {!logoFailed ? (
        <Image src="/LOGODEF.png" alt="Logo de Soland" width="100%" height="100%" objectFit="contain" filter="contrast(1.3)" onError={() => setLogoFailed(true)} />
      ) : (
        <Text color="yellow.400" fontWeight="black" fontSize="2xl" letterSpacing="widest">SOLAND</Text>
      )}
    </Flex>
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
        <Box position="fixed" right={{ base: 3, md: 6 }} bottom={{ base: 24, md: 28 }} zIndex={39} width={{ base: "calc(100vw - 24px)", sm: "420px" }} height={{ base: "min(72vh, 680px)", md: "680px" }} bg="var(--soland-surface-0f1012)" border="1px solid" borderColor="whiteAlpha.200" borderRadius="xl" overflow="hidden" boxShadow="0 18px 50px rgba(0,0,0,0.55)">
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
              color="var(--soland-text-primary)"
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
          color={unreadCount > 0 ? "var(--soland-text-primary)" : "black"}
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
        <Box position="fixed" right={{ base: 18, md: 22 }} bottom={{ base: 144, md: 152 }} zIndex={61} width={{ base: "calc(100vw - 36px)", sm: "290px" }} bg="var(--soland-surface-151719)" border="1px solid" borderColor="yellow.500" borderRadius="xl" p={4} boxShadow="0 18px 48px rgba(0,0,0,0.55)">
          <HStack justify="space-between" mb={3}>
            <HStack gap={2}><Sparkles size={16} color="var(--soland-accent-text)" /><Text fontWeight="bold">Mi avatar IA</Text></HStack>
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
      <Button position="fixed" right={{ base: 18, md: 22 }} bottom={{ base: 76, md: 82 }} zIndex={60} width="54px" height="54px" minW="54px" p={0} borderRadius="full" bg="yellow.400" color="black" border="3px solid" borderColor="yellow.200" boxShadow="0 8px 24px rgba(0,0,0,0.45)" aria-label="Abrir avatar IA" title="Abrir avatar IA" onClick={() => setOpen((value) => !value)}>
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
  const pathname = usePathname();
  const [searchText, setSearchText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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

  const activeSectionTitle = useMemo(
    () => menuSections.find((section) => section.items.some((item) => item.path === activePath))?.title ?? "",
    [activePath]
  );
  const defaultOpenSections = useMemo(
    () => Object.fromEntries(menuSections.map((section) => [section.title, section.title === activeSectionTitle])),
    [activeSectionTitle]
  );
  const [sectionExpansion, setSectionExpansion] = useState<{
    pathname: string;
    open: Record<string, boolean>;
  }>(() => ({ pathname, open: defaultOpenSections }));
  const openSections = sectionExpansion.pathname === pathname ? sectionExpansion.open : defaultOpenSections;

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
  const isSearching = searchText.trim().length > 0;
  const sectionIsExpanded = (sectionTitle: string) => isSearching || Boolean(openSections[sectionTitle]);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  const sidebarContent = (
    <Box bg="var(--soland-surface-0a0a0a)" h="100%" display="flex" flexDirection="column">
      <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
        <SolandLogo />
        <Text mt={2} fontSize="xs" color="gray.500">
          Menú de navegación
        </Text>

        <Box mt={4}>
          <InputGroup startElement={<Box pl={3} color="gray.400"><Search size={16} /></Box>}>
            <Input
              placeholder="Buscar ruta..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              bg="whiteAlpha.50"
              borderColor="whiteAlpha.200"
              color="var(--soland-text-primary)"
              _placeholder={{ color: "gray.500" }}
            />
          </InputGroup>
        </Box>
      </Box>

      <Box flex="1" overflowY="auto" px={3} py={4} css={{
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": { background: "var(--soland-surface-333)", borderRadius: "999px" },
      }}>
        <VStack align="stretch" gap={3}>
          {filteredSections.map((section) => (
            <Box key={section.title}>
              <HStack justify="space-between" mb={1} px={1}>
                <Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="gray.500">
                  {section.title}
                </Text>
                <Button
                  aria-label={`Alternar ${section.title}`}
                  aria-expanded={sectionIsExpanded(section.title)}
                  size="sm"
                  variant="ghost"
                  color="gray.400"
                  disabled={isSearching}
                  onClick={() => setSectionExpansion({
                    pathname,
                    open: { ...openSections, [section.title]: !openSections[section.title] },
                  })}
                >
                  {sectionIsExpanded(section.title) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </HStack>

              {sectionIsExpanded(section.title) && (
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
                        color={isActive ? "var(--soland-accent-text)" : "gray.300"}
                        borderLeft="2px solid"
                        borderLeftColor={isActive ? "yellow.400" : "transparent"}
                        _hover={{ bg: "whiteAlpha.150", color: "var(--soland-text-primary)" }}
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
          <Box mt={2} pt={4} borderTop="1px solid" borderColor="whiteAlpha.100">
            <Button
              w="full"
              h="auto"
              p={2}
              mb={profileMenuOpen ? 2 : 0}
              variant="ghost"
              justifyContent="space-between"
              color="var(--soland-text-primary)"
              aria-expanded={profileMenuOpen}
              aria-controls="sidebar-profile-menu"
              onClick={() => setProfileMenuOpen((open) => !open)}
              _hover={{ bg: "whiteAlpha.100" }}
            >
              <HStack gap={3} minW={0}>
                <UserAvatar src={photoData} name={username} avatarConfig={currentUser?.avatar_config} />
                <Box minW={0} textAlign="left">
                  <Text fontWeight="bold" fontSize="sm" truncate>
                    {username}
                  </Text>
                  <Text fontSize="xs" color="gray.400" truncate>
                    {roleDescription}
                  </Text>
                </Box>
              </HStack>
              {profileMenuOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </Button>
            <Box
              id="sidebar-profile-menu"
              hidden={!profileMenuOpen}
              mb={profileMenuOpen ? 3 : 0}
              p={3}
              borderRadius="lg"
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              <HStack gap={2} mb={2}>
                <Badge colorScheme="green" variant="subtle">Activo</Badge>
                <Text fontSize="xs" color="gray.400">Sesión iniciada</Text>
              </HStack>
              {canAccessPath("/dashboard/configuracion") && (
                <Link
                  as={NextLink}
                  href="/dashboard/configuracion"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  px={2}
                  py={2}
                  borderRadius="md"
                  color="gray.200"
                  fontSize="sm"
                  _hover={{ bg: "whiteAlpha.100", color: "var(--soland-text-primary)", textDecoration: "none" }}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setDrawerOpen(false);
                  }}
                >
                  <Settings size={15} />
                  <Text>Mi perfil y configuración</Text>
                </Link>
              )}
            </Box>
          </Box>
          <Button
            w="full"
            mt={3}
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
          <Text fontSize="xs" color="gray.500">
            Usa el buscador o expande secciones para encontrar rutas rápido.
          </Text>
        </VStack>
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
      <Flex suppressHydrationWarning minH="100vh" bg="var(--soland-surface-08080a)" color="var(--soland-text-primary)" flexDirection="column">
        <Box display={{ base: "flex", md: "none" }} alignItems="center" justifyContent="space-between" px={4} py={3} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="var(--soland-surface-0b0b0b)">
          <HStack gap={3}>
            <IconButton
              aria-label="Abrir menú"
              size="md"
              variant="ghost"
              color="var(--soland-text-primary)"
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
              <Box width="80vw" maxW="320px" height="100%" bg="var(--soland-surface-0a0a0a)" boxShadow="lg">
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
            <NotificationHeader username={username} showDashboardGreeting={pathname === "/dashboard"} />
          <Box px={6} py={4} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="var(--soland-surface-08080a)">
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
                <Box maxW="md" width="full" bg="var(--soland-surface-18181b)" border="1px solid" borderColor="yellow.700" borderRadius="xl" p={8} textAlign="center">
                  <AlertTriangle size={40} color="var(--soland-accent-text)" style={{ margin: "0 auto 16px" }} />
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
