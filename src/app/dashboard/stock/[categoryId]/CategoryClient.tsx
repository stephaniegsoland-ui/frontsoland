"use client";

import { useState, useActionState } from "react";
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Input, 
  VStack, 
  HStack, 
  Grid,
} from "@chakra-ui/react";
import { ArrowLeft, Search, Plus, Trash2, List } from "lucide-react";
import Link from "next/link";
import { createItemAction } from "@/actions/inventario"; 

// 1. Actualizamos la interfaz EXACTAMENTE como responde tu API
interface ItemRead {
  id: string | number; // Soporta UUIDs
  name: string;
  quantity: number;    // Cambio de 'cantidad' a 'quantity'
  attribute: Record<string, unknown>; // Diccionario de atributos
  category_id: number;
}

interface CategoryClientProps {
  categoryId: number;
  categoryName: string;
  items: ItemRead[];
}

export function CategoryClient({ categoryId, categoryName, items }: CategoryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [state, formAction, isPending] = useActionState(createItemAction, null);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);

  const addAttribute = () => setAttributes([...attributes, { key: "", value: "" }]);
  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };
  const updateAttribute = (index: number, field: 'key' | 'value', val: string) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = val;
    setAttributes(newAttrs);
  };

  // 2. Buscador reactivo mejorado para buscar dentro del diccionario de atributos
  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    if (item.name.toLowerCase().includes(term)) return true;
    
    // Buscar dentro de los valores de los atributos
    if (item.attribute) {
      return Object.values(item.attribute).some(val => 
        String(val).toLowerCase().includes(term)
      );
    }
    return false;
  });

  return (
    <Box p={6} bg="#08080a" minH="100vh" color="white">
      {/* ================= HEADER ================= */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={4}>
          <Button 
            asChild
            variant="ghost" 
            color="gray.400" 
            _hover={{ color: "yellow.400", bg: "whiteAlpha.100" }}
            px={2}
          >
            <Link href="/dashboard/stock">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Gestión de <Text as="span" color="yellow.400">{categoryName}</Text>
          </Text>
        </HStack>
        
        <Box bg="#18181b" px={3} py={1} borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
          <Text fontSize="sm" color="gray.400">
            Total ítems: <Text as="span" color="white" fontWeight="bold">{items.length}</Text>
          </Text>
        </Box>
      </Flex>

      <Grid templateColumns={{ base: "1fr", lg: "1fr" }} gap={8}>
        {/* ================= SECCIÓN 1: FORMULARIO ================= */}
        <Box bg="#18181b" p={6} borderRadius="xl" border="1px solid" borderColor="yellow.600" boxShadow="0 4px 20px rgba(0,0,0,0.2)">
          <Text color="yellow.400" fontWeight="bold" fontSize="lg" mb={4}>
            Agregar Nuevo Ítem
          </Text>
          
          <form action={formAction}>
            <input type="hidden" name="category_id" value={categoryId} />
            
            <VStack gap={4} align="stretch">
              <Input 
                name="name"
                placeholder="Nombre del suministro (Ej: Martillo)" 
                bg="black" border="1px solid" borderColor="whiteAlpha.200" _focus={{ borderColor: "yellow.400" }} required 
              />
              
              <Grid templateColumns={{ base: "1fr", md: "1fr 3fr" }} gap={4}>
                <Input 
                  name="quantity"
                  type="number"
                  placeholder="Cant. (Ej: 25)" 
                  bg="black" border="1px solid" borderColor="whiteAlpha.200" _focus={{ borderColor: "yellow.400" }} required 
                />
                <Input 
                  name="observacion"
                  placeholder="Observación (Ej: Martillos de diferentes tamaños)" 
                  bg="black" border="1px solid" borderColor="whiteAlpha.200" _focus={{ borderColor: "yellow.400" }}
                />
              </Grid>

              <Box border="1px dashed" borderColor="whiteAlpha.300" p={4} borderRadius="md" bg="blackAlpha.300">
                <Text color="gray.400" fontSize="sm" mb={3} fontWeight="bold">
                  Atributos Personalizados (Opcional)
                </Text>
                
                {attributes.map((attr, idx) => (
                  <Flex gap={2} mb={2} key={idx} align="center">
                    <Input 
                      name="attr_keys"
                      placeholder="Propiedad (Ej: marca)" 
                      value={attr.key} 
                      onChange={(e) => updateAttribute(idx, 'key', e.target.value)} 
                      bg="black" size="sm" border="1px solid" borderColor="whiteAlpha.200"
                    />
                    <Input 
                      name="attr_values"
                      placeholder="Valor (Ej: Stanley)" 
                      value={attr.value} 
                      onChange={(e) => updateAttribute(idx, 'value', e.target.value)} 
                      bg="black" size="sm" border="1px solid" borderColor="whiteAlpha.200"
                    />
                    <Button type="button" onClick={() => removeAttribute(idx)} variant="ghost" size="sm" color="red.400" px={2}>
                      <Trash2 size={16} />
                    </Button>
                  </Flex>
                ))}

                <Button type="button" onClick={addAttribute} size="xs" variant="ghost" color="yellow.400" mt={1}>
                  <Plus size={14} style={{ marginRight: '4px' }}/> Añadir propiedad
                </Button>
              </Box>

              {state?.error && <Text color="red.400" fontSize="sm">{state.error}</Text>}
              {state?.success && <Text color="green.400" fontSize="sm">Registrado con éxito.</Text>}

              <Button type="submit" w="full" bg="whiteAlpha.200" color="white" _hover={{ bg: "yellow.400", color: "black" }} mt={2} loading={isPending} display="flex" gap={2}>
                <Plus size={18} /> Registrar Ingreso
              </Button>
            </VStack>
          </form>
        </Box>

        {/* ================= SECCIÓN 2: LISTA DE SUMINISTROS ================= */}
        <Box bg="#18181b" p={6} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200">
          <Flex justify="space-between" align="center" mb={4}>
            <HStack gap={2}>
              <List color="#eab308" size={20} />
              <Text color="yellow.400" fontWeight="bold" fontSize="lg">
                Inventario Actual
              </Text>
            </HStack>
          </Flex>

          <Box position="relative" mb={6}>
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="yellow.400">
              <Search size={18} />
            </Box>
            <Input 
              placeholder="Buscar por nombre, marca u observaciones..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              pl={10} 
              bg="black" 
              border="1px solid"
              borderColor="yellow.600"
              _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #eab308" }}
            />
          </Box>

          <Grid templateColumns="2fr 1fr 3fr" px={4} py={3} bg="#27272a" borderRadius="md" mb={2}>
            <Text fontSize="sm" fontWeight="bold" color="gray.400">Ítem y Atributos</Text>
            <Text fontSize="sm" fontWeight="bold" color="gray.400">Cantidad</Text>
            <Text fontSize="sm" fontWeight="bold" color="gray.400">Observaciones</Text>
          </Grid>

          <VStack align="stretch" gap={2}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                // Separar observaciones de los otros atributos para renderizarlos distinto
                const obs = item.attribute?.observaciones || item.attribute?.observacion || "-";
                
                return (
                  <Grid 
                    key={item.id}
                    templateColumns="2fr 1fr 3fr" 
                    px={4} 
                    py={3} 
                    bg="black" 
                    borderRadius="md"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    alignItems="start"
                    _hover={{ borderColor: "whiteAlpha.300" }}
                  >
                    <Box>
                      <Text fontWeight="medium" color="white">{item.name}</Text>
                      {/* 3. Renderizamos las "etiquetas" (badges) de los atributos dinámicos */}
                      {item.attribute && (
                        <Flex flexWrap="wrap" gap={2} mt={2}>
                          {Object.entries(item.attribute)
                            .filter(([k]) => k.toLowerCase() !== 'observaciones' && k.toLowerCase() !== 'observacion')
                            .map(([key, value]) => (
                              <Box key={key} bg="whiteAlpha.200" px={2} py={0.5} borderRadius="sm" border="1px solid" borderColor="whiteAlpha.300">
                                <Text fontSize="xs" color="gray.300">
                                  <Text as="span" color="gray.500" textTransform="capitalize">{key}: </Text>
                                  {String(value)}
                                </Text>
                              </Box>
                            ))}
                        </Flex>
                      )}
                    </Box>
                    
                    {/* Leemos de 'quantity' */}
                    <Text color="green.400" fontWeight="bold" fontFamily="mono" mt={0.5}>{item.quantity}</Text>
                    
                    {/* Leemos la observación del diccionario */}
                    <Text color="gray.500" fontSize="sm" mt={0.5} truncate>{String(obs)}</Text>
                  </Grid>
                );
              })
            ) : (
              <Box textAlign="center" py={10}>
                <Text color="gray.500">No se encontraron ítems.</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </Grid>
    </Box>
  );
}