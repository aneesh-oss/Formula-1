"use client";

import { useMemo } from "react";
import { TelemetryPoint } from "@/lib/api";

interface TrackMapProps {
  telemetry: TelemetryPoint[];
  activeIndex?: number;
  driverACode?: string;
  driverBCode?: string;
}

export default function TrackMap({
  telemetry,
  activeIndex = 0,
  driverACode = "VER",
  driverBCode = "NOR",
}: TrackMapProps) {
  // Normalize coordinates into an SVG viewBox (500x350)
  const { pathData, activePointA, activePointB } = useMemo(() => {
    if (!telemetry || telemetry.length === 0) {
      return { pathData: "", activePointA: null, activePointB: null };
    }

    const xs = telemetry.map((p) => p.x_a);
    const ys = telemetry.map((p) => p.y_a);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Scale with padding
    const width = 460;
    const height = 300;
    const pad = 20;

    const points = telemetry.map((p) => {
      const sx = pad + ((p.x_a - minX) / rangeX) * width;
      // Invert Y for SVG coordinates
      const sy = pad + (1 - (p.y_a - minY) / rangeY) * height;
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    });

    const path = `M ${points.join(" L ")} Z`;

    const activeP = telemetry[Math.min(activeIndex, telemetry.length - 1)];
    const curAx = pad + ((activeP.x_a - minX) / rangeX) * width;
    const curAy = pad + (1 - (activeP.y_a - minY) / rangeY) * height;

    const curBx = pad + ((activeP.x_b - minX) / rangeX) * width;
    const curBy = pad + (1 - (activeP.y_b - minY) / rangeY) * height;

    return {
      pathData: path,
      activePointA: { x: curAx, y: curAy },
      activePointB: { x: curBx, y: curBy },
    };
  }, [telemetry, activeIndex]);

  return (
    <div className="relative flex flex-col items-center justify-center rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-xl">
      <div className="flex w-full items-center justify-between border-b border-pitwall-border/60 pb-3 mb-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Circuit Map & Apex Coordinates
          </h3>
          <p className="text-[11px] text-gray-400">Autodromo Nazionale Monza — 5.793 km</p>
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
          {/* Circuit background halo */}
          <path
            d={pathData}
            fill="none"
            stroke="#1d2230"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Track baseline */}
          <path
            d={pathData}
            fill="none"
            stroke="#3a4259"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active scrub position for Driver B */}
          {activePointB && (
            <circle
              cx={activePointB.x}
              cy={activePointB.y}
              r="6"
              fill="#ff8000"
              className="drop-shadow-[0_0_8px_#ff8000]"
            />
          )}

          {/* Active scrub position for Driver A */}
          {activePointA && (
            <circle
              cx={activePointA.x}
              cy={activePointA.y}
              r="6"
              fill="#3671c6"
              className="drop-shadow-[0_0_8px_#3671c6]"
            />
          )}
        </svg>

        {/* Turn callout labels */}
        <div className="absolute top-3 left-4 text-[10px] font-mono text-gray-400 bg-pitwall-card/80 border border-pitwall-border/80 rounded px-2 py-1">
          T1: Variante del Rettifilo (Braking 140m)
        </div>
        <div className="absolute bottom-3 right-4 text-[10px] font-mono text-gray-400 bg-pitwall-card/80 border border-pitwall-border/80 rounded px-2 py-1">
          T11: Curva Parabolica (Apex 215 km/h)
        </div>
      </div>
    </div>
  );
}
