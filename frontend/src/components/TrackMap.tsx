"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircuitGeometryResponse,
  CornerGeometry,
  fetchCircuitGeometry,
  TelemetryPoint,
} from "@/lib/api";

interface TrackMapProps {
  circuit?: string;
  year?: number;
  telemetry?: TelemetryPoint[];
  activeIndex?: number;
  driverACode?: string;
  driverBCode?: string;
  sectorHighlights?: {
    s1?: { driver: string; color: string; time: number };
    s2?: { driver: string; color: string; time: number };
    s3?: { driver: string; color: string; time: number };
  };
}

export default function TrackMap({
  circuit = "spielberg",
  year = 2024,
  telemetry = [],
  activeIndex = 0,
  driverACode = "VER",
  driverBCode = "NOR",
  sectorHighlights,
}: TrackMapProps) {
  const [geometryData, setGeometryData] = useState<CircuitGeometryResponse | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<CornerGeometry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Ingest dynamic circuit geometry when circuit changes
  useEffect(() => {
    let isMounted = true;
    async function loadGeometry() {
      setLoading(true);
      try {
        const data = await fetchCircuitGeometry(year, circuit);
        if (isMounted) {
          setGeometryData(data);
          setSelectedCorner(null);
        }
      } catch (err) {
        console.error("Failed to load 2D circuit geometry:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGeometry();
    return () => {
      isMounted = false;
    };
  }, [circuit, year]);

  // Project 3D/spline coordinates onto 2D SVG canvas (viewBox 520 x 360)
  const { pathS1, pathS2, pathS3, startPoint, cornerMarkers, carPointA, carPointB, s1EndCoord, s2EndCoord } = useMemo(() => {
    if (!geometryData || !geometryData.spline_points.length) {
      return {
        pathS1: "",
        pathS2: "",
        pathS3: "",
        startPoint: { x: 260, y: 180 },
        cornerMarkers: [],
        carPointA: null,
        carPointB: null,
        s1EndCoord: null,
        s2EndCoord: null,
      };
    }

    const pts = geometryData.spline_points;
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[2]); // Z is ground horizontal coordinate

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;

    // Viewport with padding
    const width = 440;
    const height = 280;
    const offsetX = 40;
    const offsetY = 40;

    const toSvg = (x: number, z: number) => ({
      x: Math.round((offsetX + ((x - minX) / rangeX) * width) * 10) / 10,
      y: Math.round((offsetY + ((z - minZ) / rangeZ) * height) * 10) / 10,
    });

    const s1End = geometryData.sectors.s1_end_dist;
    const s2End = geometryData.sectors.s2_end_dist;
    const trackLen = geometryData.track_length_meters;

    const s1Svg: string[] = [];
    const s2Svg: string[] = [];
    const s3Svg: string[] = [];
    let s1EndPt = { x: 0, y: 0 };
    let s2EndPt = { x: 0, y: 0 };

    pts.forEach((p, idx) => {
      const dist = (idx / (pts.length - 1)) * trackLen;
      const coord = toSvg(p[0], p[2]);
      const ptStr = `${coord.x},${coord.y}`;

      if (dist <= s1End) {
        s1Svg.push(ptStr);
        s1EndPt = coord;
      } else if (dist <= s2End) {
        s2Svg.push(ptStr);
        s2EndPt = coord;
      } else {
        s3Svg.push(ptStr);
      }
    });

    // Compute SVG paths for 3 distinct sector segments
    const pathS1 = s1Svg.length ? `M ${s1Svg.join(" L ")}` : "";
    const pathS2 = s2Svg.length ? `M ${s1Svg[s1Svg.length - 1] || s2Svg[0]} L ${s2Svg.join(" L ")}` : "";
    const pathS3 = s3Svg.length ? `M ${s2Svg[s2Svg.length - 1] || s3Svg[0]} L ${s3Svg.join(" L ")} Z` : "";

    // Map corner badges
    const cornerMarkers = (geometryData.corners || []).map((c) => {
      const coord = toSvg(c.x, c.z);
      return {
        ...c,
        svgX: coord.x,
        svgY: coord.y,
      };
    });

    // Active car position dots
    const totalTel = Math.max(1, telemetry.length);
    const fracA = Math.max(0, Math.min(1, activeIndex / totalTel));
    const fracB = Math.max(0, Math.min(1, (activeIndex - 6) / totalTel));

    const idxA = Math.min(pts.length - 1, Math.floor(fracA * pts.length));
    const idxB = Math.min(pts.length - 1, Math.floor(fracB * pts.length));

    const carPointA = toSvg(pts[idxA][0], pts[idxA][2]);
    const carPointB = toSvg(pts[idxB][0], pts[idxB][2]);
    const startPoint = toSvg(pts[0][0], pts[0][2]);

    return {
      pathS1,
      pathS2,
      pathS3,
      startPoint,
      cornerMarkers,
      carPointA,
      carPointB,
      s1EndCoord: s1EndPt,
      s2EndCoord: s2EndPt,
    };
  }, [geometryData, telemetry, activeIndex]);

  return (
    <div className="relative flex flex-col rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-xl">
      {/* Header */}
      <div className="flex w-full items-center justify-between border-b border-pitwall-border/60 pb-3 mb-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              Official 2D Circuit Map &amp; Sector Splits
            </h3>
          </div>
          <p className="text-[11px] text-pitwall-cyan font-mono mt-0.5 font-bold">
            {geometryData?.circuit_name || circuit.toUpperCase()} —{" "}
            {geometryData ? (geometryData.track_length_meters / 1000).toFixed(3) : "4.318"} km
          </p>
        </div>

        {/* Sector Legend */}
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <span className="flex items-center space-x-1 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-cyan-300 font-bold">Sector 1</span>
          </span>
          <span className="flex items-center space-x-1 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-bold">Sector 2</span>
          </span>
          <span className="flex items-center space-x-1 bg-black/60 px-2 py-0.5 rounded border border-purple-500/30">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-purple-300 font-bold">Sector 3</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[520/360] flex items-center justify-center bg-pitwall-card/40 rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="flex items-center space-x-2 text-xs font-mono text-pitwall-cyan">
            <span className="h-2 w-2 rounded-full bg-pitwall-cyan animate-ping" />
            <span>Rendering authentic 2D layout...</span>
          </div>
        ) : (
          <svg viewBox="0 0 520 360" className="w-full h-full">
            {/* Grid background lines */}
            <defs>
              <pattern id="grid2d" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161b26" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2d)" />

            {/* Circuit Background Outer Casing */}
            <path
              d={`${pathS1} ${pathS2} ${pathS3}`}
              fill="none"
              stroke="#0b0e14"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`${pathS1} ${pathS2} ${pathS3}`}
              fill="none"
              stroke="#1f2738"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Sector 1: Cyan (#00f0ff) */}
            <path
              d={pathS1}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_6px_#00f0ff]"
            />

            {/* Sector 2: Amber (#f59e0b) */}
            <path
              d={pathS2}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_6px_#f59e0b]"
            />

            {/* Sector 3: Purple (#a855f7) */}
            <path
              d={pathS3}
              fill="none"
              stroke="#a855f7"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_6px_#a855f7]"
            />

            {/* Sector Split Boundary Markers */}
            {s1EndCoord && (
              <g>
                <circle cx={s1EndCoord.x} cy={s1EndCoord.y} r="5" fill="#ffffff" stroke="#00f0ff" strokeWidth="2" />
                <text x={s1EndCoord.x + 8} y={s1EndCoord.y - 6} fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  S1 SPLIT
                </text>
              </g>
            )}
            {s2EndCoord && (
              <g>
                <circle cx={s2EndCoord.x} cy={s2EndCoord.y} r="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
                <text x={s2EndCoord.x + 8} y={s2EndCoord.y - 6} fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  S2 SPLIT
                </text>
              </g>
            )}

            {/* Start / Finish Checkered Line */}
            {startPoint && (
              <g>
                <line
                  x1={startPoint.x - 7}
                  y1={startPoint.y - 10}
                  x2={startPoint.x + 7}
                  y2={startPoint.y + 10}
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeDasharray="3 3"
                />
                <text x={startPoint.x - 22} y={startPoint.y + 20} fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  START / FINISH
                </text>
              </g>
            )}

            {/* Car 2 Active Beacon (Orange) */}
            {carPointB && (
              <g>
                <circle
                  cx={carPointB.x}
                  cy={carPointB.y}
                  r="7"
                  fill="#ff8000"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="drop-shadow-[0_0_10px_#ff8000]"
                />
                <rect x={carPointB.x - 14} y={carPointB.y - 20} width="28" height="13" rx="3" fill="#ff8000" />
                <text
                  x={carPointB.x}
                  y={carPointB.y - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {driverBCode}
                </text>
              </g>
            )}

            {/* Car 1 Active Beacon (Cyan/Blue) */}
            {carPointA && (
              <g>
                <circle
                  cx={carPointA.x}
                  cy={carPointA.y}
                  r="8"
                  fill="#3671c6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_10px_#3671c6]"
                />
                <rect x={carPointA.x - 14} y={carPointA.y - 20} width="28" height="13" rx="3" fill="#3671c6" />
                <text
                  x={carPointA.x}
                  y={carPointA.y - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {driverACode}
                </text>
              </g>
            )}

            {/* Authentic Corner Badges */}
            {cornerMarkers.map((c) => {
              const isSelected = selectedCorner?.number === c.number && selectedCorner?.letter === c.letter;
              const turnLabel = `T${c.number}${c.letter}`;
              return (
                <g
                  key={`${c.number}-${c.letter}`}
                  onClick={() => setSelectedCorner(isSelected ? null : c)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={c.svgX}
                    cy={c.svgY}
                    r={isSelected ? "9" : "7.5"}
                    fill={isSelected ? "#e10600" : "#111622"}
                    stroke={isSelected ? "#ffffff" : "#00f0ff"}
                    strokeWidth={isSelected ? "2" : "1.5"}
                    className="transition-all"
                  />
                  <text
                    x={c.svgX}
                    y={c.svgY + 3}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#00f0ff"}
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {turnLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Selected Corner Telemetry Popover */}
        {selectedCorner && (
          <div className="absolute bottom-3 left-4 z-10 w-72 rounded-lg border border-pitwall-cyan/70 bg-pitwall-card/95 p-3 shadow-2xl backdrop-blur font-mono animate-in fade-in">
            <div className="flex items-center justify-between border-b border-pitwall-border pb-1 mb-2">
              <span className="text-[10px] text-pitwall-cyan font-bold uppercase">
                Turn {selectedCorner.number}{selectedCorner.letter} @ {selectedCorner.distance.toLocaleString()}m
              </span>
              <button
                onClick={() => setSelectedCorner(null)}
                className="text-gray-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <h4 className="text-xs font-bold text-white mb-1.5">{selectedCorner.name}</h4>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div>
                <span className="text-gray-400 text-[10px]">Apex Speed: </span>
                <span className="text-emerald-400 font-bold">{selectedCorner.apex_speed_kmh || 120} km/h</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px]">Braking Delta: </span>
                <span className="text-rose-400 font-bold">{selectedCorner.braking_delta_g || "-4.2G"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px]">Gear: </span>
                <span className="text-pitwall-cyan font-bold">Gear {selectedCorner.recommended_gear || 3}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px]">Sector: </span>
                <span className="text-white font-bold">Sector {selectedCorner.sector || 1}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex w-full items-center justify-between border-t border-pitwall-border/40 pt-2 text-[11px] font-mono text-gray-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3671c6]" />
            <span className="text-white font-bold">{driverACode} (Car 1)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff8000]" />
            <span className="text-white font-bold">{driverBCode} (Car 2)</span>
          </span>
        </div>
        <div className="text-[10px] text-gray-500">
          Click any corner badge (T1–T{geometryData?.corners.length || 10}) for apex telemetry
        </div>
      </div>
    </div>
  );
}
