"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { TelemetryPoint } from "@/lib/api";

interface TrackMap3DProps {
  telemetry?: TelemetryPoint[];
  activeIndex?: number;
  driverA?: string;
  driverB?: string;
}

interface CornerMetadata {
  id: string;
  name: string;
  turnNumber: string;
  curveT: number; // 0.0 to 1.0 along the spline
  apexSpeedKmh: number;
  brakingDeltaG: string;
  recommendedGear: number;
  sector: number;
}

const MONZA_CORNERS: CornerMetadata[] = [
  {
    id: "t1",
    name: "Variante del Rettifilo",
    turnNumber: "T1-T2",
    curveT: 0.04,
    apexSpeedKmh: 74.5,
    brakingDeltaG: "-5.2G (from 352 km/h)",
    recommendedGear: 2,
    sector: 1,
  },
  {
    id: "t4",
    name: "Variante della Roggia",
    turnNumber: "T4-T5",
    curveT: 0.33,
    apexSpeedKmh: 118.2,
    brakingDeltaG: "-4.6G (from 328 km/h)",
    recommendedGear: 3,
    sector: 2,
  },
  {
    id: "t8",
    name: "Variante Ascari",
    turnNumber: "T8-T10",
    curveT: 0.74,
    apexSpeedKmh: 168.4,
    brakingDeltaG: "-3.8G (from 330 km/h)",
    recommendedGear: 5,
    sector: 3,
  },
  {
    id: "t11",
    name: "Curva Parabolica (Alboreto)",
    turnNumber: "T11",
    curveT: 0.89,
    apexSpeedKmh: 214.8,
    brakingDeltaG: "-2.1G Trail Braking",
    recommendedGear: 6,
    sector: 3,
  },
];

// Camera controller that smoothly animates to selected corner target
function CameraController({ targetPosition }: { targetPosition: THREE.Vector3 | null }) {
  const { camera } = useThree();
  useFrame(() => {
    if (targetPosition) {
      camera.position.lerp(
        new THREE.Vector3(targetPosition.x + 3.0, targetPosition.y + 2.5, targetPosition.z + 3.0),
        0.05
      );
    }
  });
  return null;
}

function SplineTrackScene({
  curve,
  activeT_A,
  activeT_B,
  driverA,
  driverB,
  onSelectCorner,
  selectedCorner,
}: {
  curve: THREE.CatmullRomCurve3;
  activeT_A: number;
  activeT_B: number;
  driverA: string;
  driverB: string;
  onSelectCorner: (c: CornerMetadata | null) => void;
  selectedCorner: CornerMetadata | null;
}) {
  const carAPos = useMemo(() => curve.getPointAt(Math.max(0, Math.min(1, activeT_A))), [curve, activeT_A]);
  const carBPos = useMemo(() => curve.getPointAt(Math.max(0, Math.min(1, activeT_B))), [curve, activeT_B]);

  // Corner pin 3D coordinates along spline
  const cornerPositions = useMemo(() => {
    return MONZA_CORNERS.map((c) => ({
      ...c,
      pos: curve.getPointAt(c.curveT),
    }));
  }, [curve]);

  return (
    <group>
      {/* 1. Volumetric 3D Track Ribbon */}
      <mesh>
        <tubeGeometry args={[curve, 260, 0.45, 12, true]} />
        <meshStandardMaterial color="#1a202c" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* 2. Glowing Centerline Track Ribbon */}
      <mesh>
        <tubeGeometry args={[curve, 260, 0.08, 8, true]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.6} />
      </mesh>

      {/* 3. Car 1 Moving Position Marker */}
      <group position={carAPos}>
        <mesh>
          <sphereGeometry args={[0.42, 20, 20]} />
          <meshStandardMaterial
            color="#3671c6"
            emissive="#3671c6"
            emissiveIntensity={0.9}
            roughness={0.2}
          />
        </mesh>
        <Html position={[0, 0.9, 0]} center distanceFactor={14}>
          <div className="pointer-events-none rounded bg-blue-600/90 border border-blue-400 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-lg whitespace-nowrap">
            {driverA}
          </div>
        </Html>
      </group>

      {/* 4. Car 2 Moving Position Marker */}
      <group position={carBPos}>
        <mesh>
          <sphereGeometry args={[0.42, 20, 20]} />
          <meshStandardMaterial
            color="#ff8000"
            emissive="#ff8000"
            emissiveIntensity={0.9}
            roughness={0.2}
          />
        </mesh>
        <Html position={[0, 0.9, 0]} center distanceFactor={14}>
          <div className="pointer-events-none rounded bg-orange-600/90 border border-orange-400 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-lg whitespace-nowrap">
            {driverB}
          </div>
        </Html>
      </group>

      {/* 5. Interactive 3D Sector & Turn HTML Pins */}
      {cornerPositions.map((c) => {
        const isSelected = selectedCorner?.id === c.id;
        return (
          <group key={c.id} position={c.pos}>
            {/* Visual 3D Anchor Pin */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
              <meshBasicMaterial color={isSelected ? "#e10600" : "#00f0ff"} />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial
                color={isSelected ? "#e10600" : "#00f0ff"}
                emissive={isSelected ? "#e10600" : "#00f0ff"}
                emissiveIntensity={0.8}
              />
            </mesh>

            {/* Interactive HTML Popup */}
            <Html position={[0, 1.4, 0]} center distanceFactor={12}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCorner(isSelected ? null : c);
                }}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-mono font-bold shadow-xl transition-all border ${
                  isSelected
                    ? "bg-pitwall-red text-white border-white scale-110"
                    : "bg-pitwall-panel/95 text-gray-200 border-pitwall-cyan/50 hover:border-pitwall-cyan hover:scale-105"
                }`}
              >
                <span>{c.turnNumber}</span>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Ground Grid Floor */}
      <gridHelper args={[40, 40, "#1f293d", "#0e111a"]} position={[0, -0.6, 0]} />
    </group>
  );
}

export default function TrackMap3D({
  telemetry = [],
  activeIndex = 0,
  driverA = "VER",
  driverB = "NOR",
}: TrackMap3DProps) {
  const [selectedCorner, setSelectedCorner] = useState<CornerMetadata | null>(null);

  // Generate 3D Spline Curve with Elevation
  const { curve, totalDistance } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const lapLen = 5793.0;
    const numPts = 120;

    for (let i = 0; i < numPts; i++) {
      const frac = i / numPts;
      const angle = frac * 2 * Math.PI;

      // Planar geometry scaled down to 3D space
      const x = (1000.0 * Math.cos(angle) + 200.0 * Math.sin(2 * angle)) * 0.012;
      const z = (600.0 * Math.sin(angle) + 150.0 * Math.sin(3 * angle)) * 0.012;

      // Vertical elevation changes (Monza contour: rise into Lesmo, drop down to Ascari)
      const y = Math.sin(frac * 4 * Math.PI) * 0.65;

      points.push(new THREE.Vector3(x, y, z));
    }

    const catmull = new THREE.CatmullRomCurve3(points, true, "centripetal");
    return { curve: catmull, totalDistance: lapLen };
  }, []);

  const totalPoints = Math.max(1, telemetry.length);
  const activeT_A = activeIndex / totalPoints;
  const activeT_B = Math.max(0, (activeIndex - 6) / totalPoints);

  const targetCameraPos = useMemo(() => {
    if (!selectedCorner) return null;
    return curve.getPointAt(selectedCorner.curveT);
  }, [selectedCorner, curve]);

  return (
    <div className="relative flex flex-col h-[420px] w-full rounded-xl border border-pitwall-border bg-pitwall-panel p-3 shadow-2xl overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-pitwall-red animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-pitwall-cyan font-bold">
              3D Spline Track Ribbon &amp; Elevation
            </span>
          </div>
          <h3 className="text-sm font-black text-white font-mono mt-0.5">
            Autodromo Nazionale Monza — 5.793 km
          </h3>
        </div>

        {/* Turn Selector Pills */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-black/75 backdrop-blur border border-white/10 rounded-lg p-1">
          {MONZA_CORNERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCorner(selectedCorner?.id === c.id ? null : c)}
              className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold transition-all ${
                selectedCorner?.id === c.id
                  ? "bg-pitwall-cyan text-black"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {c.turnNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Corner Telemetry Detail Card Overlay */}
      {selectedCorner && (
        <div className="absolute bottom-3 left-4 z-10 w-72 rounded-lg border border-pitwall-cyan/40 bg-pitwall-card/95 p-3 shadow-2xl backdrop-blur font-mono animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-pitwall-border pb-1.5 mb-2">
            <div>
              <span className="text-[10px] text-pitwall-cyan font-bold uppercase">
                {selectedCorner.turnNumber} Analysis
              </span>
              <h4 className="text-xs font-bold text-white">{selectedCorner.name}</h4>
            </div>
            <button
              onClick={() => setSelectedCorner(null)}
              className="text-gray-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Apex Speed:</span>
              <span className="text-emerald-400 font-bold">{selectedCorner.apexSpeedKmh} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Braking Load:</span>
              <span className="text-rose-400 font-bold">{selectedCorner.brakingDeltaG}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gear Selection:</span>
              <span className="text-pitwall-cyan font-bold">Gear {selectedCorner.recommendedGear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sector:</span>
              <span className="text-white">Sector {selectedCorner.sector}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <div className="h-full w-full cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 18, 18], fov: 46 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[15, 25, 10]} intensity={1.5} />
          <pointLight position={[-10, 10, -10]} intensity={0.9} color="#00f0ff" />
          <pointLight position={[10, 10, 10]} intensity={0.7} color="#e10600" />

          <CameraController targetPosition={targetCameraPos} />

          <SplineTrackScene
            curve={curve}
            activeT_A={activeT_A}
            activeT_B={activeT_B}
            driverA={driverA}
            driverB={driverB}
            onSelectCorner={setSelectedCorner}
            selectedCorner={selectedCorner}
          />

          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={8}
            maxDistance={38}
          />
        </Canvas>
      </div>

      <div className="absolute bottom-2 right-4 text-[10px] font-mono text-gray-500 pointer-events-none">
        Click any corner pin to zoom &amp; inspect apex telemetry
      </div>
    </div>
  );
}
