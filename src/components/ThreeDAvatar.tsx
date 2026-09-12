"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { AvatarConfig } from "./CartoonAvatar";

type ThreeDAvatarProps = {
  config?: AvatarConfig | null;
  isTalking?: boolean;
  interactive?: boolean;
  showBackdrop?: boolean;
  pose?: "dePie" | "sentado" | "saludo" | "cuerpoEntero";
};

const outfitColors: Record<AvatarConfig["outfit"], string> = {
  camisa: "#2563eb",
  chaqueta: "#334155",
  sudadera: "#7c3aed",
  overall: "#0f766e",
  grafica: "#dc2626",
};

const hairStyles: Record<AvatarConfig["hairStyle"], string> = {
  corto: "short",
  largo: "long",
  rizado: "curly",
  bob: "bob",
  bun: "bun",
  cola: "ponytail",
  curly: "curly",
};

function AvatarModel({ config, isTalking = false, pose = "dePie" }: ThreeDAvatarProps) {
  const activeConfig = config;
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const phase = useRef(0);
  const skin = activeConfig?.skin || "#f5c6a5";
  const hair = activeConfig?.hair || "#251b16";
  const outfit = outfitColors[activeConfig?.outfit || "camisa"];
  const outfitType = activeConfig?.outfit || "camisa";
  const pantsColor = outfitType === "overall" ? "#2563eb" : "#1e293b";
  const hairStyle = hairStyles[activeConfig?.hairStyle || "corto"];
  const female = activeConfig?.gender === "mujer";
  const eyeColor = activeConfig?.accessory === "sol" ? "#111827" : "#1f2937";
  const browColor = activeConfig?.face === "seria" ? "#111827" : hair;
  const hairDepth = hairStyle === "long" || hairStyle === "bob" || hairStyle === "ponytail" ? 0.24 : 0.18;
  const noseScale = activeConfig?.nose === "pequena" ? [0.024, 0.04, 0.018] : activeConfig?.nose === "ancha" ? [0.045, 0.05, 0.025] : [0.032, 0.055, 0.022];
  const eyeType = activeConfig?.eyes || "redondos";
  const eyeScale = eyeType === "grandes" || eyeType === "sorprendidos" ? 1.25 : eyeType === "felices" ? 0.8 : 1;
  const mouthScale = activeConfig?.face === "seria" || activeConfig?.expression === "serio" ? [0.07, 0.018, 0.018] : activeConfig?.face === "alegre" ? [0.12, 0.045, 0.018] : [0.09, 0.032, 0.018];
  const wearsGlasses = activeConfig?.accessory === "gafas" || activeConfig?.accessory === "gafasRedondas" || activeConfig?.accessory === "sol";
  const wearsEyepatch = activeConfig?.accessory === "parche";
  const hasBeard = activeConfig?.facialHair === "barba" || activeConfig?.facialHair === "barbaLarga";
  const hasMoustache = activeConfig?.facialHair === "bigote";
  const eyeMaterial = eyeColor;

  useFrame((_, delta) => {
    phase.current += delta;
    const time = phase.current;
    const talkingWave = isTalking ? Math.sin(time * 10) : 0;
    if (bodyRef.current) bodyRef.current.position.y = (pose === "sentado" ? -0.25 : -0.65) + Math.sin(time * 2.2) * 0.025;
    if (leftArmRef.current) leftArmRef.current.rotation.z = (pose === "saludo" ? -0.72 : 0.08) + talkingWave * 0.12;
    if (rightArmRef.current) rightArmRef.current.rotation.z = -0.08 - talkingWave * 0.12;
    if (leftLegRef.current) leftLegRef.current.rotation.x = pose === "sentado" ? -1.12 : Math.sin(time * 2.2) * 0.04;
    if (rightLegRef.current) rightLegRef.current.rotation.x = pose === "sentado" ? -1.12 : -Math.sin(time * 2.2) * 0.04;
    if (mouthRef.current) mouthRef.current.scale.y = mouthScale[1] * (isTalking ? 1 + Math.abs(talkingWave) * 0.45 : 1);
    const blink = time % 5.2 > 4.92 && time % 5.2 < 5.03 ? 0.12 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = 0.062 * eyeScale * blink;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = 0.062 * eyeScale * blink;
  });

  return (
    <group ref={bodyRef} position={[0, -0.65, 0]} scale={0.82}>
      <mesh position={[0, 1.75, 0]} scale={[female ? 0.53 : 0.56, female ? 0.66 : 0.64, 0.52]} castShadow>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.13, -0.02]} scale={[female ? 0.57 : 0.59, female ? 0.38 : 0.34, 0.55]} castShadow>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color={hair} roughness={0.68} />
      </mesh>
      <mesh position={[-0.2, 1.91, 0.51]} scale={[0.12, 0.025, 0.025]} rotation={[0, 0, female ? 0.12 : -0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={browColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 1.91, 0.51]} scale={[0.12, 0.025, 0.025]} rotation={[0, 0, female ? -0.12 : 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={browColor} roughness={0.7} />
      </mesh>
      <mesh position={[-0.57, 1.76, 0]} scale={[0.1, 0.16, 0.08]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      <mesh position={[0.57, 1.76, 0]} scale={[0.1, 0.16, 0.08]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      {hairStyle === "bun" && (
        <mesh position={[0, 2.58, -0.02]} scale={[0.25, 0.26, 0.24]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color={hair} roughness={0.68} />
        </mesh>
      )}
      {(hairStyle === "long" || hairStyle === "bob") && (
        <mesh position={[0, hairStyle === "long" ? 1.88 : 1.98, -0.32]} scale={[0.62, hairStyle === "long" ? 0.86 : 0.7, hairDepth]} castShadow>
          <sphereGeometry args={[1, 32, 20]} />
          <meshStandardMaterial color={hair} roughness={0.68} />
        </mesh>
      )}
      {hairStyle === "ponytail" && (
        <group>
          <mesh position={[0, 2.02, -0.3]} scale={[0.62, 0.7, 0.2]} castShadow>
            <sphereGeometry args={[1, 32, 20]} />
            <meshStandardMaterial color={hair} roughness={0.68} />
          </mesh>
          <mesh position={[0.52, 2.05, -0.2]} scale={[0.22, 0.52, 0.2]} rotation={[0, 0, -0.18]} castShadow>
            <capsuleGeometry args={[0.45, 0.7, 16, 20]} />
            <meshStandardMaterial color={hair} roughness={0.68} />
          </mesh>
        </group>
      )}
      {hairStyle === "curly" && (
        <group>
          {[-0.48, -0.28, 0.28, 0.48].map((x, index) => (
            <mesh key={index} position={[x, 2.02 + (index % 2) * 0.08, -0.35]} scale={[0.2, 0.25, 0.2]} castShadow>
              <sphereGeometry args={[1, 20, 16]} />
              <meshStandardMaterial color={hair} roughness={0.68} />
            </mesh>
          ))}
        </group>
      )}
      {eyeType !== "cerrados" && <>
        <mesh position={[-0.2, 1.78, 0.62]} scale={[0.052 * eyeScale, 0.062 * eyeScale, 0.022]} ref={leftEyeRef}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={eyeMaterial} roughness={0.45} />
        </mesh>
        <mesh position={[0.2, 1.78, 0.62]} scale={[0.052 * eyeScale, 0.062 * eyeScale, 0.022]} ref={rightEyeRef}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={eyeMaterial} roughness={0.45} />
        </mesh>
      </>}
      {eyeType === "cerrados" && (
        <group>
          <mesh position={[-0.2, 1.78, 0.65]} scale={[0.08, 0.012, 0.012]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={eyeMaterial} />
          </mesh>
          <mesh position={[0.2, 1.78, 0.65]} scale={[0.08, 0.012, 0.012]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={eyeMaterial} />
          </mesh>
        </group>
      )}
      <mesh position={[0, 1.66, 0.62]} scale={noseScale as [number, number, number]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      <mesh ref={mouthRef} position={[0, 1.54, 0.63]} scale={mouthScale as [number, number, number]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#9f1239" roughness={0.5} />
      </mesh>
      {hasBeard && (
        <mesh position={[0, 1.43, 0.58]} scale={[0.28, activeConfig?.facialHair === "barbaLarga" ? 0.3 : 0.2, 0.08]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color={hair} roughness={0.82} />
        </mesh>
      )}
      {hasMoustache && (
        <mesh position={[0, 1.57, 0.66]} scale={[0.15, 0.045, 0.022]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={hair} roughness={0.76} />
        </mesh>
      )}
      {wearsGlasses && (
        <group>
          <mesh position={[-0.2, 1.78, 0.68]} rotation={[0, 0, 0.02]}>
            <torusGeometry args={[0.1, 0.014, 8, 24]} />
            <meshStandardMaterial color={activeConfig?.accessory === "sol" ? "#111827" : "#d4a72c"} roughness={0.4} />
          </mesh>
          <mesh position={[0.2, 1.78, 0.68]} rotation={[0, 0, -0.02]}>
            <torusGeometry args={[activeConfig?.accessory === "gafasRedondas" ? 0.1 : 0.09, 0.014, 8, 24]} />
            <meshStandardMaterial color={activeConfig?.accessory === "sol" ? "#111827" : "#d4a72c"} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.78, 0.68]} scale={[0.1, 0.012, 0.012]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#d4a72c" roughness={0.4} />
          </mesh>
        </group>
      )}
      {wearsEyepatch && (
        <mesh position={[-0.2, 1.78, 0.7]} scale={[0.12, 0.1, 0.025]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#111827" roughness={0.72} />
        </mesh>
      )}
      {activeConfig?.hat !== "ninguno" && (
        <group>
          <mesh position={[0, 2.56, -0.02]} scale={[0.66, 0.12, 0.58]}>
            <cylinderGeometry args={[0.82, 0.82, 0.18, 32]} />
            <meshStandardMaterial color={activeConfig?.hat === "invierno" ? "#e5e7eb" : "#1f2937"} roughness={0.7} />
          </mesh>
          <mesh position={[0, 2.72, -0.02]} scale={[0.46, 0.22, 0.42]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={activeConfig?.hat === "invierno" ? "#e5e7eb" : "#1f2937"} roughness={0.7} />
          </mesh>
        </group>
      )}
      {activeConfig?.hat === "gorra" && (
        <mesh position={[0, 2.5, 0.5]} scale={[0.5, 0.08, 0.3]} rotation={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.12, 32]} />
          <meshStandardMaterial color="#1f2937" roughness={0.7} />
        </mesh>
      )}
      <mesh position={[0, 1.08, 0]} scale={[0.19, 0.28, 0.18]}>
        <cylinderGeometry args={[0.72, 0.72, 1, 24]} />
        <meshStandardMaterial color={skin} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.32, 0]} scale={[female ? 0.58 : 0.64, 0.72, 0.36]} castShadow>
        <capsuleGeometry args={[0.65, 1, 16, 24]} />
        <meshStandardMaterial color={outfit} roughness={0.72} />
      </mesh>
      {outfitType === "camisa" && (
        <mesh position={[0, 0.82, 0.38]} scale={[0.24, 0.16, 0.035]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
        </mesh>
      )}
      {outfitType === "chaqueta" && (
        <group>
          <mesh position={[-0.2, 0.48, 0.38]} scale={[0.18, 0.55, 0.035]} rotation={[0, 0, -0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.58} />
          </mesh>
          <mesh position={[0.2, 0.48, 0.38]} scale={[0.18, 0.55, 0.035]} rotation={[0, 0, 0.18]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.58} />
          </mesh>
          {[-0.12, 0.08, 0.28].map((y) => (
            <mesh key={y} position={[0, y, 0.42]} scale={[0.035, 0.035, 0.035]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#facc15" metalness={0.35} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {outfitType === "sudadera" && (
        <group>
          <mesh position={[0, 0.82, 0.38]} scale={[0.32, 0.3, 0.08]}>
            <torusGeometry args={[0.72, 0.12, 12, 24]} />
            <meshStandardMaterial color="#4c1d95" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.05, 0.4]} scale={[0.34, 0.17, 0.05]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#5b21b6" roughness={0.82} />
          </mesh>
        </group>
      )}
      {outfitType === "overall" && (
        <group>
          <mesh position={[0, 0.35, 0.4]} scale={[0.38, 0.42, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#60a5fa" roughness={0.75} />
          </mesh>
          <mesh position={[-0.28, 0.7, 0.39]} scale={[0.07, 0.48, 0.045]} rotation={[0, 0, -0.12]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#60a5fa" roughness={0.75} />
          </mesh>
          <mesh position={[0.28, 0.7, 0.39]} scale={[0.07, 0.48, 0.045]} rotation={[0, 0, 0.12]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#60a5fa" roughness={0.75} />
          </mesh>
        </group>
      )}
      {outfitType === "grafica" && (
        <mesh position={[0, 0.35, 0.39]} scale={[0.2, 0.2, 0.04]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#facc15" emissive="#422006" emissiveIntensity={0.2} roughness={0.5} />
        </mesh>
      )}
      <group ref={leftArmRef} position={[-0.56, 0.58, 0]}>
        <mesh rotation={[0, 0, -0.12]} castShadow>
          <capsuleGeometry args={[0.13, 0.72, 12, 18]} />
          <meshStandardMaterial color={activeConfig?.outfit === "camisa" ? outfit : outfit} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.52, 0]} scale={[1.08, 0.92, 1.08]} castShadow>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshStandardMaterial color={skin} roughness={0.82} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.56, 0.58, 0]}>
        <mesh rotation={[0, 0, 0.12]} castShadow>
          <capsuleGeometry args={[0.13, 0.72, 12, 18]} />
          <meshStandardMaterial color={outfit} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.52, 0]} scale={[1.08, 0.92, 1.08]} castShadow>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshStandardMaterial color={skin} roughness={0.82} />
        </mesh>
      </group>
      <group ref={leftLegRef} position={[-0.22, -0.62, 0]}>
          <mesh castShadow>
          <capsuleGeometry args={[0.17, 0.72, 12, 18]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, -0.04]} scale={[1.2, 0.45, 1.65]} castShadow>
          <sphereGeometry args={[0.18, 16, 12]} />
          <meshStandardMaterial color="#111827" roughness={0.72} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.22, -0.62, 0]}>
          <mesh castShadow>
          <capsuleGeometry args={[0.17, 0.72, 12, 18]} />
          <meshStandardMaterial color={pantsColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, -0.04]} scale={[1.2, 0.45, 1.65]} castShadow>
          <sphereGeometry args={[0.18, 16, 12]} />
          <meshStandardMaterial color="#111827" roughness={0.72} />
        </mesh>
      </group>
    </group>
  );
}

function ReadyPlayerMeModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = scene.clone();
  return <primitive object={model} position={[0, -1.55, 0]} scale={2.1} />;
}

export function ThreeDAvatar({ config, isTalking = false, interactive = false, showBackdrop = false, pose = "dePie" }: ThreeDAvatarProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      {showBackdrop && <color attach="background" args={["#eef2f5"]} />}
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 4]} intensity={3.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2, 2]} intensity={1.2} color="#facc15" />
      {config?.readyPlayerMeUrl ? <ReadyPlayerMeModel url={config.readyPlayerMeUrl} /> : <AvatarModel config={config} isTalking={isTalking} pose={pose} />}
      <OrbitControls enabled={interactive} enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.9} rotateSpeed={0.8} />
    </Canvas>
  );
}
