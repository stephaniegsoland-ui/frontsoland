"use client";

import { useEffect, useState } from "react";
import { Box, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { Check, Glasses, ImageIcon, RotateCcw, Save, ScanFace, Shirt, Sparkles, UserRound, X } from "lucide-react";
import { AvatarConfig, CartoonAvatar, DEFAULT_AVATAR_CONFIG } from "@/components/CartoonAvatar";
import { ThreeDAvatar } from "@/components/ThreeDAvatar";
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
  hairStyle: [["corto", "Corto"], ["largo", "Largo"], ["rizado", "Rizado"], ["bob", "Bob"], ["bun", "Moño"], ["cola", "Cola recogida"], ["curly", "Afro"]],
  eyes: [["redondos", "Redondos"], ["grandes", "Grandes"], ["felices", "Felices"], ["cerrados", "Cerrados"], ["sorprendidos", "Sorpresa"]],
  nose: [["suave", "Suave"], ["pequena", "Pequeña"], ["ancha", "Ancha"]],
  face: [["amigable", "Amigable"], ["serena", "Serena"], ["alegre", "Alegre"], ["seria", "Seria"]],
  outfit: [["camisa", "Camisa"], ["chaqueta", "Chaqueta"], ["sudadera", "Sudadera"], ["overall", "Overall"], ["grafica", "Gráfica"]],
  accessory: [["ninguno", "Sin accesorio"], ["gafas", "Gafas"], ["gafasRedondas", "Redondas"], ["sol", "Sol"], ["parche", "Parche"]],
  hat: [["ninguno", "Sin sombrero"], ["gorra", "Gorra"], ["invierno", "Invierno"], ["turbante", "Turbante"], ["hijab", "Hijab"]],
  facialHair: [["ninguna", "Sin barba"], ["barba", "Barba"], ["barbaLarga", "Barba larga"], ["bigote", "Bigote"]],
} as const;

type ChoiceKey = keyof typeof choices;
const featureGroups = [
  { key: "cabeza", label: "Cabeza", features: ["hairStyle", "hair", "hat"] as ChoiceKey[] },
  { key: "rostro", label: "Rostro", features: ["eyes", "face", "nose", "facialHair"] as ChoiceKey[] },
  { key: "cuerpo", label: "Cuerpo", features: ["skin", "outfit"] as ChoiceKey[] },
  { key: "accesorios", label: "Accesorios", features: ["accessory"] as ChoiceKey[] },
] as const;
type FeatureGroupKey = (typeof featureGroups)[number]["key"];

const presets = [
  { key: "operador", label: "Operador", config: { gender: "hombre", hairStyle: "corto", outfit: "chaqueta", face: "serena" } },
  { key: "lider", label: "Líder", config: { gender: "mujer", hairStyle: "largo", outfit: "chaqueta", face: "amigable" } },
  { key: "campo", label: "Campo", config: { gender: "hombre", hairStyle: "rizado", outfit: "overall", face: "serena" } },
  { key: "creativa", label: "Creativa", config: { gender: "mujer", hairStyle: "cola", outfit: "grafica", face: "alegre" } },
  { key: "casual", label: "Casual", config: { gender: "mujer", hairStyle: "bob", outfit: "sudadera", face: "amigable" } },
  { key: "seguridad", label: "Seguridad", config: { gender: "hombre", hairStyle: "corto", outfit: "overall", accessory: "gafas", face: "seria" } },
] as const;

type Preset = (typeof presets)[number];

export function AvatarStudio({ username, photoData, userId, initialConfig }: AvatarStudioProps) {
  const [config, setConfig] = useState<AvatarConfig>(() => ({ ...DEFAULT_AVATAR_CONFIG, ...initialConfig, usePhoto: false }));
  const [activeFeature, setActiveFeature] = useState<ChoiceKey>("hairStyle");
  const [activeGroup, setActiveGroup] = useState<FeatureGroupKey>("cabeza");
  const [activePreset, setActivePreset] = useState("");
  const [pose, setPose] = useState<"dePie" | "sentado" | "saludo" | "cuerpoEntero">("dePie");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [readyPlayerMeOpen, setReadyPlayerMeOpen] = useState(false);

  useEffect(() => {
    const handleAvatarExport = (event: MessageEvent) => {
      if (event.origin !== "https://demo.readyplayer.me") return;
      let message: { eventName?: string; data?: { url?: string } };
      try {
        message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      const avatarUrl = message?.data?.url;
      if (message?.eventName !== "v1.avatar.exported" || !avatarUrl) return;
      setSaved(false);
      setConfig((current) => ({ ...current, readyPlayerMeUrl: avatarUrl, mode: "crear", usePhoto: false }));
      setReadyPlayerMeOpen(false);
    };
    window.addEventListener("message", handleAvatarExport);
    return () => window.removeEventListener("message", handleAvatarExport);
  }, []);

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

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.key);
    setSaved(false);
    setConfig((current) => ({ ...current, ...preset.config, usePhoto: false, mode: "crear" }));
  };

  const renderChoices = (feature: ChoiceKey, compact = false) => (
    <Flex gap={2} flexWrap="wrap" maxH={compact ? "148px" : undefined} overflowY={compact ? "auto" : undefined}>
      {choices[feature].map(([value, label]) => (
        <Box key={value} as="button" width={compact ? "58px" : "72px"} height={compact ? "62px" : "76px"} borderRadius="9px" overflow="hidden" border="2px solid" borderColor={String(config[feature]) === value ? "yellow.300" : "whiteAlpha.100"} bg={String(config[feature]) === value ? "yellow.400" : "#0b0d0e"} onClick={() => updateChoice(feature, value)} title={label}>
          <Box width={compact ? "40px" : "52px"} height={compact ? "40px" : "52px"} mx="auto" mt={1} borderRadius="full" overflow="hidden" bg="yellow.400">
            <CartoonAvatar username={label} config={{ ...config, [feature]: value, usePhoto: false }} size={90} />
          </Box>
          <Text fontSize="9px" color={String(config[feature]) === value ? "black" : "gray.400"} mt={1} whiteSpace="nowrap">{label}</Text>
        </Box>
      ))}
    </Flex>
  );

  return (
    <Box mb={6} p={{ base: 3, md: 5 }} bg="#111315" border="1px solid" borderColor="whiteAlpha.200" borderRadius="14px">
      <Box display="grid" gridTemplateColumns={{ base: "1fr", xl: "240px minmax(0, 1fr) 310px" }} gap={{ base: 4, xl: 5 }} alignItems="start">
        <VStack align="stretch" gap={3}>
          <HStack gap={2} color="yellow.300" fontWeight="bold" mt={1}><Sparkles size={17} /><Text fontSize="sm">Creador de avatar</Text></HStack>

          <Box width={{ base: "220px", md: "210px" }} height={{ base: "315px", md: "285px" }} mx="auto" borderRadius="18px" overflow="hidden" bg="#eef2f5" border="1px solid" borderColor="#cbd5e1" boxShadow="0 18px 32px rgba(15, 23, 42, 0.26)">
            <ThreeDAvatar config={config} interactive showBackdrop pose={pose} />
          </Box>

          <Text color="gray.300" fontSize="xs" textAlign="center" px={2}>Diseña tu personaje desde cero con opciones avanzadas.</Text>

          <Box mt={1}>
            <Text color="gray.400" fontSize="xs" mb={2}>Estilo de pose</Text>
            <HStack gap={2} flexWrap="wrap">
              {([['dePie', 'De pie'], ['sentado', 'Sentado'], ['saludo', 'Saludo'], ['cuerpoEntero', 'Cuerpo entero']] as const).map(([value, label]) => (
                <Button key={value} size="xs" variant={pose === value ? "solid" : "outline"} bg={pose === value ? "yellow.400" : "#0b0d0e"} color={pose === value ? "black" : "gray.300"} borderColor="whiteAlpha.200" onClick={() => setPose(value)}>
                  {label}
                </Button>
              ))}
            </HStack>
          </Box>
        </VStack>

        <Box minW={0}>
          <Text color="gray.300" fontSize="sm" mb={4}>Construye tu personaje con imágenes y guárdalo para usarlo en todo el sistema.</Text>

          <Text color="gray.400" fontSize="xs" mb={2}>Modo de avatar</Text>
          <HStack gap={2} mb={4} flexWrap="wrap">
            {([
              { key: "crear", label: "Desde cero", icon: Sparkles },
              { key: "foto", label: "Mi foto", icon: ImageIcon },
              { key: "cartoon", label: "Foto cartoon", icon: UserRound },
            ] as const).map(({ key, label, icon: Icon }) => (
              <Box key={key} as="button" aria-label={key} title={key === "crear" ? "Crear desde cero" : key === "foto" ? "Usar foto de perfil" : "Convertir foto en cartoon"} width="110px" height="82px" borderRadius="10px" overflow="hidden" border="2px solid" borderColor={config.mode === key ? "yellow.300" : "whiteAlpha.200"} bg={config.mode === key ? "yellow.400" : "#0b0d0e"} onClick={() => chooseMode(key)}>
                <Box width="42px" height="42px" mx="auto" mt={2} borderRadius="full" display="flex" alignItems="center" justifyContent="center" bg={config.mode === key ? "#0b0d0e" : "yellow.400"} color={config.mode === key ? "yellow.300" : "black"}>
                  <Icon size={18} />
                </Box>
                <Text fontSize="10px" color={config.mode === key ? "black" : "gray.400"} mt={1}>{label}</Text>
              </Box>
            ))}
            <Button size="xs" variant="outline" color="gray.300" borderColor="whiteAlpha.200" onClick={() => setReadyPlayerMeOpen(true)}>
              <HStack gap={1}>
                <Sparkles size={14} />
                <Text>Avatar humano 3D</Text>
              </HStack>
            </Button>
          </HStack>

          {readyPlayerMeOpen && (
            <Box position="fixed" inset="0" zIndex={100} bg="rgba(3, 7, 18, 0.82)" display="flex" alignItems="center" justifyContent="center" p={4}>
              <Box width={{ base: "100%", lg: "900px" }} height={{ base: "90vh", lg: "760px" }} bg="#111315" borderRadius="xl" overflow="hidden" position="relative" border="1px solid" borderColor="whiteAlpha.300">
                <Button position="absolute" top={3} right={3} zIndex={1} size="sm" variant="solid" bg="white" color="black" aria-label="Cerrar creador 3D" onClick={() => setReadyPlayerMeOpen(false)}><X size={16} /></Button>
                <iframe title="Creador de avatar humano 3D" src="https://demo.readyplayer.me/avatar?frameApi&clearCache=true" width="100%" height="100%" allow="camera *; microphone *" />
              </Box>
            </Box>
          )}

          <Box bg="#0f1113" border="1px solid" borderColor="whiteAlpha.200" borderRadius="12px" p={3}>
            <HStack gap={2} mb={3} color="gray.400" align="center">
              <UserRound size={15} />
              <Text fontSize="xs">Personaje</Text>
              <Text color="yellow.300" fontSize="xs">Preajustes</Text>
            </HStack>

            <Flex gap={2} overflowX="auto" pb={2} mb={3}>
              {presets.map((preset) => (
                <Box key={preset.key} as="button" minW="74px" height="74px" borderRadius="9px" overflow="hidden" border="2px solid" borderColor={activePreset === preset.key ? "yellow.300" : "whiteAlpha.100"} bg={activePreset === preset.key ? "yellow.400" : "#0b0d0e"} onClick={() => applyPreset(preset)} title={preset.label}>
                  <Box width="44px" height="48px" mx="auto" borderRadius="full" overflow="hidden" bg="yellow.400"><CartoonAvatar username={preset.label} config={{ ...config, ...preset.config }} size={80} /></Box>
                  <Text fontSize="9px" color={activePreset === preset.key ? "black" : "gray.400"}>{preset.label}</Text>
                </Box>
              ))}
            </Flex>

            <HStack gap={3} mb={3}>
              {(["hombre", "mujer"] as const).map((gender) => (
                <Box key={gender} as="button" title={gender === "hombre" ? "Elegir personaje masculino" : "Elegir personaje femenino"} aria-label={gender === "hombre" ? "Elegir personaje masculino" : "Elegir personaje femenino"} width="72px" height="72px" borderRadius="10px" overflow="hidden" border="2px solid" borderColor={config.gender === gender ? "yellow.300" : "whiteAlpha.200"} bg={config.gender === gender ? "yellow.400" : "#0b0d0e"} onClick={() => chooseGender(gender)}>
                  <CartoonAvatar username={gender} config={{ ...config, gender }} size={100} />
                </Box>
              ))}
            </HStack>

            <HStack gap={1} flexWrap="wrap" mb={3}>
              {featureGroups.map((group) => (
                <Button key={group.key} size="xs" variant={activeGroup === group.key ? "solid" : "outline"} bg={activeGroup === group.key ? "yellow.400" : undefined} color={activeGroup === group.key ? "black" : "gray.300"} borderColor="whiteAlpha.200" onClick={() => { setActiveGroup(group.key); setActiveFeature(group.features[0]); }}>
                  {group.label}
                </Button>
              ))}
            </HStack>

            <Box mb={3}>
              <HStack gap={1} flexWrap="wrap">
                {featureGroups.find((group) => group.key === activeGroup)?.features.map((feature) => (
                  <Button key={feature} size="xs" variant={activeFeature === feature ? "solid" : "outline"} bg={activeFeature === feature ? "yellow.400" : undefined} color={activeFeature === feature ? "black" : "gray.300"} borderColor="whiteAlpha.200" onClick={() => setActiveFeature(feature)}>
                    {feature === "hairStyle" ? "Peinado" : feature === "hair" ? "Color" : feature === "eyes" ? "Ojos" : feature === "face" ? "Expresión" : feature === "nose" ? "Nariz" : feature === "skin" ? "Piel" : feature === "accessory" ? "Accesorios" : feature === "hat" ? "Sombreros" : feature === "facialHair" ? "Barba" : "Ropa"}
                  </Button>
                ))}
              </HStack>
            </Box>

            <Box>
              {renderChoices(activeFeature)}
            </Box>
          </Box>

          <HStack mt={4} gap={4} flexWrap="wrap">
            <HStack gap={2}>
              <Text fontSize="xs" color="gray.400">Piel</Text>
              <input type="color" value={config.skin} onChange={(event) => updateColor("skin", event.target.value)} title="Color personalizado de piel" style={{ width: "34px", height: "28px", border: 0, background: "transparent", cursor: "pointer" }} />
            </HStack>
            <HStack gap={2}>
              <Text fontSize="xs" color="gray.400">Cabello</Text>
              <input type="color" value={config.hair} onChange={(event) => updateColor("hair", event.target.value)} title="Color personalizado de cabello" style={{ width: "34px", height: "28px", border: 0, background: "transparent", cursor: "pointer" }} />
            </HStack>
          </HStack>

          <HStack mt={4} gap={3} flexWrap="wrap">
            <Button size="sm" bg="yellow.400" color="black" onClick={saveAvatar}><HStack gap={2}><Save size={15} /><Text>Guardar avatar</Text></HStack></Button>
            <Button size="sm" variant="outline" color="gray.200" onClick={resetAvatar}><HStack gap={2}><RotateCcw size={15} /><Text>Restablecer</Text></HStack></Button>
            {saved && <HStack color="green.300" fontSize="sm"><Check size={15} /><Text>Avatar guardado en tu sistema</Text></HStack>}
            {saveError && <Text color="red.300" fontSize="sm">{saveError}</Text>}
          </HStack>
        </Box>

        <VStack align="stretch" gap={3}>
          <Box bg="#0f1113" border="1px solid" borderColor="whiteAlpha.200" borderRadius="12px" p={3}>
            <HStack gap={2} color="gray.300" fontSize="xs" mb={3}><ScanFace size={14} /><Text>Rostro</Text></HStack>
            <HStack gap={2} mb={3} flexWrap="wrap">
              <Button size="xs" variant="solid" bg="yellow.400" color="black" onClick={() => { setActiveGroup("rostro"); setActiveFeature("eyes"); }}>Ojos</Button>
              <Button size="xs" variant="outline" borderColor="whiteAlpha.200" onClick={() => { setActiveGroup("rostro"); setActiveFeature("nose"); }}>Nariz</Button>
              <Button size="xs" variant="outline" borderColor="whiteAlpha.200" onClick={() => { setActiveGroup("rostro"); setActiveFeature("face"); }}>Boca</Button>
              <Button size="xs" variant="outline" borderColor="whiteAlpha.200" onClick={() => { setActiveGroup("rostro"); setActiveFeature("facialHair"); }}>Cejas</Button>
            </HStack>
            {renderChoices("eyes", true)}
          </Box>

          <Box bg="#0f1113" border="1px solid" borderColor="whiteAlpha.200" borderRadius="12px" p={3}>
            <HStack gap={2} color="gray.300" fontSize="xs" mb={3}><Shirt size={14} /><Text>Cuerpo</Text></HStack>
            <HStack gap={2} mb={3} flexWrap="wrap">
              <Button size="xs" variant="outline" borderColor="whiteAlpha.200" onClick={() => { setActiveGroup("cuerpo"); setActiveFeature("skin"); }}>Complexión</Button>
              <Button size="xs" variant="outline" borderColor="whiteAlpha.200" onClick={() => { setActiveGroup("cuerpo"); setActiveFeature("outfit"); }}>Ropa</Button>
            </HStack>
            {renderChoices("skin", true)}
          </Box>

          <Box bg="#0f1113" border="1px solid" borderColor="whiteAlpha.200" borderRadius="12px" p={3}>
            <HStack gap={2} color="gray.300" fontSize="xs" mb={3}><Glasses size={14} /><Text>Accesorios</Text></HStack>
            <HStack gap={2} mb={3} flexWrap="wrap">
              <Button size="xs" variant="outline" borderColor="whiteAlpha.200" onClick={() => { setActiveGroup("accesorios"); setActiveFeature("accessory"); }}>Gafas</Button>
              <Button size="xs" variant="outline" borderColor="whiteAlpha.200" onClick={() => { setActiveGroup("accesorios"); setActiveFeature("hat"); }}>Sombreros</Button>
            </HStack>
            {renderChoices("accessory", true)}
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
