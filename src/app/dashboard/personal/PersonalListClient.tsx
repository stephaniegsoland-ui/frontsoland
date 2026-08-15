"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Grid,
  HStack,
  Badge,
  VStack,
  IconButton,
} from "@chakra-ui/react";
import {
  Search,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  User,
  Edit,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deletePersonalAction } from "@/actions/personal";

interface UserRead {
  id: string;
  username: string;
  email: string;
  level: number | boolean;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}

interface PersonalListClientProps {
  initialUsers: UserRead[];
}

export function PersonalListClient({ initialUsers }: PersonalListClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = initialUsers.length;
    const active = initialUsers.filter((user) => Boolean(user.is_active)).length;
    const inactive = total - active;
    const admins = initialUsers.filter((user) => Number(user.level) === 1).length;
    const supervisors = initialUsers.filter((user) => Number(user.level) === 2).length;
    const operators = initialUsers.filter((user) => Number(user.level) === 3).length;

    return { total, active, inactive, admins, supervisors, operators };
  }, [initialUsers]);

  // Filtrado reactivo con datos reales
  const filteredUsers = initialUsers.filter((user) => {
    const term = searchTerm.toLowerCase();
    const username = user.username || "";
    const email = user.email || "";
    
    const matchesSearch = 
      username.toLowerCase().includes(term) || 
      email.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (roleFilter === "todos") return true;
    
    const userLevelStr = String(user.level || 3); 
    return userLevelStr === roleFilter;
  });

  // Manejador del borrado/desactivación
  const handleDelete = async (userId: string, username: string) => {
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${username}" del sistema?`);
    if (!confirmar) return;

    setIsDeletingId(userId);
    const res = await deletePersonalAction(userId);
    setIsDeletingId(null);

    if (res?.error) {
      alert(res.error);
      return;
    }

    alert("Personal eliminado con éxito.");
    router.refresh();
  };

  const getRoleBadge = (rawLevel: any) => {
    const level = Number(rawLevel) || 3;
    switch (level) {
      case 1:
        return (
          <Badge bg="red.500/20" color="red.400" border="1px solid" borderColor="red.500/50" px={2} py={1} borderRadius="md" display="flex" alignItems="center" gap={1} w="fit-content">
            <ShieldAlert size={12} /> Nivel 1 - Admin
          </Badge>
        );
      case 2:
        return (
          <Badge bg="blue.500/20" color="blue.400" border="1px solid" borderColor="blue.500/50" px={2} py={1} borderRadius="md" display="flex" alignItems="center" gap={1} w="fit-content">
            <ShieldCheck size={12} /> Nivel 2 - Superv.
          </Badge>
        );
      case 3:
      default:
        return (
          <Badge bg="green.500/20" color="green.400" border="1px solid" borderColor="green.500/50" px={2} py={1} borderRadius="md" display="flex" alignItems="center" gap={1} w="fit-content">
            <User size={12} /> Nivel 3 - Operador
          </Badge>
        );
    }
  };

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      {/* ================= HEADER ================= */}
      <Flex justify="space-between" align="center" mb={8} wrap={{ base: "wrap", md: "nowrap" }}>
        <HStack gap={3} mb={{ base: 4, md: 0 }}>
          <Users color="#eab308" size={28} />
          <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
            Gestión de Personal
          </Text>
        </HStack>
        <Button asChild bg="yellow.400" color="black" fontWeight="bold" _hover={{ bg: "yellow.500" }} display="flex" gap={2}>
          <Link href="/dashboard/personal/nuevo">
            <UserPlus size={18} /> Nuevo Registro
          </Link>
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
        <Box bg="#141418" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={4}>
          <Text fontSize="xs" color="gray.400" textTransform="uppercase" mb={2}>
            Total de usuarios
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="white">{stats.total}</Text>
        </Box>
        <Box bg="#141418" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={4}>
          <Text fontSize="xs" color="gray.400" textTransform="uppercase" mb={2}>
            Usuarios activos
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="green.300">{stats.active}</Text>
        </Box>
        <Box bg="#141418" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={4}>
          <Text fontSize="xs" color="gray.400" textTransform="uppercase" mb={2}>
            Inactivos
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="red.300">{stats.inactive}</Text>
        </Box>
        <Box bg="#141418" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={4}>
          <Text fontSize="xs" color="gray.400" textTransform="uppercase" mb={2}>
            Admines / Supervisores
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="yellow.300">
            {stats.admins} / {stats.supervisors}
          </Text>
          <Text fontSize="xs" color="gray.500">Operadores: {stats.operators}</Text>
        </Box>
      </Grid>

      {/* ================= BARRA DE BÚSQUEDA Y FILTROS ================= */}
      <Flex bg="#18181b" p={4} borderRadius="xl" border="1px solid" borderColor="yellow.600" mb={6} gap={4} align="center" wrap={{ base: "wrap", md: "nowrap" }}>
        <Box position="relative" flex={1}>
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="yellow.400">
            <Search size={18} />
          </Box>
          <Input 
            placeholder="Buscar por usuario o correo electrónico..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            pl={10} bg="black" border="1px solid" borderColor="whiteAlpha.300" _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }} 
          />
        </Box>

        <Box w={{ base: "100%", md: "200px" }}>
          <select 
            value={roleFilter} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)} 
            style={{ background: "black", color: "#cbd5e1", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.24)", width: "100%", fontSize: "14px", outline: "none", cursor: "pointer" }}
          >
            <option value="todos" style={{ background: "#18181b" }}>Todos los Niveles</option>
            <option value="1" style={{ background: "#18181b" }}>Nivel 1 - Administrador</option>
            <option value="2" style={{ background: "#18181b" }}>Nivel 2 - Supervisor</option>
            <option value="3" style={{ background: "#18181b" }}>Nivel 3 - Operador</option>
          </select>
        </Box>
      </Flex>

      {/* ================= TABLA DE USUARIOS REALES ================= */}
      <Box bg="#18181b" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200" overflow="hidden" boxShadow="0 10px 30px rgba(0,0,0,0.2)">
        <Grid templateColumns="1.5fr 2fr 1.5fr 1fr 1fr" px={6} py={4} bg="#27272a" borderBottom="1px solid" borderColor="whiteAlpha.200">
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Usuario</Text>
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Correo Electrónico</Text>
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Nivel de Autorización</Text>
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Estado</Text>
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" textAlign="center">Acciones</Text>
        </Grid>

        <VStack align="stretch" gap={0}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <Grid key={user.id} templateColumns="1.5fr 2fr 1.5fr 1fr 1fr" px={6} py={4} bg="black" borderBottom={index === filteredUsers.length - 1 ? "none" : "1px solid"} borderColor="whiteAlpha.100" alignItems="center" _hover={{ bg: "whiteAlpha.50" }} transition="background 0.2s">
                
                <HStack gap={3}>
                  <Flex align="center" justify="center" w={8} h={8} borderRadius="full" bg="whiteAlpha.100" border="1px solid" borderColor="yellow.600">
                    <Text fontWeight="bold" fontSize="xs" color="yellow.400">
                      {user.username ? user.username.substring(0, 2).toUpperCase() : "US"}
                    </Text>
                  </Flex>
                  <Text fontWeight="bold" color="white" fontSize="sm">{user.username}</Text>
                </HStack>

                <Box><Text color="gray.300" fontSize="sm">{user.email}</Text></Box>

                <Box>{getRoleBadge(user.level)}</Box>

                <Box>
                  <Badge bg={user.is_active ? "green.500" : "whiteAlpha.400"} color="white" variant="solid" px={2} borderRadius="sm" fontSize="2xs">
                    {user.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </Box>

                <Flex justify="center" gap={2}>
                  {/* Conexión directa a la pantalla de Editar mediante la ruta dinámica con ID */}
                  <Button asChild size="sm" variant="ghost" color="gray.400" _hover={{ color: "yellow.400", bg: "whiteAlpha.200" }} px={2} title="Editar Usuario">
                    <Link href={`/dashboard/personal/editar/${user.id}`}>
                      <Edit size={16} />
                    </Link>
                  </Button>
                  
                  {/* Conexión directa a la mutación DELETE */}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    color="gray.400" 
                    _hover={{ color: "red.400", bg: "red.500/10" }} 
                    px={2} 
                    title="Eliminar Registro"
                    onClick={() => handleDelete(user.id, user.username)}
                    loading={isDeletingId === user.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                </Flex>
              </Grid>
            ))
          ) : (
            <Box textAlign="center" py={12} bg="black">
              <Text color="gray.500" fontSize="sm">No hay personal registrado que coincida con la búsqueda.</Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
}