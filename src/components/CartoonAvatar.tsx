"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@chakra-ui/react";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

type CartoonAvatarProps = {
  username: string;
  photoData?: string | null;
  size?: number;
  config?: AvatarConfig;
  fullBody?: boolean;
  isTalking?: boolean;
};

export type AvatarConfig = {
  readyPlayerMeUrl?: string;
  mode: "crear" | "foto" | "cartoon";
  usePhoto: boolean;
  gender: "hombre" | "mujer";
  skin: string;
  hair: string;
  hairStyle: string;
  eyes: string;
  nose: string;
  face: string;
  accessory: string;
  hat: string;
  facialHair: string;
  outfit: string;
  expression: string;
};

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  mode: "crear",
  usePhoto: true,
  gender: "hombre",
  skin: "#f5c6a5",
  hair: "#251b16",
  hairStyle: "corto",
  eyes: "redondos",
  nose: "suave",
  face: "amigable",
  accessory: "gafas",
  hat: "ninguno",
  facialHair: "ninguna",
  outfit: "chaqueta",
  expression: "sonrisa",
};

function GeneratedAvatar({ username, config = DEFAULT_AVATAR_CONFIG }: { username: string; config?: AvatarConfig }) {
  const hairMap: Record<string, string> = { corto: "shortRound", largo: "longButNotTooLong", rizado: "curly", bob: "bob", bun: "bun", cola: "longButNotTooLong", curly: "fro" };
  const eyeMap: Record<string, string> = { redondos: "default", grandes: "surprised", felices: "happy", cerrados: "closed", sorprendidos: "surprised" };
  const clothingMap: Record<string, string> = { camisa: "shirtCrewNeck", chaqueta: "blazerAndShirt", sudadera: "hoodie", overall: "overall", grafica: "graphicShirt" };
  const mouthMap: Record<string, string> = { sonrisa: "smile", serio: "serious" };
  const faceMouthMap: Record<string, string> = { amigable: "smile", serena: "default", alegre: "twinkle", seria: "serious" };
  const accessoryMap: Record<string, string> = { gafas: "prescription01", gafasRedondas: "round", sol: "sunglasses", parche: "eyepatch" };
  const hatMap: Record<string, string> = { gorra: "hat", invierno: "winterHat1", turbante: "turban", hijab: "hijab" };
  const facialHairMap: Record<string, string> = { barba: "beardMedium", barbaLarga: "beardMajestic", bigote: "moustacheFancy" };
  const defaultHair = config.gender === "mujer" ? "longButNotTooLong" : "shortRound";
  const options = {
    seed: [username],
    top: [hatMap[config.hat] || hairMap[config.hairStyle] || defaultHair],
    eyes: [eyeMap[config.eyes] || "default"],
    clothing: [clothingMap[config.outfit] || "shirtCrewNeck"],
    mouth: [faceMouthMap[config.face] || mouthMap[config.expression] || "smile"],
    accessories: config.accessory !== "ninguno" ? [accessoryMap[config.accessory] || "round"] : [],
    accessoriesProbability: config.accessory !== "ninguno" ? 100 : 0,
    facialHair: config.facialHair !== "ninguna" ? [facialHairMap[config.facialHair] || "beardLight"] : [],
    facialHairProbability: config.facialHair !== "ninguna" ? 100 : 0,
    skinColor: [config.skin.replace("#", "")],
    hairColor: [config.hair.replace("#", "")],
    backgroundColor: ["facc15"],
  } as any;
  const avatarUri = createAvatar(avataaars, options).toDataUri();

  return <img src={avatarUri} alt={`Avatar de ${username}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}

export function CartoonAvatar({ username, photoData, size = 160, config: providedConfig, fullBody = false, isTalking = false }: CartoonAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const activeConfig = providedConfig ?? config;

  useEffect(() => {
    if (providedConfig) return;
    const loadConfig = () => {
      try {
        const stored = window.localStorage.getItem(`soland-avatar-${username}`);
        if (stored) setConfig({ ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(stored) });
      } catch {
        setConfig(DEFAULT_AVATAR_CONFIG);
      }
    };
    loadConfig();
    window.addEventListener("soland-avatar-updated", loadConfig);
    return () => window.removeEventListener("soland-avatar-updated", loadConfig);
  }, [providedConfig, username]);

  useEffect(() => {
    setImageFailed(false);
    if (!photoData || !canvasRef.current || activeConfig.mode !== "cartoon") return;

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.clearRect(0, 0, size, size);
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

      try {
        const pixels = context.getImageData(0, 0, size, size);
        const data = pixels.data;
        const levels = 5;
        for (let index = 0; index < data.length; index += 4) {
          const pixel = index / 4;
          const x = pixel % size;
          const y = Math.floor(pixel / size);
          const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
          const previous = index - 4;
          const above = index - size * 4;
          const previousBrightness = x > 0 ? (data[previous] + data[previous + 1] + data[previous + 2]) / 3 : brightness;
          const aboveBrightness = y > 0 ? (data[above] + data[above + 1] + data[above + 2]) / 3 : brightness;
          const isEdge = Math.abs(brightness - previousBrightness) > 26 || Math.abs(brightness - aboveBrightness) > 26;
          data[index] = isEdge ? 34 : Math.min(255, Math.round(data[index] / 255 * (levels - 1)) * (255 / (levels - 1)) * 1.08);
          data[index + 1] = isEdge ? 28 : Math.min(255, Math.round(data[index + 1] / 255 * (levels - 1)) * (255 / (levels - 1)) * 1.08);
          data[index + 2] = isEdge ? 18 : Math.min(255, Math.round(data[index + 2] / 255 * (levels - 1)) * (255 / (levels - 1)) * 1.08);
        }
        context.putImageData(pixels, 0, 0);
      } catch {
        setImageFailed(true);
      }
    };
    image.onerror = () => setImageFailed(true);
    image.src = photoData;
  }, [activeConfig.mode, photoData, size]);

  const frame = (content: ReactNode) => (
    <Box width="100%" height="100%" position="relative" overflow="hidden" css={{
      "@keyframes avatarBreath": { "0%, 100%": { transform: "translateY(0) rotate(0deg)" }, "50%": { transform: "translateY(-2px) rotate(1deg)" } },
      "@keyframes avatarBlink": { "0%, 93%, 100%": { opacity: 0 }, "95%": { opacity: 0.75 } },
      "@keyframes avatarArmLeft": { "0%, 100%": { transform: "rotate(3deg) translateY(0)" }, "50%": { transform: "rotate(-7deg) translateY(-3px)" } },
      "@keyframes avatarArmRight": { "0%, 100%": { transform: "rotate(-3deg) translateY(0)" }, "50%": { transform: "rotate(7deg) translateY(-3px)" } },
      "@keyframes avatarStepLeft": { "0%, 100%": { transform: "rotate(4deg) translateY(0)" }, "50%": { transform: "rotate(-7deg) translateY(-3px)" } },
      "@keyframes avatarStepRight": { "0%, 100%": { transform: "rotate(-4deg) translateY(0)" }, "50%": { transform: "rotate(7deg) translateY(-3px)" } },
    }}>
      {fullBody ? (
        <Box width="100%" height="100%" position="relative" animation="avatarBreath 3.4s ease-in-out infinite">
          <Box position="absolute" left="4%" right="4%" top="38%" bottom="0" zIndex={2} pointerEvents="none">
            <Box position="absolute" left="7%" top="0" width="10%" height="48%" bg={activeConfig.skin} borderRadius="999px" transformOrigin="top center" animation={isTalking ? "avatarArmLeft 0.8s ease-in-out infinite" : "avatarArmLeft 3.4s ease-in-out infinite"}>
              <Box position="absolute" left="-10%" bottom="-7%" width="120%" height="16%" bg={activeConfig.skin} borderRadius="full" />
            </Box>
            <Box position="absolute" right="7%" top="0" width="10%" height="48%" bg={activeConfig.skin} borderRadius="999px" transformOrigin="top center" animation={isTalking ? "avatarArmRight 0.8s ease-in-out infinite" : "avatarArmRight 3.4s ease-in-out infinite"}>
              <Box position="absolute" right="-10%" bottom="-7%" width="120%" height="16%" bg={activeConfig.skin} borderRadius="full" />
            </Box>
            <Box position="absolute" left="36%" top="42%" width="12%" height="58%" bg="#334155" borderRadius="999px" transformOrigin="top center" animation="avatarStepLeft 1.4s ease-in-out infinite" />
            <Box position="absolute" right="36%" top="42%" width="12%" height="58%" bg="#334155" borderRadius="999px" transformOrigin="top center" animation="avatarStepRight 1.4s ease-in-out infinite" />
            <Box position="absolute" left="27%" bottom="-2%" width="27%" height="10%" bg="#171717" borderRadius="999px 999px 45% 45%" />
            <Box position="absolute" right="27%" bottom="-2%" width="27%" height="10%" bg="#171717" borderRadius="999px 999px 45% 45%" />
          </Box>
          <Box position="relative" width="100%" height="78%" zIndex={1}>{content}</Box>
        </Box>
      ) : <Box width="100%" height="100%" animation="avatarBreath 3.4s ease-in-out infinite">{content}</Box>}
      <Box position="absolute" left="30%" right="30%" top="47%" height="2px" bg="blackAlpha.500" borderRadius="full" animation="avatarBlink 5.2s infinite" pointerEvents="none" />
    </Box>
  );

  if (!photoData || imageFailed || activeConfig.mode === "crear") {
    return frame(<GeneratedAvatar username={username} config={activeConfig} />);
  }
  if (activeConfig.mode === "foto") {
    return frame(<img src={photoData} alt={`Foto de ${username}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />);
  }

  return frame(<canvas ref={canvasRef} width={size} height={size} aria-label={`Avatar cartoon de ${username}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />);
}
