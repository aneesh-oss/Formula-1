"use client";

import { useMemo } from "react";
import { TelemetryPoint } from "@/lib/api";

interface TrackMapProps {
  telemetry: TelemetryPoint[];
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
  telemetry,
  activeIndex = 0,
  driverACode = "VER",
  driverBCode = "NOR",
  sectorHighlights = {
    s1: { driver: "VER", color: "#a855f7", time: 27.124 },
    s2: { driver: "NOR", color: "#a855f7", time: 27.652 },
    s3: { driver: "LEC", color: "#a855f7", time: 26.310 },
  },
}: TrackMapProps) {
  // Normalize coordinates into an SVG viewBox (500x340)
  const { pathS1, pathS2, pathS3, activePointA, activePointB, splitMarkers } = useMemo(() => {
    if (!telemetry || telemetry.length === 0) {
      return { pathS1: "", pathS2: "", pathS3: "", activePointA: null, activePointB: null, splitMarkers: [] };
    }

    const xs = telemetry.map((p) => p.x_a);
    const ys = telemetry.map((p) => p.y_a);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const width = 460;
    const height = 290;
    const pad = 20;

    const totalDistance = telemetry[telemetry.length - 1].distance || 5793.0;

    // Segment telemetry by sector distance:
    // Sector 1: 0m to 1680m
    // Sector 2: 1680m to 4220m
    // Sector 3: 4220m to end
    const s1Pts: string[] = [];
    const s2Pts: string[] = [];
    const s3Pts: string[] = [];
    let split1Point = { x: 0, y: 0 };
    let split2Point = { x: 0, y: 0 };

    telemetry.forEach((p) => {
      const sx = pad + ((p.x_a - minX) / rangeX) * width;
      const sy = pad + (1 - (p.y_a - minY) / rangeY) * height;
      const ptStr = `${sx.toFixed(1)},${sy.toFixed(1)}`;

      if (p.distance <= 1680.0) {
        s1Pts.push(ptStr);
        split1Point = { x: sx, y: sy };
      } else if (p.distance <= 4220.0) {
        s2Pts.push(ptStr);
        split2Point = { x: sx, y: sy };
      } else {
        s3Pts.push(ptStr);
      }
    });

    const activeP = telemetry[Math.min(activeIndex, telemetry.length - 1)];
    const curAx = pad + ((activeP.x_a - minX) / rangeX) * width;
    const curAy = pad + (1 - (activeP.y_a - minY) / rangeY) * height;

    const curBx = pad + ((activeP.x_b - minX) / rangeX) * width;
    const curBy = pad + (1 - (activeP.y_b - minY) / rangeY) * height;

    return {
      pathS1: s1Pts.length > 0 ? `M ${s1Pts.join(" L ")}` : "",
      pathS2: s2Pts.length > 0 ? `M ${s1Pts[s1Pts.length - 1]} L ${s2Pts.join(" L ")}` : "",
      pathS3: s3Pts.length > 0 ? `M ${s2Pts[s2Pts.length - 1]} L ${s3Pts.join(" L ")} Z` : "",
      activePointA: { x: curAx, y: curAy },
      activePointB: { x: curBx, y: curBy },
      splitMarkers: [
        { label: "S1 SPLIT", ...split1Point },
        { label: "S2 SPLIT", ...split2Point },
      ],
    };
  }, [telemetry, activeIndex]);

  return (
    <div className="relative flex flex-col items-center justify-center rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-xl">
      <div className="flex w-full items-center justify-between border-b border-pitwall-border/60 pb-3 mb-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Track Geometry & Sector Splits
          </h3>
          <p className="text-[11px] text-gray-400 font-mono">
            Monza 5.793 km — Sector 1, Sector 2 & Sector 3
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-team-redbull" />
            <span className="text-gray-300 font-semibold">{driverACode}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-team-mclaren" />
            <span className="text-gray-300 font-semibold">{driverBCode}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[5/3.2] flex items-center justify-center">
        <svg viewBox="0 0 500 340" className="w-full h-full">
          {/* Circuit background casing */}
          <path d={`${pathS1} ${pathS2} ${pathS3}`} fill="none" stroke="#1b202c" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />

          {/* Sector 1 Segment (Cyan #00f0ff) */}
          <path d={pathS1} fill="none" stroke="#00f0ff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Sector 2 Segment (Emerald #10b981) */}
          <path d={pathS2} fill="none" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Sector 3 Segment (Purple #a855f7) */}
          <path d={pathS3} fill="none" stroke="#a855f7" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Sector Split Lines */}
          {splitMarkers.map((sm, idx) => (
            <g key={idx}>
              <circle cx={sm.x} cy={sm.y} r="4" fill="#ffffff" stroke="#e10600" strokeWidth="1.5" />
            </g>
          ))}

          {/* Active scrub position for Driver B */}
          {activePointB && (
            <circle
              cx={activePointB.x}
              cy={activePointB.y}
              r="6.5"
              fill="#ff8000"
              className="drop-shadow-[0_0_8px_#ff8000]"
            />
          )}

          {/* Active scrub position for Driver A */}
          {activePointA && (
            <circle
              cx={activePointA.x}
              cy={activePointA.y}
              r="6.5"
              fill="#3671c6"
              className="drop-shadow-[0_0_8px_#3671c6]"
            />
          )}
        </svg>

        {/* Turn callout labels */}
        <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400 bg-pitwall-card/90 border border-pitwall-border rounded px-2 py-0.5 shadow">
          S1: Rettifilo & Curva Grande
        </div>
        <div className="absolute top-2 right-3 text-[10px] font-mono text-emerald-400 bg-pitwall-card/90 border border-pitwall-border rounded px-2 py-0.5 shadow">
          S2: Roggia & Lesmo 1/2
        </div>
        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-purple-400 bg-pitwall-card/90 border border-pitwall-border rounded px-2 py-0.5 shadow">
          S3: Ascari & Parabolica
        </div>
      </div>

      {/* Sector Timing Fast Lap Legend */}
      <div className="mt-3 flex w-full items-center justify-between border-t border-pitwall-border/40 pt-2 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-gray-300">S1:</span>
          <span className="text-purple-400 font-bold">{sectorHighlights.s1?.time}s ({sectorHighlights.s1?.driver})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-gray-300">S2:</span>
          <span className="text-purple-400 font-bold">{sectorHighlights.s2?.time}s ({sectorHighlights.s2?.driver})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          <span className="text-gray-300">S3:</span>
          <span className="text-purple-400 font-bold">{sectorHighlights.s3?.time}s ({sectorHighlights.s3?.driver})</span>
        </div>
      </div>
    </div>
  );
}
