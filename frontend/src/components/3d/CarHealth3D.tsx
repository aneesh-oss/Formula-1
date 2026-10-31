"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { TireResponse } from "@/lib/api";

interface CarHealth3DProps {
  tireData?: TireResponse | null;
  driver?: string;
  autoRotate?: boolean;
}

// 3D Procedural F1 Car Model with dynamic tire color binding
function F1ChassisMesh({
  wearFL = 15,
  wearFR = 18,
  wearRL = 22,
  wearRR = 24,
  driver = "VER",
}: {
  wearFL?: number;
  wearFR?: number;
  wearRL?: number;
  wearRR?: number;
  driver?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const flMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const frMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const rlMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const rrMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const getTireColor = (wear: number): THREE.Color => {
    if (wear > 75) return new THREE.Color("#ef4444"); // Red: Grip Lost / Cliff
    if (wear >= 50) return new THREE.Color("#f59e0b"); // Amber: Degradation Active
    return new THREE.Color("#10b981"); // Green: Nominal Grip (<50%)
  };

  const colorFL = useMemo(() => getTireColor(wearFL), [wearFL]);
  const colorFR = useMemo(() => getTireColor(wearFR), [wearFR]);
  const colorRL = useMemo(() => getTireColor(wearRL), [wearRL]);
  const colorRR = useMemo(() => getTireColor(wearRR), [wearRR]);

  // Subtle pulsing glow for tires crossing the 75% grip loss cliff
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * 5);

    if (flMaterialRef.current && wearFL > 75) {
      flMaterialRef.current.emissiveIntensity = pulse;
    }
    if (frMaterialRef.current && wearFR > 75) {
      frMaterialRef.current.emissiveIntensity = pulse;
    }
    if (rlMaterialRef.current && wearRL > 75) {
      rlMaterialRef.current.emissiveIntensity = pulse;
    }
    if (rrMaterialRef.current && wearRR > 75) {
      rrMaterialRef.current.emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={[1, 1, 1]}>
      {/* 1. Main Monocoque Chassis */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.0, 0.4, 3.4]} />
        <meshStandardMaterial color="#12151d" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 2. Aerodynamic Nosecone */}
      <mesh position={[0, 0.35, 2.2]} rotation={[Math.PI / 16, 0, 0]}>
        <coneGeometry args={[0.35, 1.6, 16]} />
        <meshStandardMaterial color="#00f0ff" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* 3. Front Wing & Endplates */}
      <group position={[0, 0.2, 2.6]}>
        {/* Main wing flap */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#1a1e2b" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Left Endplate */}
        <mesh position={[-1.25, 0.15, 0]}>
          <boxGeometry args={[0.05, 0.35, 0.6]} />
          <meshStandardMaterial color="#e10600" />
        </mesh>
        {/* Right Endplate */}
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
        <meshStandardMaterial color="#2d3748" metalness={0.9} />
      </mesh>

      {/* 5. Engine Airbox & Fin */}
      <mesh position={[0, 0.85, -0.6]}>
        <boxGeometry args={[0.1, 0.5, 1.2]} />
        <meshStandardMaterial color="#12151d" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 6. Rear Wing Assembly */}
      <group position={[0, 0.9, -1.8]}>
        {/* Top Wing Plate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.0, 0.06, 0.5]} />
          <meshStandardMaterial color="#1a1e2b" metalness={0.7} />
        </mesh>
        {/* DRS Actuator Flap */}
        <mesh position={[0, 0.08, -0.1]}>
          <boxGeometry args={[1.8, 0.03, 0.3]} />
          <meshStandardMaterial color="#00f0ff" metalness={0.9} />
        </mesh>
        {/* Left Endplate */}
        <mesh position={[-1.0, -0.3, 0]}>
          <boxGeometry args={[0.05, 0.65, 0.6]} />
          <meshStandardMaterial color="#e10600" />
        </mesh>
        {/* Right Endplate */}
        <mesh position={[1.0, -0.3, 0]}>
          <boxGeometry args={[0.05, 0.65, 0.6]} />
          <meshStandardMaterial color="#e10600" />
        </mesh>
      </group>

      {/* 7. Four Wheels with Dynamic Color Binding */}
      {/* FRONT-LEFT WHEEL */}
      <group position={[-1.25, 0.36, 1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.36, 0.36, 0.35, 24]} />
          <meshStandardMaterial
            ref={flMaterialRef}
            color={colorFL}
            emissive={colorFL}
            emissiveIntensity={wearFL > 75 ? 0.8 : 0.15}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        {/* Inner Carbon Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.55, 0]} center distanceFactor={8}>
          <div className="pointer-events-none rounded bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow border border-white/20 whitespace-nowrap">
            FL: {wearFL.toFixed(0)}%
          </div>
        </Html>
      </group>

      {/* FRONT-RIGHT WHEEL */}
      <group position={[1.25, 0.36, 1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.36, 0.36, 0.35, 24]} />
          <meshStandardMaterial
            ref={frMaterialRef}
            color={colorFR}
            emissive={colorFR}
            emissiveIntensity={wearFR > 75 ? 0.8 : 0.15}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.55, 0]} center distanceFactor={8}>
          <div className="pointer-events-none rounded bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow border border-white/20 whitespace-nowrap">
            FR: {wearFR.toFixed(0)}%
          </div>
        </Html>
      </group>

      {/* REAR-LEFT WHEEL */}
      <group position={[-1.3, 0.38, -1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.44, 24]} />
          <meshStandardMaterial
            ref={rlMaterialRef}
            color={colorRL}
            emissive={colorRL}
            emissiveIntensity={wearRL > 75 ? 0.8 : 0.15}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.45, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.55, 0]} center distanceFactor={8}>
          <div className="pointer-events-none rounded bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow border border-white/20 whitespace-nowrap">
            RL: {wearRL.toFixed(0)}%
          </div>
        </Html>
      </group>

      {/* REAR-RIGHT WHEEL */}
      <group position={[1.3, 0.38, -1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.44, 24]} />
          <meshStandardMaterial
            ref={rrMaterialRef}
            color={colorRR}
            emissive={colorRR}
            emissiveIntensity={wearRR > 75 ? 0.8 : 0.15}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.45, 16]} />
          <meshStandardMaterial color="#090a0f" metalness={0.9} />
        </mesh>
        <Html position={[0, 0.55, 0]} center distanceFactor={8}>
          <div className="pointer-events-none rounded bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow border border-white/20 whitespace-nowrap">
            RR: {wearRR.toFixed(0)}%
          </div>
        </Html>
      </group>

      {/* Underfloor Ground Shadow */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 5.5]} />
        <meshBasicMaterial color="#040608" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export default function CarHealth3D({
  tireData,
  driver = "VER",
  autoRotate = true,
}: CarHealth3DProps) {
  // Extract latest lap tire metrics or fallback to defaults
  const latest =
    tireData?.history && tireData.history.length > 0
      ? tireData.history[tireData.history.length - 1]
      : null;

  const wearFL = latest ? latest.max_wear_pct * 1.1 : 18;
  const wearFR = latest ? latest.max_wear_pct * 0.9 : 14;
  const wearRL = latest ? latest.max_wear_pct * 1.05 : 16;
  const wearRR = latest ? latest.max_wear_pct * 0.85 : 12;

  return (
    <div className="relative flex flex-col h-96 w-full rounded-xl border border-pitwall-border bg-pitwall-panel p-3 shadow-2xl overflow-hidden">
      {/* Top HUD Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-pitwall-cyan animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-pitwall-cyan font-bold">
              WebGL 3D Vehicle Dynamics HUD
            </span>
          </div>
          <h3 className="text-sm font-black text-white font-mono mt-0.5">
            {driver} Formula 1 Telemetry Binding
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-2 text-[10px] font-mono bg-black/70 backdrop-blur border border-white/10 rounded-lg px-2.5 py-1">
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-gray-300">&lt;50%</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-gray-300">50-75%</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-400">&gt;75% Cliff</span>
          </span>
        </div>
      </div>

      {/* Interactive 3D Canvas */}
      <div className="h-full w-full cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [3.5, 2.2, 4.0], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 15, 10]} intensity={1.4} castShadow />
          <pointLight position={[-8, 6, -6]} intensity={0.8} color="#00f0ff" />
          <pointLight position={[6, 4, 8]} intensity={0.6} color="#e10600" />

          <F1ChassisMesh
            wearFL={wearFL}
            wearFR={wearFR}
            wearRL={wearRL}
            wearRR={wearRR}
            driver={driver}
          />

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            maxPolarAngle={Math.PI / 2.05} // Do not go below floor
            minDistance={2.5}
            maxDistance={7.0}
          />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-2 left-4 text-[10px] font-mono text-gray-500 pointer-events-none">
        Click &amp; Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
