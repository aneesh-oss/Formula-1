"use client";

import { AlertTriangle, CheckCircle, Disc, Gauge, ShieldAlert } from "lucide-react";
import { CarHealthResponse } from "@/lib/api";

interface CarHealthHUDProps {
  health?: CarHealthResponse | null;
  driver?: string;
}

export default function CarHealthHUD({ health, driver = "VER" }: CarHealthHUDProps) {
  const data = health || {
    driver: driver,
    stint_lap: 14,
    compound: "MEDIUM",
    tires: {
      front_left: { corner: "FL", wear_pct: 50.1, pressure_psi: 24.78, temp_celsius: 113.0, status: "DEGRADING", status_code: "WARNING", color: "#eab308", description: "Rubber degradation active." },
      front_right: { corner: "FR", wear_pct: 38.2, pressure_psi: 24.42, temp_celsius: 108.5, status: "OPTIMAL", status_code: "NORMAL", color: "#22c55e", description: "Inside optimal grip window." },
      rear_left: { corner: "RL", wear_pct: 47.4, pressure_psi: 21.92, temp_celsius: 106.8, status: "DEGRADING", status_code: "WARNING", color: "#eab308", description: "Rubber degradation active." },
      rear_right: { corner: "RR", wear_pct: 35.8, pressure_psi: 21.64, temp_celsius: 102.4, status: "OPTIMAL", status_code: "NORMAL", color: "#22c55e", description: "Inside optimal grip window." },
    },
    brakes: {
      front_disc_temp_celsius: 540.0,
      rear_disc_temp_celsius: 460.0,
      front_pad_wear_pct: 22.4,
      rear_pad_wear_pct: 15.4,
      status: "NOMINAL_AERO_COOLING",
      color: "#22c55e",
      is_heavy_braking: false,
    },
    clutch: {
      status: "LOCKED_ENGAGED",
      slip_pct: 0.0,
      temp_celsius: 110.0,
      color: "#22c55e",
    },
    overall_vehicle_status: "WARNING",
  };

  const fl = data.tires.front_left;
  const fr = data.tires.front_right;
  const rl = data.tires.rear_left;
  const rr = data.tires.rear_right;

  return (
    <div className="flex flex-col rounded-xl border border-pitwall-border bg-pitwall-panel p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-pitwall-border/60 pb-3 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Vehicle Dynamics & Grip Loss HUD
          </h3>
          <p className="text-[11px] text-gray-400">
            4-Wheel Tire State Machine & Thermal Brake Modeling
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
              data.overall_vehicle_status === "CRITICAL"
                ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                : data.overall_vehicle_status === "WARNING"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            }`}
          >
            {data.overall_vehicle_status === "CRITICAL" ? (
              <ShieldAlert className="h-3 w-3" />
            ) : data.overall_vehicle_status === "WARNING" ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            <span>{data.overall_vehicle_status}</span>
          </span>
          <span className="text-xs font-mono font-bold text-pitwall-cyan">
            {data.driver}
          </span>
        </div>
      </div>

      {/* Top-Down Visual Car Wireframe HUD */}
      <div className="relative flex items-center justify-center py-4 bg-pitwall-dark/60 rounded-lg border border-pitwall-border/40">
        {/* Chassis Wireframe SVG */}
        <div className="relative w-64 h-80 flex items-center justify-center">
          <svg viewBox="0 0 200 300" className="w-full h-full">
            {/* Front Wing */}
            <path d="M 20 50 Q 100 35 180 50 L 175 60 Q 100 48 25 60 Z" fill="#1f2433" stroke="#374151" strokeWidth="1.5" />
            {/* Nosecone */}
            <path d="M 90 45 L 110 45 L 115 110 L 85 110 Z" fill="#141722" stroke="#374151" strokeWidth="1.5" />
            {/* Cockpit & Halo */}
            <path d="M 80 110 Q 100 95 120 110 L 125 175 L 75 175 Z" fill="#1a1e2b" stroke="#00f0ff" strokeWidth="1.5" />
            {/* Sidepods & Engine Cover */}
            <path d="M 60 120 L 85 110 L 75 220 L 65 230 Z" fill="#141722" stroke="#374151" strokeWidth="1.5" />
            <path d="M 140 120 L 115 110 L 125 220 L 135 230 Z" fill="#141722" stroke="#374151" strokeWidth="1.5" />
            {/* Rear Wing */}
            <rect x="35" y="250" width="130" height="15" rx="3" fill="#1f2433" stroke="#374151" strokeWidth="1.5" />

            {/* FL Tire */}
            <rect
              x="12"
              y="60"
              width="24"
              height="55"
              rx="4"
              fill={fl.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
            />
            {/* FR Tire */}
            <rect
              x="164"
              y="60"
              width="24"
              height="55"
              rx="4"
              fill={fr.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
            />
            {/* RL Tire */}
            <rect
              x="10"
              y="190"
              width="26"
              height="60"
              rx="4"
              fill={rl.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
            />
            {/* RR Tire */}
            <rect
              x="164"
              y="190"
              width="26"
              height="60"
              rx="4"
              fill={rr.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
            />
          </svg>

          {/* Tire Readout Overlays (Absolute Positioning) */}
          <div className="absolute top-2 left-0 text-[10px] font-mono bg-pitwall-card/90 border border-pitwall-border rounded px-1.5 py-0.5 shadow">
            <span className="font-bold text-white">FL:</span> <span style={{ color: fl.color }}>{fl.wear_pct}%</span>
          </div>
          <div className="absolute top-2 right-0 text-[10px] font-mono bg-pitwall-card/90 border border-pitwall-border rounded px-1.5 py-0.5 shadow">
            <span className="font-bold text-white">FR:</span> <span style={{ color: fr.color }}>{fr.wear_pct}%</span>
          </div>
          <div className="absolute bottom-2 left-0 text-[10px] font-mono bg-pitwall-card/90 border border-pitwall-border rounded px-1.5 py-0.5 shadow">
            <span className="font-bold text-white">RL:</span> <span style={{ color: rl.color }}>{rl.wear_pct}%</span>
          </div>
          <div className="absolute bottom-2 right-0 text-[10px] font-mono bg-pitwall-card/90 border border-pitwall-border rounded px-1.5 py-0.5 shadow">
            <span className="font-bold text-white">RR:</span> <span style={{ color: rr.color }}>{rr.wear_pct}%</span>
          </div>
        </div>
      </div>

      {/* Thermal Brake & Clutch Readouts */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono">
        {/* Brake Disc Temperatures */}
        <div className="rounded-lg border border-pitwall-border bg-pitwall-card p-2.5">
          <div className="flex items-center space-x-1.5 text-gray-400 text-[10px] uppercase font-bold mb-1">
            <Disc className="h-3 w-3 text-pitwall-cyan" />
            <span>Brake Discs (FL/FR)</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black" style={{ color: data.brakes.color }}>
              {data.brakes.front_disc_temp_celsius.toFixed(0)}°C
            </span>
            <span className="text-[10px] text-gray-400">Pad Wear: {data.brakes.front_pad_wear_pct}%</span>
          </div>
        </div>

        {/* Clutch Status */}
        <div className="rounded-lg border border-pitwall-border bg-pitwall-card p-2.5">
          <div className="flex items-center space-x-1.5 text-gray-400 text-[10px] uppercase font-bold mb-1">
            <Gauge className="h-3 w-3 text-emerald-400" />
            <span>Clutch Engagement</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold" style={{ color: data.clutch.color }}>
              {data.clutch.status}
            </span>
            <span className="text-[10px] text-gray-400">{data.clutch.temp_celsius}°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}
