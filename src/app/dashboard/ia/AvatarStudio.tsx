"use client";

import { useState } from "react";
import { Box, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { Check, RotateCcw, Save, Sparkles } from "lucide-react";
import { AvatarConfig, CartoonAvatar, DEFAULT_AVATAR_CONFIG } from "@/components/CartoonAvatar";
import { saveAvatarConfig } from "@/actions/avatar";

type AvatarStudioProps = {
  username: string;
  photoData?: string | null;
  userId: string;
  initialConfig?: AvatarConfig | null;
};

const choices = {
  skin: [
    ["#f5c6a5", "Claro"],
    ["#d99568", "Medio"],
    ["#8d5524", "Oscuro"],
  ],
  hair: [
    ["#251b16", "Castaño"],
    ["#111827", "Negro"],
    ["#d97706", "Dorado"],
    ["#be185d", "Colorido"],
  ],
  hairStyle: [["corto", "Corto"], ["largo", "Largo"], ["rizado", "Rizado"], ["bob", "Bob"], ["bun", "Moño"], ["curly", "Afro"]],
  eyes: [["redondos", "Redondos"], ["grandes", "Grandes"], ["felices", "Felices"], ["cerrados", "Cerrados"], ["sorprendidos", "Sorpresa"]],
  nose: [["suave", "Suave"], ["pequena", "Pequeña"], ["ancha", "Ancha"]],
  face: [["amigable", "Amigable"], ["serena", "Serena"], ["alegre", "Alegre"], ["seria", "Seria"]],
  outfit: [["camisa", "Camisa"], ["chaqueta", "Chaqueta"], ["sudadera", "Sudadera"], ["overall", "Overall"], ["grafica", "Gráfica"]],
  accessory: [["ninguno", "Sin accesorio"], ["gafas", "Gafas"], ["gafasRedondas", "Redondas"], ["sol", "Sol"], ["parche", "Parche"]],
  hat: [["ninguno", "Sin sombrero"], ["gorra", "Gorra"], ["invierno", "Invierno"], ["turbante", "Turbante"], ["hijab", "Hijab"]],
  facialHair: [["ninguna", "Sin barba"], ["barba", "Barba"], ["barbaLarga", "Barba larga"], ["bigote", "Bigote"]],
} as const;

type ChoiceKey = keyof typeof choices;

export function AvatarStudio({ username, photoData, userId, initialConfig }: AvatarStudioProps) {
  const [config, setConfig] = useState<AvatarConfig>(() => ({ ...DEFAULT_AVATAR_CONFIG, ...initialConfig, usePhoto: false }));
  const [activeFeature, setActiveFeature] = useState<ChoiceKey>("hairStyle");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const updateChoice = (key: ChoiceKey, value: string) => {
    setSaved(false);
    setConfig((current) => ({ ...current, [key]: value, usePhoto: false }));
  };

  const saveAvatar = async () => {
    setSaveError("");
    window.localStorage.setItem(`soland-avatar-${username}`, JSON.stringify(config));
    window.dispatchEvent(new Event("soland-avatar-updated"));
    const result = await saveAvatarConfig(userId, config);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    setSaved(true);
  };

  const resetAvatar = () => {
    setConfig({ ...DEFAULT_AVATAR_CONFIG, usePhoto: false });
    setSaved(false);
  };

  const chooseGender = (gender: AvatarConfig["gender"]) => {
    setSaved(false);
    setConfig((current) => ({ ...current, gender, usePhoto: false }));
  };

  const chooseMode = (mode: AvatarConfig["mode"]) => {
    setSaved(false);
    setConfig((current) => ({ ...current, mode, usePhoto: mode !== "crear" }));
  };

  const updateColor = (key: "skin" | "hair", value: string) => {
    setSaved(false);
    setConfig((current) => ({ ...current, [key]: value, mode: "crear", usePhoto: false }));
  };

  return (
    <Box mb={6} p={{ base: 4, md: 5 }} bg="#111315" border="1px solid" borderColor="whiteAlpha.200" borderRadius="2xl">
      <Flex direction={{ base: "column", md: "row" }} gap={6} align={{ base: "center", md: "start" }}>
        <VStack gap={3} minW="180px">
          <HStack gap={2} color="yellow.300"><Sparkles size={17} /><Text fontWeight="bold">Creador de avatar</Text></HStack>
          <Box width="150px" height="150px" borderRadius="full" overflow="hidden" bg="yellow.400" border="3px solid" borderColor="yellow.300" boxShadow="0 0 0 8px rgba(250,204,21,0.08)">
            <CartoonAvatar username={username} photoData={photoData} config={config} size={180} />
          </Box>
          <Text color="gray.500" fontSize="xs" textAlign="center">Diseña tu personaje desde cero.</Text>
        </VStack>

        <Box flex="1" width="full">
          <Text color="gray.400" fontSize="sm" mb={4}>Construye tu personaje con imágenes y guárdalo para usarlo en todo el sistema.</Text>
          <Text color="gray.400" fontSize="xs" mb={2}>Modo de avatar</Text>
          <HStack gap={3} mb={5} flexWrap="wrap">
            {(["crear", "foto", "cartoon"] as const).map((mode) => (
              <Box key={mode} as="button" title={mode === "crear" ? "Crear desde cero" : mode === "foto" ? "Usar foto de perfil" : "Convertir foto en cartoon"} aria-label={mode} width="112px" height="80px" borderRadius="xl" overflow="hidden" border="2px solid" borderColor={config.mode === mode ? "yellow.300" : "whiteAlpha.200"} bg={config.mode === mode ? "yellow.400" : "#0b0d0e"} onClick={() => chooseMode(mode)}>
                <Box width="52px" height="52px" mx="auto" mt={2} borderRadius="full" overflow="hidden" bg="yellow.400">
                  <CartoonAvatar username={username} photoData={photoData} config={{ ...config, mode, usePhoto: mode !== "crear" }} size={80} />
                </Box>
                <Text fontSize="10px" color={config.mode === mode ? "black" : "gray.400"}>{mode === "crear" ? "Desde cero" : mode === "foto" ? "Mi foto" : "Foto cartoon"}</Text>
              </Box>
            ))}
          </HStack>
          <Text color="gray.400" fontSize="xs" mb={2}>Personaje</Text>
          <HStack gap={3} mb={5}>
            {(["hombre", "mujer"] as const).map((gender) => (
              <Box
                key={gender}
                as="button"
                title={gender === "hombre" ? "Elegir personaje masculino" : "Elegir personaje femenino"}
                aria-label={gender === "hombre" ? "Elegir personaje masculino" : "Elegir personaje femenino"}
                width="76px"
                height="76px"
                borderRadius="xl"
                overflow="hidden"
                border="2px solid"
                borderColor={config.gender === gender ? "yellow.300" : "whiteAlpha.200"}
                bg={config.gender === gender ? "yellow.400" : "#0b0d0e"}
                boxShadow={config.gender === gender ? "0 0 0 3px rgba(250,204,21,0.18)" : "none"}
                onClick={() => chooseGender(gender)}
              >
                <CartoonAvatar username={gender} config={{ ...config, gender }} size={100} />
              </Box>
            ))}
          </HStack>
          <HStack gap={2} flexWrap="wrap" mb={3}>
            {(["hairStyle", "hair", "eyes", "face", "nose", "skin", "outfit", "accessory", "hat", "facialHair"] as ChoiceKey[]).map((feature) => (
              <Button key={feature} size="sm" variant={activeFeature === feature ? "solid" : "outline"} bg={activeFeature === feature ? "yellow.400" : undefined} color={activeFeature === feature ? "black" : "gray.300"} borderColor="whiteAlpha.200" onClick={() => setActiveFeature(feature)}>
                {feature === "hairStyle" ? "Cabello" : feature === "hair" ? "Color" : feature === "eyes" ? "Ojos" : feature === "face" ? "Cara" : feature === "nose" ? "Nariz" : feature === "skin" ? "Piel" : feature === "accessory" ? "Gafas" : feature === "hat" ? "Sombreros" : feature === "facialHair" ? "Barba" : "Ropa"}
              </Button>
            ))}
          </HStack>
          <Flex gap={3} overflowX="auto" pb={2} mb={4}>
            {choices[activeFeature].map(([value, label]) => (
              <Box key={value} as="button" minW="86px" height="92px" borderRadius="lg" overflow="hidden" border="2px solid" borderColor={String(config[activeFeature]) === value ? "yellow.300" : "whiteAlpha.100"} bg={String(config[activeFeature]) === value ? "yellow.400" : "#0b0d0e"} onClick={() => updateChoice(activeFeature, value)} title={label}>
                <Box width="64px" height="64px" mx="auto" mt={1} borderRadius="full" overflow="hidden" bg="yellow.400">
                  <CartoonAvatar username={label} config={{ ...config, [activeFeature]: value, usePhoto: false }} size={90} />
                </Box>
                <Text fontSize="10px" color={String(config[activeFeature]) === value ? "black" : "gray.400"} mt={1}>{label}</Text>
              </Box>
            ))}
          </Flex>
          <HStack gap={4} mb={4} flexWrap="wrap">
            <HStack gap={2}>
              <Text fontSize="xs" color="gray.400">Piel</Text>
              <input type="color" value={config.skin} onChange={(event) => updateColor("skin", event.target.value)} title="Color personalizado de piel" style={{ width: "34px", height: "28px", border: 0, background: "transparent", cursor: "pointer" }} />
            </HStack>
            <HStack gap={2}>
              <Text fontSize="xs" color="gray.400">Cabello</Text>
              <input type="color" value={config.hair} onChange={(event) => updateColor("hair", event.target.value)} title="Color personalizado de cabello" style={{ width: "34px", height: "28px", border: 0, background: "transparent", cursor: "pointer" }} />
            </HStack>
          </HStack>
          <HStack mt={5} gap={3} flexWrap="wrap">
            <Button size="sm" bg="yellow.400" color="black" onClick={saveAvatar}><HStack gap={2}><Save size={15} /><Text>Guardar avatar</Text></HStack></Button>
            <Button size="sm" variant="outline" color="gray.200" onClick={resetAvatar}><HStack gap={2}><RotateCcw size={15} /><Text>Restablecer</Text></HStack></Button>
            {saved && <HStack color="green.300" fontSize="sm"><Check size={15} /><Text>Avatar guardado en tu sistema</Text></HStack>}
            {saveError && <Text color="red.300" fontSize="sm">{saveError}</Text>}
          </HStack>
        </Box>
      </Flex>
    </Box>
  );
}
