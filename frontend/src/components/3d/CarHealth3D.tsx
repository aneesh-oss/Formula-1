"use client";

import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { TireResponse } from "@/lib/api";

interface CarHealth3DProps {
  tireData?: TireResponse | null;
  driver?: string;
  autoRotate?: boolean;
}

interface WheelStatus {
  wear: number;
  label: string;
  statusText: string;
  colorHex: string;
  emissiveHex: string;
  intensity: number;
  isCritical: boolean;
}

function getWheelStatus(wear: number, cornerKey: string): WheelStatus {
  if (wear > 75) {
    return {
      wear,
      label: `${cornerKey} [CRITICAL / ${wear.toFixed(0)}%]`,
      statusText: "CRITICAL",
      colorHex: "#ff1744",
      emissiveHex: "#ff1744",
      intensity: 2.5,
      isCritical: true,
    };
  }
  if (wear >= 50) {
    return {
      wear,
      label: `${cornerKey} [DEGRADING / ${wear.toFixed(0)}%]`,
      statusText: `${wear.toFixed(0)}%`,
      colorHex: "#ff9100",
      emissiveHex: "#ff9100",
      intensity: 1.5,
      isCritical: false,
    };
  }
  return {
    wear,
    label: `${cornerKey} [OPTIMAL / ${wear.toFixed(0)}%]`,
    statusText: "OPTIMAL",
    colorHex: "#00e5ff",
    emissiveHex: "#00e5ff",
    intensity: 0.5,
    isCritical: false,
  };
}

// Procedural high-fidelity F1 chassis rendered in standalone / wireframe mode
function ProceduralF1Chassis({
  flStatus,
  frStatus,
  rlStatus,
  rrStatus,
}: {
  flStatus: WheelStatus;
  frStatus: WheelStatus;
  rlStatus: WheelStatus;
  rrStatus: WheelStatus;
}) {
  const flMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const frMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rlMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rrMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulseFast = 0.5 + 0.5 * Math.sin(t * 7);

    if (flMatRef.current) {
      flMatRef.current.emissiveIntensity = flStatus.isCritical
        ? flStatus.intensity * pulseFast
        : flStatus.intensity;
    }
    if (frMatRef.current) {
      frMatRef.current.emissiveIntensity = frStatus.isCritical
        ? frStatus.intensity * pulseFast
        : frStatus.intensity;
    }
    if (rlMatRef.current) {
      rlMatRef.current.emissiveIntensity = rlStatus.isCritical
        ? rlStatus.intensity * pulseFast
        : rlStatus.intensity;
    }
    if (rrMatRef.current) {
      rrMatRef.current.emissiveIntensity = rrStatus.isCritical
        ? rrStatus.intensity * pulseFast
        : rrStatus.intensity;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* 1. Main Monocoque Chassis */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.0, 0.4, 3.4]} />
        <meshStandardMaterial color="#2d3748" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 2. Aerodynamic Nosecone */}
      <mesh position={[0, 0.35, 2.2]} rotation={[Math.PI / 16, 0, 0]}>
        <coneGeometry args={[0.35, 1.6, 16]} />
        <meshStandardMaterial color="#00f0ff" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* 3. Front Wing & Endplates */}
      <group position={[0, 0.2, 2.6]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#1a1e2b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[-1.25, 0.15, 0]}>
          <boxGeometry args={[0.05, 0.35, 0.6]} />
          <meshStandardMaterial color="#e10600" />
        </mesh>
        <mesh position={[1.25, 0.15, 0]}>
          <boxGeometry args={[0.05, 0.35, 0.6]} />
          <meshStandardMaterial color="#e10600" />
        </mesh>
      </group>

      {/* 4. Cockpit & Driver Helmet */}
      <mesh position={[0, 0.65, 0.2]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#ffdd00" roughness={0.1} metalness={0.7} />
      </mesh>
      {/* Halo Structure */}
      <mesh position={[0, 0.72, 0.3]}>
        <torusGeometry args={[0.26, 0.04, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#4a5568" metalness={0.9} />
      </mesh>

      {/* 5. Engine Airbox & Fin */}
      <mesh position={[0, 0.85, -0.6]}>
        <boxGeometry args={[0.1, 0.5, 1.2]} />
        <meshStandardMaterial color="#1a202c" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 6. Rear Wing Assembly */}
      <group position={[0, 0.9, -1.8]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.0, 0.06, 0.5]} />
          <meshStandardMaterial color="#1a1e2b" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.08, -0.1]}>
          <boxGeometry args={[1.8, 0.03, 0.3]} />
          <meshStandardMaterial color="#00f0ff" metalness={0.9} />
        </mesh>
        <mesh position={[-1.0, -0.3, 0]}>
          <boxGeometry args={[0.05, 0.65, 0.6]} />
          <meshStandardMaterial color="#e10600" />
        </mesh>
        <mesh position={[1.0, -0.3, 0]}>
          <boxGeometry args={[0.05, 0.65, 0.6]} />
          <meshStandardMaterial color="#e10600" />
        </mesh>
      </group>

      {/* 7. Four Wheels with Dynamic Color & HTML Floating Badges */}
      {/* FRONT-LEFT WHEEL */}
      <group position={[-1.25, 0.36, 1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.36, 0.36, 0.35, 24]} />
          <meshStandardMaterial
            ref={flMatRef}
            color={flStatus.colorHex}
            emissive={flStatus.emissiveHex}
            emissiveIntensity={flStatus.intensity}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.65, 0]} center distanceFactor={8}>
          <div
            className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
              flStatus.isCritical
                ? "bg-red-600/90 border-red-400 animate-pulse"
                : flStatus.wear >= 50
                ? "bg-amber-600/90 border-amber-400"
                : "bg-cyan-600/90 border-cyan-400"
            }`}
          >
            {flStatus.label}
          </div>
        </Html>
      </group>

      {/* FRONT-RIGHT WHEEL */}
      <group position={[1.25, 0.36, 1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.36, 0.36, 0.35, 24]} />
          <meshStandardMaterial
            ref={frMatRef}
            color={frStatus.colorHex}
            emissive={frStatus.emissiveHex}
            emissiveIntensity={frStatus.intensity}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.65, 0]} center distanceFactor={8}>
          <div
            className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
              frStatus.isCritical
                ? "bg-red-600/90 border-red-400 animate-pulse"
                : frStatus.wear >= 50
                ? "bg-amber-600/90 border-amber-400"
                : "bg-cyan-600/90 border-cyan-400"
            }`}
          >
            {frStatus.label}
          </div>
        </Html>
      </group>

      {/* REAR-LEFT WHEEL */}
      <group position={[-1.3, 0.38, -1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.44, 24]} />
          <meshStandardMaterial
            ref={rlMatRef}
            color={rlStatus.colorHex}
            emissive={rlStatus.emissiveHex}
            emissiveIntensity={rlStatus.intensity}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.46, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.68, 0]} center distanceFactor={8}>
          <div
            className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
              rlStatus.isCritical
                ? "bg-red-600/90 border-red-400 animate-pulse"
                : rlStatus.wear >= 50
                ? "bg-amber-600/90 border-amber-400"
                : "bg-cyan-600/90 border-cyan-400"
            }`}
          >
            {rlStatus.label}
          </div>
        </Html>
      </group>

      {/* REAR-RIGHT WHEEL */}
      <group position={[1.3, 0.38, -1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.44, 24]} />
          <meshStandardMaterial
            ref={rrMatRef}
            color={rrStatus.colorHex}
            emissive={rrStatus.emissiveHex}
            emissiveIntensity={rrStatus.intensity}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.46, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.68, 0]} center distanceFactor={8}>
          <div
            className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
              rrStatus.isCritical
                ? "bg-red-600/90 border-red-400 animate-pulse"
                : rrStatus.wear >= 50
                ? "bg-amber-600/90 border-amber-400"
                : "bg-cyan-600/90 border-cyan-400"
            }`}
          >
            {rrStatus.label}
          </div>
        </Html>
      </group>
    </group>
  );
}

// 3D GLTF Model Renderer with Studio Brightness Enhancement
function GLTFCarModel({
  flStatus,
  frStatus,
  rlStatus,
  rrStatus,
}: {
  flStatus: WheelStatus;
  frStatus: WheelStatus;
  rlStatus: WheelStatus;
  rrStatus: WheelStatus;
}) {
  const { scene } = useGLTF("/models/f1_car.glb");
  const wheelMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());

  useEffect(() => {
    wheelMaterialsRef.current.clear();
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = (mesh.name || "").toLowerCase();

        // Enhance body materials so car is not pitch black against dark background
        if (mesh.material && !Array.isArray(mesh.material)) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.color && (mat.color.r < 0.15 && mat.color.g < 0.15 && mat.color.b < 0.15)) {
            mat.color.setRGB(0.38, 0.40, 0.45); // Studio grey / carbon tint
            mat.roughness = 0.45;
            mat.metalness = 0.65;
          }
        }

        const isTyreMesh =
          name.startsWith("tyre_") ||
          name.includes("tread") ||
          name.includes("wheel_fl") ||
          name.includes("wheel_fr") ||
          name.includes("wheel_bl") ||
          name.includes("wheel_br");

        if (isTyreMesh && mesh.material) {
          if (!Array.isArray(mesh.material)) {
            wheelMaterialsRef.current.set(name, mesh.material as THREE.MeshStandardMaterial);
          }
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulseFast = 0.5 + 0.5 * Math.sin(t * 7);

    wheelMaterialsRef.current.forEach((mat, name) => {
      let status = flStatus;
      if (name.includes("fr") || name.includes("rf")) status = frStatus;
      else if (name.includes("rl") || name.includes("bl")) status = rlStatus;
      else if (name.includes("rr") || name.includes("br")) status = rrStatus;

      mat.emissive.set(status.emissiveHex);
      mat.emissiveIntensity = status.isCritical ? status.intensity * pulseFast : status.intensity;
    });
  });

  return (
    <group position={[0, -0.2, 0]}>
      <primitive object={scene} scale={[0.85, 0.85, 0.85]} />

      {/* Front Left Tyre Label */}
      <Html position={[0.78, 0.85, 1.45]} center distanceFactor={8}>
        <div
          className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
            flStatus.isCritical
              ? "bg-red-600/90 border-red-400 animate-pulse"
              : flStatus.wear >= 50
              ? "bg-amber-600/90 border-amber-400"
              : "bg-cyan-600/90 border-cyan-400"
          }`}
        >
          {flStatus.label}
        </div>
      </Html>

      {/* Front Right Tyre Label */}
      <Html position={[-0.78, 0.85, 1.45]} center distanceFactor={8}>
        <div
          className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
            frStatus.isCritical
              ? "bg-red-600/90 border-red-400 animate-pulse"
              : frStatus.wear >= 50
              ? "bg-amber-600/90 border-amber-400"
              : "bg-cyan-600/90 border-cyan-400"
          }`}
        >
          {frStatus.label}
        </div>
      </Html>

      {/* Rear Left Tyre Label */}
      <Html position={[0.75, 0.85, -1.45]} center distanceFactor={8}>
        <div
          className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
            rlStatus.isCritical
              ? "bg-red-600/90 border-red-400 animate-pulse"
              : rlStatus.wear >= 50
              ? "bg-amber-600/90 border-amber-400"
              : "bg-cyan-600/90 border-cyan-400"
          }`}
        >
          {rlStatus.label}
        </div>
      </Html>

      {/* Rear Right Tyre Label */}
      <Html position={[-0.75, 0.85, -1.45]} center distanceFactor={8}>
        <div
          className={`pointer-events-none rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
            rrStatus.isCritical
              ? "bg-red-600/90 border-red-400 animate-pulse"
              : rrStatus.wear >= 50
              ? "bg-amber-600/90 border-amber-400"
              : "bg-cyan-600/90 border-cyan-400"
          }`}
        >
          {rrStatus.label}
        </div>
      </Html>
    </group>
  );
}

export default function CarHealth3D({
  tireData,
  driver = "VER",
  autoRotate = false,
}: CarHealth3DProps) {
  // Mode selection: "cad_image" (user attached 3D image with telemetry labels), "webgl" (interactive 3D), "wireframe"
  const [hudMode, setHudMode] = useState<"cad_image" | "webgl" | "wireframe">("cad_image");

  // Extract tire wear metrics from history or defaults
  const latestLap = tireData?.history?.slice(-1)[0];
  const wearFL = latestLap ? latestLap.avg_temp_fl / 3.0 : 18;
  const wearFR = latestLap ? latestLap.avg_temp_fr / 2.6 : 58;
  const wearRL = latestLap ? latestLap.avg_temp_rl / 3.2 : 24;
  const wearRR = latestLap ? latestLap.avg_temp_rr / 2.8 : 82;

  const flStatus = useMemo(() => getWheelStatus(wearFL, "FL"), [wearFL]);
  const frStatus = useMemo(() => getWheelStatus(wearFR, "FR"), [wearFR]);
  const rlStatus = useMemo(() => getWheelStatus(wearRL, "RL"), [wearRL]);
  const rrStatus = useMemo(() => getWheelStatus(wearRR, "RR"), [wearRR]);

  return (
    <div className="relative flex flex-col h-[400px] w-full rounded-xl border border-pitwall-border bg-pitwall-panel p-3 shadow-2xl overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-pitwall-cyan font-bold">
              3D Vehicle Dynamics &amp; Component Telemetry
            </span>
          </div>
          <h3 className="text-sm font-black text-white font-mono mt-0.5">
            {driver} — Four-Wheel Thermal Degradation &amp; Aero HUD
          </h3>
        </div>

        {/* View Mode Switcher */}
        <div className="pointer-events-auto flex items-center space-x-1 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-1 text-[10px] font-mono">
          <button
            onClick={() => setHudMode("cad_image")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              hudMode === "cad_image"
                ? "bg-pitwall-cyan text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Studio CAD (Labeled)
          </button>
          <button
            onClick={() => setHudMode("webgl")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              hudMode === "webgl"
                ? "bg-pitwall-cyan text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            3D Orbit
          </button>
          <button
            onClick={() => setHudMode("wireframe")}
            className={`px-2.5 py-1 rounded font-bold transition-all ${
              hudMode === "wireframe"
                ? "bg-pitwall-cyan text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Telemetry Wireframe
          </button>
        </div>
      </div>

      {/* Mode 1: Studio 3D CAD Image with Precision Telemetry Callouts */}
      {hudMode === "cad_image" && (
        <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-b from-[#141822] to-[#0c0e14] rounded-lg overflow-hidden border border-white/5">
          {/* Studio 3D Car Image */}
          <div className="relative w-full h-full flex items-center justify-center max-w-[540px] px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/f1_car_studio.jpg"
              alt="Formula 1 3D CAD Telemetry Inspection"
              className="w-full h-auto max-h-[300px] object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] filter brightness-105"
            />

            {/* Interactive Telemetry Callout: Front-Right Tyre */}
            <div className="absolute top-[52%] left-[12%] flex flex-col items-end animate-in fade-in">
              <div className="flex items-center space-x-1.5">
                <span
                  className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
                    frStatus.isCritical
                      ? "bg-red-600/90 border-red-400 animate-pulse"
                      : frStatus.wear >= 50
                      ? "bg-amber-600/90 border-amber-400"
                      : "bg-cyan-600/90 border-cyan-400"
                  }`}
                >
                  {frStatus.label}
                </span>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <span className="text-[8px] font-mono text-gray-400 mt-0.5">Contact Patch: 24.4 PSI</span>
            </div>

            {/* Interactive Telemetry Callout: Front-Left Tyre */}
            <div className="absolute top-[52%] right-[12%] flex flex-col items-start animate-in fade-in">
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span
                  className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
                    flStatus.isCritical
                      ? "bg-red-600/90 border-red-400 animate-pulse"
                      : flStatus.wear >= 50
                      ? "bg-amber-600/90 border-amber-400"
                      : "bg-cyan-600/90 border-cyan-400"
                  }`}
                >
                  {flStatus.label}
                </span>
              </div>
              <span className="text-[8px] font-mono text-gray-400 mt-0.5">Contact Patch: 24.8 PSI</span>
            </div>

            {/* Interactive Telemetry Callout: Rear-Right Tyre */}
            <div className="absolute top-[28%] left-[20%] flex flex-col items-end">
              <span
                className={`rounded px-1.5 py-0.5 text-[8.5px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
                  rrStatus.isCritical
                    ? "bg-red-600/90 border-red-400 animate-pulse"
                    : rrStatus.wear >= 50
                    ? "bg-amber-600/90 border-amber-400"
                    : "bg-cyan-600/90 border-cyan-400"
                }`}
              >
                {rrStatus.label}
              </span>
            </div>

            {/* Interactive Telemetry Callout: Rear-Left Tyre */}
            <div className="absolute top-[28%] right-[20%] flex flex-col items-start">
              <span
                className={`rounded px-1.5 py-0.5 text-[8.5px] font-mono font-bold text-white shadow-xl border whitespace-nowrap ${
                  rlStatus.isCritical
                    ? "bg-red-600/90 border-red-400 animate-pulse"
                    : rlStatus.wear >= 50
                    ? "bg-amber-600/90 border-amber-400"
                    : "bg-cyan-600/90 border-cyan-400"
                }`}
              >
                {rlStatus.label}
              </span>
            </div>

            {/* Front Wing Aero Balance Callout */}
            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 bg-black/85 border border-white/10 px-2.5 py-1 rounded text-[9.5px] font-mono text-center shadow-2xl backdrop-blur">
              <span className="text-pitwall-cyan font-bold">Front Aero Wing: </span>
              <span className="text-gray-300">-4.2G Downforce Load (Flap Angle +1.5°)</span>
            </div>

            {/* Halo Structure Callout */}
            <div className="absolute top-[34%] left-1/2 -translate-x-1/2 bg-black/85 border border-white/10 px-2 py-0.5 rounded text-[8.5px] font-mono text-gray-300 shadow">
              <span className="text-emerald-400 font-bold">Halo Ti-Structure: </span>
              <span>125kN Nominal</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Interactive 3D WebGL Canvas */}
      {hudMode === "webgl" && (
        <div className="h-full w-full cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [0, 4.0, 6.2], fov: 42 }} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={1.8} />
            <directionalLight position={[10, 20, 15]} intensity={2.4} color="#ffffff" />
            <directionalLight position={[-10, 15, -10]} intensity={1.5} color="#e0f2fe" />
            <pointLight position={[0, 5, 4]} intensity={1.2} color="#ffffff" />

            <Suspense fallback={<ProceduralF1Chassis flStatus={flStatus} frStatus={frStatus} rlStatus={rlStatus} rrStatus={rrStatus} />}>
              <GLTFCarModel flStatus={flStatus} frStatus={frStatus} rlStatus={rlStatus} rrStatus={rrStatus} />
            </Suspense>

            <gridHelper args={[16, 16, "#2d3748", "#1a202c"]} position={[0, -0.22, 0]} />

            <OrbitControls
              enableDamping
              dampingFactor={0.06}
              autoRotate={autoRotate}
              autoRotateSpeed={0.8}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.1}
              minDistance={3.5}
              maxDistance={12.0}
            />
          </Canvas>
        </div>
      )}

      {/* Mode 3: Telemetry Wireframe CAD Canvas */}
      {hudMode === "wireframe" && (
        <div className="h-full w-full cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [0, 4.5, 6.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 15, 10]} intensity={2.0} />
            <pointLight position={[-10, 8, -5]} intensity={0.9} color="#00f0ff" />
            <pointLight position={[10, 8, 5]} intensity={0.9} color="#e10600" />

            <ProceduralF1Chassis flStatus={flStatus} frStatus={frStatus} rlStatus={rlStatus} rrStatus={rrStatus} />

            <gridHelper args={[16, 16, "#1f293d", "#0e111a"]} position={[0, -0.22, 0]} />

            <OrbitControls
              enableDamping
              dampingFactor={0.06}
              autoRotate={autoRotate}
              autoRotateSpeed={0.8}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.1}
              minDistance={3.5}
              maxDistance={12.0}
            />
          </Canvas>
        </div>
      )}

      {/* Thermal Degradation Status Footer Bar */}
      <div className="absolute bottom-2 left-4 right-4 z-20 flex items-center justify-between pointer-events-none text-[10px] font-mono">
        <div className="flex items-center space-x-3 bg-black/80 backdrop-blur border border-white/10 px-2 py-1 rounded">
          <span className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00e5ff]" />
            <span className="text-gray-300">&lt;50% Optimal</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff9100]" />
            <span className="text-gray-300">50-75% Degraded</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff1744] animate-pulse" />
            <span className="text-rose-400 font-bold">&gt;75% Grip Lost</span>
          </span>
        </div>
        <div className="text-gray-400">
          {hudMode === "cad_image" ? "High-res Studio CAD Inspection" : "Drag to orbit • Scroll to zoom"}
        </div>
      </div>
    </div>
  );
}
