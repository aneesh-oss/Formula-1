"use client";

import { TireResponse, TireStintLap } from "@/lib/api";

interface VirtualTireWidgetProps {
  tireData?: TireResponse | null;
  driver?: string;
}

export default function VirtualTireWidget({ tireData, driver = "VER" }: VirtualTireWidgetProps) {
  const latestLap: TireStintLap =
    tireData?.history && tireData.history.length > 0
      ? tireData.history[tireData.history.length - 1]
      : {
          lap_number: 5,
          compound: "HARD",
          tyre_life: 5,
          lap_time_seconds: 81.45,
          avg_pressure_fl: 23.66,
          avg_pressure_fr: 23.85,
          avg_pressure_rl: 20.95,
          avg_pressure_rr: 21.15,
          avg_temp_fl: 92.4,
          avg_temp_fr: 94.1,
          avg_temp_rl: 87.2,
          avg_temp_rr: 88.5,
          max_wear_pct: 6.4,
        };

  return (
    <div className="flex flex-col rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-pitwall-border/60 pb-3 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            4-Wheel Virtual Tire Model
          </h3>
          <p className="text-[11px] text-gray-400">
            Pirelli Thermodynamic Carcass & Fuel-Decay Engine
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="rounded bg-white text-black font-extrabold text-[10px] px-2 py-0.5 tracking-wider">
            {latestLap.compound} (C3)
          </span>
          <span className="text-xs font-mono text-pitwall-cyan font-semibold">
            Lap {latestLap.lap_number}
          </span>
        </div>
      </div>

      {/* Chassis Top-Down Grid Layout */}
      <div className="grid grid-cols-2 gap-3 my-2">
        {/* Front-Left */}
        <div className="flex flex-col justify-between rounded-lg border border-pitwall-border bg-pitwall-card p-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span className="font-bold text-white">FRONT LEFT (FL)</span>
            <span className="text-emerald-400">92°C</span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-xl font-mono font-black text-white">
              {latestLap.avg_pressure_fl.toFixed(2)}{" "}
              <span className="text-xs text-gray-400 font-normal">PSI</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Base: 23.0</span>
          </div>
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pitwall-cyan rounded-full"
              style={{ width: `${Math.min(100, (latestLap.avg_pressure_fl / 26) * 100)}%` }}
            />
          </div>
        </div>

        {/* Front-Right */}
        <div className="flex flex-col justify-between rounded-lg border border-pitwall-border bg-pitwall-card p-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span className="font-bold text-white">FRONT RIGHT (FR)</span>
            <span className="text-amber-400">94°C</span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-xl font-mono font-black text-white">
              {latestLap.avg_pressure_fr.toFixed(2)}{" "}
              <span className="text-xs text-gray-400 font-normal">PSI</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Base: 23.0</span>
          </div>
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${Math.min(100, (latestLap.avg_pressure_fr / 26) * 100)}%` }}
            />
          </div>
        </div>

        {/* Rear-Left */}
        <div className="flex flex-col justify-between rounded-lg border border-pitwall-border bg-pitwall-card p-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span className="font-bold text-white">REAR LEFT (RL)</span>
            <span className="text-emerald-400">87°C</span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-xl font-mono font-black text-white">
              {latestLap.avg_pressure_rl.toFixed(2)}{" "}
              <span className="text-xs text-gray-400 font-normal">PSI</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Base: 20.5</span>
          </div>
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pitwall-cyan rounded-full"
              style={{ width: `${Math.min(100, (latestLap.avg_pressure_rl / 24) * 100)}%` }}
            />
          </div>
        </div>

        {/* Rear-Right */}
        <div className="flex flex-col justify-between rounded-lg border border-pitwall-border bg-pitwall-card p-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span className="font-bold text-white">REAR RIGHT (RR)</span>
            <span className="text-emerald-400">88°C</span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-xl font-mono font-black text-white">
              {latestLap.avg_pressure_rr.toFixed(2)}{" "}
              <span className="text-xs text-gray-400 font-normal">PSI</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Base: 20.5</span>
          </div>
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pitwall-cyan rounded-full"
              style={{ width: `${Math.min(100, (latestLap.avg_pressure_rr / 24) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fuel-Corrected Degradation Trajectory */}
      <div className="mt-2 rounded-lg border border-pitwall-border/80 bg-pitwall-card/60 p-3">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-gray-300 font-medium">Stint Wear Index (Fuel-Corrected)</span>
          <span className="text-pitwall-cyan font-bold">{latestLap.max_wear_pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full"
            style={{ width: `${Math.min(100, latestLap.max_wear_pct)}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-gray-400 font-mono">
          Model: 0.06s/lap tire rubber decay offset by -0.03s/lap fuel weight burn.
        </p>
      </div>
    </div>
  );
}
