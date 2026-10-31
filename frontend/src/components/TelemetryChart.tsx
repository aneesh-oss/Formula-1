"use client";

import { useMemo, useState } from "react";
import { TelemetryPoint } from "@/lib/api";

interface TelemetryChartProps {
  telemetry: TelemetryPoint[];
  driverA: string;
  driverB: string;
  onHoverIndex?: (idx: number) => void;
}

export default function TelemetryChart({
  telemetry,
  driverA = "VER",
  driverB = "NOR",
  onHoverIndex,
}: TelemetryChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number>(0);

  const activePoint = telemetry[hoverIdx] || telemetry[0] || null;

  // Chart coordinate mapping
  const width = 800;
  const heightSpeed = 160;
  const heightDelta = 70;
  const heightInputs = 90;

  const { maxDist, speedAPath, speedBPath, deltaPath, throttlePath, brakePath } = useMemo(() => {
    if (!telemetry || telemetry.length === 0) {
      return { maxDist: 1, speedAPath: "", speedBPath: "", deltaPath: "", throttlePath: "", brakePath: "" };
    }

    const maxDistance = telemetry[telemetry.length - 1].distance || 5793;
    const maxSpeed = 360;

    // Scale helpers
    const scaleX = (d: number) => (d / maxDistance) * width;
    const scaleSpeed = (s: number) => heightSpeed - (s / maxSpeed) * heightSpeed;
    const scaleDelta = (dt: number) => {
      // Delta range: -1.0s to +1.0s (midpoint at heightDelta / 2)
      const clamped = Math.max(-1.0, Math.min(1.0, dt));
      return (heightDelta / 2) - (clamped / 1.0) * (heightDelta / 2 - 5);
    };
    const scaleInput = (pct: number) => heightInputs - (pct / 100) * heightInputs;

    const pA = telemetry.map((p) => `${scaleX(p.distance).toFixed(1)},${scaleSpeed(p.speed_a).toFixed(1)}`).join(" L ");
    const pB = telemetry.map((p) => `${scaleX(p.distance).toFixed(1)},${scaleSpeed(p.speed_b).toFixed(1)}`).join(" L ");
    const pDt = telemetry.map((p) => `${scaleX(p.distance).toFixed(1)},${scaleDelta(p.time_delta).toFixed(1)}`).join(" L ");
    const pThr = telemetry.map((p) => `${scaleX(p.distance).toFixed(1)},${scaleInput(p.throttle_a).toFixed(1)}`).join(" L ");
    const pBrk = telemetry.map((p) => `${scaleX(p.distance).toFixed(1)},${scaleInput(p.brake_a).toFixed(1)}`).join(" L ");

    return {
      maxDist: maxDistance,
      speedAPath: `M ${pA}`,
      speedBPath: `M ${pB}`,
      deltaPath: `M ${pDt}`,
      throttlePath: `M ${pThr}`,
      brakePath: `M ${pBrk}`,
    };
  }, [telemetry]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.floor(pct * (telemetry.length - 1));
    setHoverIdx(idx);
    if (onHoverIndex) onHoverIndex(idx);
  };

  if (!activePoint) {
    return <div className="p-8 text-center text-gray-400">Loading telemetry streams...</div>;
  }

  const scrubberX = ((hoverIdx / (telemetry.length - 1)) * width).toFixed(1);

  return (
    <div className="flex flex-col space-y-4 rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-xl">
      {/* Header telemetry readout */}
      <div className="flex flex-wrap items-center justify-between border-b border-pitwall-border/60 pb-3 gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Distance-Aligned Telemetry Delta
          </h3>
          <p className="text-[11px] text-gray-400 font-mono">
            Grid Resolution: 1.0m | Active Distance: <span className="text-pitwall-cyan font-bold">{activePoint.distance.toFixed(0)}m</span>
          </p>
        </div>

        {/* Live HUD Readouts */}
        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <div className="text-[10px] text-gray-400 uppercase">{driverA} Speed</div>
            <div className="font-extrabold text-team-redbull text-sm">
              {activePoint.speed_a.toFixed(1)} <span className="text-[10px] text-gray-400 font-normal">km/h</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">{driverB} Speed</div>
            <div className="font-extrabold text-team-mclaren text-sm">
              {activePoint.speed_b.toFixed(1)} <span className="text-[10px] text-gray-400 font-normal">km/h</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Speed Delta</div>
            <div className={`font-extrabold text-sm ${activePoint.speed_delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {activePoint.speed_delta >= 0 ? `+${activePoint.speed_delta.toFixed(1)}` : activePoint.speed_delta.toFixed(1)} km/h
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Lap Time Delta (Δt)</div>
            <div className={`font-extrabold text-sm ${activePoint.time_delta <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {activePoint.time_delta <= 0 ? `${activePoint.time_delta.toFixed(3)}s` : `+${activePoint.time_delta.toFixed(3)}s`}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Chart Suite */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${heightSpeed + heightDelta + heightInputs + 40}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
        >
          {/* Chart 1: Speeds (0 to 360 km/h) */}
          <g transform="translate(0, 10)">
            <rect width={width} height={heightSpeed} fill="#11141c" rx="4" />
            <line x1="0" y1={heightSpeed / 2} x2={width} y2={heightSpeed / 2} stroke="#212738" strokeDasharray="3 3" />
            <text x="8" y="20" fill="#6b7280" fontSize="10" fontFamily="monospace">350 km/h</text>
            <text x="8" y={heightSpeed - 6} fill="#6b7280" fontSize="10" fontFamily="monospace">100 km/h</text>

            <path d={speedAPath} fill="none" stroke="#3671c6" strokeWidth="2.2" strokeLinecap="round" />
            <path d={speedBPath} fill="none" stroke="#ff8000" strokeWidth="2.2" strokeLinecap="round" />

            {/* Vertical Cursor Scrubber */}
            <line x1={scrubberX} y1="0" x2={scrubberX} y2={heightSpeed} stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="2 2" />
          </g>

          {/* Chart 2: Lap Time Delta (Δt in seconds) */}
          <g transform={`translate(0, ${heightSpeed + 20})`}>
            <rect width={width} height={heightDelta} fill="#11141c" rx="4" />
            {/* Zero Delta Baseline */}
            <line x1="0" y1={heightDelta / 2} x2={width} y2={heightDelta / 2} stroke="#374151" strokeWidth="1.5" />
            <text x="8" y="16" fill="#6b7280" fontSize="9" fontFamily="monospace">+0.50s ({driverB})</text>
            <text x="8" y={heightDelta - 6} fill="#6b7280" fontSize="9" fontFamily="monospace">-0.50s ({driverA})</text>

            <path d={deltaPath} fill="none" stroke="#00e676" strokeWidth="2" />
            <line x1={scrubberX} y1="0" x2={scrubberX} y2={heightDelta} stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="2 2" />
          </g>

          {/* Chart 3: Throttle & Brake Inputs */}
          <g transform={`translate(0, ${heightSpeed + heightDelta + 30})`}>
            <rect width={width} height={heightInputs} fill="#11141c" rx="4" />
            <text x="8" y="16" fill="#6b7280" fontSize="9" fontFamily="monospace">100% Throttle / Brake</text>

            <path d={throttlePath} fill="none" stroke="#22c55e" strokeWidth="1.8" />
            <path d={brakePath} fill="none" stroke="#ef4444" strokeWidth="1.8" />

            <line x1={scrubberX} y1="0" x2={scrubberX} y2={heightInputs} stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="2 2" />
          </g>
        </svg>
      </div>

      {/* Legend & Channel Keys */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 font-mono pt-2 border-t border-pitwall-border/40">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5"><span className="h-1.5 w-4 bg-team-redbull rounded" /><span>{driverA} Speed</span></span>
          <span className="flex items-center space-x-1.5"><span className="h-1.5 w-4 bg-team-mclaren rounded" /><span>{driverB} Speed</span></span>
          <span className="flex items-center space-x-1.5"><span className="h-1.5 w-4 bg-emerald-400 rounded" /><span>Time Delta (Δt)</span></span>
          <span className="flex items-center space-x-1.5"><span className="h-1.5 w-4 bg-green-500 rounded" /><span>Throttle %</span></span>
          <span className="flex items-center space-x-1.5"><span className="h-1.5 w-4 bg-rose-500 rounded" /><span>Brake %</span></span>
        </div>
        <div>Total Lap Distance: {maxDist.toFixed(0)}m</div>
      </div>
    </div>
  );
}
