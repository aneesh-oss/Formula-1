"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  CircuitGeometryResponse,
  CornerGeometry,
  fetchCircuitGeometry,
  TelemetryPoint,
} from "@/lib/api";

interface TrackMap3DProps {
  circuit?: string;
  year?: number;
  telemetry?: TelemetryPoint[];
  activeIndex?: number;
  driverA?: string;
  driverB?: string;
}

// Camera controller that smoothly interpolates position towards the selected corner
function CameraController({ targetPosition }: { targetPosition: THREE.Vector3 | null }) {
  const { camera } = useThree();
  useFrame(() => {
    if (targetPosition) {
      camera.position.lerp(
        new THREE.Vector3(targetPosition.x + 3.2, targetPosition.y + 2.8, targetPosition.z + 3.2),
        0.06
      );
    }
  });
  return null;
}

function SplineTrackScene({
  curve,
  tubeGeometry,
  corners,
  activeT_A,
  activeT_B,
  driverA,
  driverB,
  onSelectCorner,
  selectedCorner,
}: {
  curve: THREE.CatmullRomCurve3;
  tubeGeometry: THREE.TubeGeometry | null;
  corners: CornerGeometry[];
  activeT_A: number;
  activeT_B: number;
  driverA: string;
  driverB: string;
  onSelectCorner: (c: CornerGeometry | null) => void;
  selectedCorner: CornerGeometry | null;
}) {
  const carAPos = useMemo(
    () => curve.getPointAt(Math.max(0, Math.min(1, activeT_A))),
    [curve, activeT_A]
  );
  const carBPos = useMemo(
    () => curve.getPointAt(Math.max(0, Math.min(1, activeT_B))),
    [curve, activeT_B]
  );

  return (
    <group>
      {/* 1. Volumetric 3D Road Ribbon with Vertex Colors (Sector 1 Cyan, Sector 2 Amber, Sector 3 Purple) */}
      {tubeGeometry && (
        <mesh geometry={tubeGeometry}>
          <meshStandardMaterial
            vertexColors
            roughness={0.35}
            metalness={0.65}
          />
        </mesh>
      )}

      {/* 2. Glowing White/Cyan Centerline Ribbon */}
      <mesh>
        <tubeGeometry args={[curve, 300, 0.08, 8, true]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00f0ff"
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* 3. Car 1 Moving Position Beacon */}
      <group position={carAPos}>
        <mesh>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial
            color="#3671c6"
            emissive="#3671c6"
            emissiveIntensity={1.2}
            roughness={0.2}
          />
        </mesh>
        <Html position={[0, 0.95, 0]} center distanceFactor={14}>
          <div className="pointer-events-none rounded bg-blue-600/90 border border-blue-400 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-lg whitespace-nowrap">
            {driverA}
          </div>
        </Html>
      </group>

      {/* 4. Car 2 Moving Position Beacon */}
      <group position={carBPos}>
        <mesh>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial
            color="#ff8000"
            emissive="#ff8000"
            emissiveIntensity={1.2}
            roughness={0.2}
          />
        </mesh>
        <Html position={[0, 0.95, 0]} center distanceFactor={14}>
          <div className="pointer-events-none rounded bg-orange-600/90 border border-orange-400 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-lg whitespace-nowrap">
            {driverB}
          </div>
        </Html>
      </group>

      {/* 5. Dynamic Corner Pins & Badges */}
      {corners.map((c) => {
        const isSelected = selectedCorner?.number === c.number && selectedCorner?.letter === c.letter;
        const turnLabel = `T${c.number}${c.letter}`;
        const cornerPos = new THREE.Vector3(c.x, c.y, c.z);

        return (
          <group key={`${c.number}-${c.letter}`} position={cornerPos}>
            {/* Visual 3D Anchor Pin */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
              <meshBasicMaterial color={isSelected ? "#e10600" : "#00f0ff"} />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
              <sphereGeometry args={[0.18, 14, 14]} />
              <meshStandardMaterial
                color={isSelected ? "#e10600" : "#00f0ff"}
                emissive={isSelected ? "#e10600" : "#00f0ff"}
                emissiveIntensity={1.0}
              />
            </mesh>

            {/* Interactive HTML Turn Badge */}
            <Html position={[0, 1.4, 0]} center distanceFactor={13}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCorner(isSelected ? null : c);
                }}
                className={`cursor-pointer rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold shadow-2xl transition-all border ${
                  isSelected
                    ? "bg-pitwall-red text-white border-white scale-110 ring-2 ring-white/50"
                    : "bg-pitwall-panel/90 text-gray-200 border-pitwall-cyan/50 hover:border-pitwall-cyan hover:scale-110 hover:text-white"
                }`}
              >
                <span>{turnLabel}</span>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Ground Grid Floor */}
      <gridHelper args={[48, 48, "#1f293d", "#0e111a"]} position={[0, -0.6, 0]} />
    </group>
  );
}

export default function TrackMap3D({
  circuit = "monza",
  year = 2024,
  telemetry = [],
  activeIndex = 0,
  driverA = "VER",
  driverB = "NOR",
}: TrackMap3DProps) {
  const [geometryData, setGeometryData] = useState<CircuitGeometryResponse | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<CornerGeometry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ingest dynamic circuit geometry when circuit changes
  useEffect(() => {
    let isMounted = true;
    async function loadGeometry() {
      setIsLoading(true);
      try {
        const data = await fetchCircuitGeometry(year, circuit);
        if (isMounted) {
          setGeometryData(data);
          setSelectedCorner(null);
        }
      } catch (err) {
        console.error("Failed to load dynamic circuit geometry:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadGeometry();
    return () => {
      isMounted = false;
    };
  }, [circuit, year]);

  // Construct CatmullRomCurve3 from returned spline points
  const curve = useMemo(() => {
    if (!geometryData || !geometryData.spline_points.length) {
      // Default initial points before data loads
      const fallbackPoints = [
        new THREE.Vector3(-10, 0, -5),
        new THREE.Vector3(10, 0, -5),
        new THREE.Vector3(10, 0, 5),
        new THREE.Vector3(-10, 0, 5),
      ];
      return new THREE.CatmullRomCurve3(fallbackPoints, true);
    }
    const points = geometryData.spline_points.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z)
    );
    return new THREE.CatmullRomCurve3(points, true, "centripetal");
  }, [geometryData]);

  // Construct TubeGeometry with vertex colors mapped to Sector 1, 2, and 3
  const tubeGeometry = useMemo(() => {
    if (!curve) return null;
    const tubularSegments = 300;
    const radialSegments = 8;
    const geom = new THREE.TubeGeometry(curve, tubularSegments, 0.45, radialSegments, true);

    const colors: number[] = [];
    const rings = tubularSegments + 1;
    const vertsPerRing = radialSegments + 1;
    const s1End = geometryData?.sectors.s1_end_dist || 1420;
    const s2End = geometryData?.sectors.s2_end_dist || 3890;
    const trackLen = geometryData?.track_length_meters || 5793;

    // Sector Colors: S1 = Cyan, S2 = Amber, S3 = Purple
    const colorS1 = new THREE.Color("#00f0ff");
    const colorS2 = new THREE.Color("#f59e0b");
    const colorS3 = new THREE.Color("#a855f7");

    for (let i = 0; i < rings; i++) {
      const frac = (i % tubularSegments) / tubularSegments;
      const dist = frac * trackLen;
      let c = colorS1;
      if (dist > s2End) {
        c = colorS3;
      } else if (dist > s1End) {
        c = colorS2;
      }
      for (let j = 0; j < vertsPerRing; j++) {
        colors.push(c.r, c.g, c.b);
      }
    }
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geom;
  }, [curve, geometryData]);

  // Distance tracking for Car A and Car B
  const totalPoints = Math.max(1, telemetry.length);
  const activeT_A = activeIndex / totalPoints;
  const activeT_B = Math.max(0, (activeIndex - 6) / totalPoints);

  // Target position for camera focusing
  const targetCameraPos = useMemo(() => {
    if (!selectedCorner) return null;
    return new THREE.Vector3(selectedCorner.x, selectedCorner.y, selectedCorner.z);
  }, [selectedCorner]);

  return (
    <div className="relative flex flex-col h-[420px] w-full rounded-xl border border-pitwall-border bg-pitwall-panel p-3 shadow-2xl overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-pitwall-red animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-pitwall-cyan font-bold">
              Universal 3D Track Spline &amp; Elevation
            </span>
          </div>
          <h3 className="text-sm font-black text-white font-mono mt-0.5">
            {geometryData?.circuit_name || circuit.toUpperCase()} —{" "}
            {geometryData ? (geometryData.track_length_meters / 1000).toFixed(3) : "5.793"} km
          </h3>
        </div>

        {/* Sector Legend & Quick Corner Selector */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Sector Badges */}
          <div className="hidden sm:flex items-center space-x-2 bg-black/80 backdrop-blur border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono">
            <span className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-cyan-300 font-bold">S1</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-amber-300 font-bold">S2</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="text-purple-300 font-bold">S3</span>
            </span>
          </div>

          {/* Quick Turn Pills Scroll Container */}
          <div className="flex items-center space-x-1 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-1 max-w-[220px] overflow-x-auto no-scrollbar">
            {(geometryData?.corners || []).map((c) => {
              const turnLabel = `T${c.number}${c.letter}`;
              const isSelected = selectedCorner?.number === c.number && selectedCorner?.letter === c.letter;
              return (
                <button
                  key={`${c.number}-${c.letter}`}
                  onClick={() => setSelectedCorner(isSelected ? null : c)}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-pitwall-cyan text-black"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {turnLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Corner Telemetry Detail Card Overlay */}
      {selectedCorner && (
        <div className="absolute bottom-3 left-4 z-10 w-80 rounded-lg border border-pitwall-cyan/50 bg-pitwall-card/95 p-3 shadow-2xl backdrop-blur font-mono animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-pitwall-border pb-1.5 mb-2">
            <div>
              <span className="text-[10px] text-pitwall-cyan font-bold uppercase">
                Turn {selectedCorner.number}{selectedCorner.letter} @ {selectedCorner.distance.toLocaleString()}m
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
              <span className="text-emerald-400 font-bold">
                {selectedCorner.apex_speed_kmh || 115.0} km/h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Braking Load:</span>
              <span className="text-rose-400 font-bold">
                {selectedCorner.braking_delta_g || "-4.2G"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gear Selection:</span>
              <span className="text-pitwall-cyan font-bold">
                Gear {selectedCorner.recommended_gear || 3}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sector Split:</span>
              <span className="text-white font-bold">Sector {selectedCorner.sector || 1}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-pitwall-panel/80 backdrop-blur font-mono text-xs text-pitwall-cyan">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-pitwall-cyan animate-ping" />
            <span>Generating 3D Spline Geometry for {circuit.toUpperCase()}...</span>
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <div className="h-full w-full cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 20, 20], fov: 46 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.65} />
          <directionalLight position={[15, 25, 10]} intensity={1.5} />
          <pointLight position={[-10, 10, -10]} intensity={0.9} color="#00f0ff" />
          <pointLight position={[10, 10, 10]} intensity={0.7} color="#e10600" />

          <CameraController targetPosition={targetCameraPos} />

          <SplineTrackScene
            curve={curve}
            tubeGeometry={tubeGeometry}
            corners={geometryData?.corners || []}
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
            maxDistance={42}
          />
        </Canvas>
      </div>

      <div className="absolute bottom-2 right-4 text-[10px] font-mono text-gray-500 pointer-events-none">
        Click any turn badge to zoom &amp; inspect apex telemetry
      </div>
    </div>
  );
}
