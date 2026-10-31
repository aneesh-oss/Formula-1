"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  CloudRain, 
  Compass, 
  Droplets, 
  Flag, 
  Gauge, 
  Radio, 
  ShieldAlert, 
  Sun, 
  Thermometer, 
  Wind, 
  Zap 
} from "lucide-react";

export type TrackStatus = "GREEN" | "YELLOW" | "VSC" | "SC" | "RED";

export interface RaceControlMessage {
  id: string;
  timestamp: string;
  category: "FLAG" | "STEWARDS" | "DRS" | "SAFETY_CAR";
  message: string;
  flag?: "GREEN" | "YELLOW" | "RED" | "CHEQUERED";
}

export interface WeatherData {
  air_temp: number;
  track_temp: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: string;
  rainfall: number;
  track_grip: number;
}

export default function RaceControlWeatherRibbon() {
  const [trackStatus, setTrackStatus] = useState<TrackStatus>("GREEN");
  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);

  const [weather, setWeather] = useState<WeatherData>({
    air_temp: 23.4,
    track_temp: 44.8,
    humidity: 42,
    pressure: 1014.2,
    wind_speed: 2.8,
    wind_direction: "NE 48°",
    rainfall: 0,
    track_grip: 1.02,
  });

  const notices: RaceControlMessage[] = [
    {
      id: "rc-1",
      timestamp: "14:52:00",
      category: "FLAG",
      message: "CHEQUERED FLAG — QUALIFYING SESSION 1 CONCLUDED",
      flag: "CHEQUERED",
    },
    {
      id: "rc-2",
      timestamp: "14:48:32",
      category: "STEWARDS",
      message: "CAR 4 (NOR) TURN 4 TRACK LIMITS — LAP TIME 1:17.652 DELETED",
    },
    {
      id: "rc-3",
      timestamp: "14:45:10",
      category: "DRS",
      message: "DRS ENABLED IN SECTOR 1 MAIN STRAIGHT AND SECTOR 2 RUN TO TURN 4",
    },
    {
      id: "rc-4",
      timestamp: "14:39:15",
      category: "STEWARDS",
      message: "INCIDENT INVOLVING CARS 16 (LEC) AND 55 (SAI) NOTED — ALLEGED IMPEDING AT TURN 12",
    },
    {
      id: "rc-5",
      timestamp: "14:30:00",
      category: "FLAG",
      message: "TRACK CLEAR — GREEN FLAG AT PIT EXIT",
      flag: "GREEN",
    },
  ];

  // Rotate notices every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [notices.length]);

  const currentNotice = notices[activeNoticeIndex];

  return (
    <div className="rounded-2xl border border-pitwall-border bg-gradient-to-r from-[#12161f] via-[#0d1017] to-[#12161f] p-3 shadow-2xl space-y-3 font-mono">
      {/* Top Strip: Live Track Status, Clock, and Weather Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#232936] pb-2.5">
        
        {/* Left: Track Flag Status Pill */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Track Status:</span>
            {trackStatus === "GREEN" && (
              <div className="flex items-center space-x-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-emerald-400 font-black">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>TRACK CLEAR (GREEN)</span>
              </div>
            )}
            {trackStatus === "YELLOW" && (
              <div className="flex items-center space-x-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-amber-400 font-black">
                <AlertTriangle className="h-3 w-3 animate-pulse" />
                <span>YELLOW FLAG (SECTOR 2)</span>
              </div>
            )}
            {trackStatus === "VSC" && (
              <div className="flex items-center space-x-1.5 rounded-lg bg-amber-600/20 border border-amber-500/50 px-2.5 py-1 text-amber-300 font-black animate-pulse">
                <span>VIRTUAL SAFETY CAR</span>
              </div>
            )}
            {trackStatus === "SC" && (
              <div className="flex items-center space-x-1.5 rounded-lg bg-amber-500 text-black px-2.5 py-1 font-black animate-pulse">
                <span>SAFETY CAR DEPLOYED</span>
              </div>
            )}
            {trackStatus === "RED" && (
              <div className="flex items-center space-x-1.5 rounded-lg bg-red-600/20 border border-red-500/50 px-2.5 py-1 text-red-400 font-black animate-pulse">
                <ShieldAlert className="h-3 w-3" />
                <span>RED FLAG (SESSION SUSPENDED)</span>
              </div>
            )}
          </div>

          {/* Quick Flag Selector for Simulation */}
          <div className="hidden sm:flex items-center space-x-1 bg-[#1a202c] border border-[#2d3748] rounded-md p-0.5 text-[10px]">
            <button
              onClick={() => setTrackStatus("GREEN")}
              className={`px-1.5 py-0.5 rounded font-bold ${trackStatus === "GREEN" ? "bg-emerald-500 text-black" : "text-gray-400 hover:text-white"}`}
            >
              GRN
            </button>
            <button
              onClick={() => setTrackStatus("YELLOW")}
              className={`px-1.5 py-0.5 rounded font-bold ${trackStatus === "YELLOW" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"}`}
            >
              YEL
            </button>
            <button
              onClick={() => setTrackStatus("SC")}
              className={`px-1.5 py-0.5 rounded font-bold ${trackStatus === "SC" ? "bg-amber-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              SC
            </button>
            <button
              onClick={() => setTrackStatus("RED")}
              className={`px-1.5 py-0.5 rounded font-bold ${trackStatus === "RED" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              RED
            </button>
          </div>
        </div>

        {/* Right: Live Track Meteorology (FIA Weather Feed) */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-gray-300">
            <Thermometer className="h-3.5 w-3.5 text-pitwall-red" />
            <span className="text-gray-500 text-[11px]">TRACK:</span>
            <span className="font-bold text-white">{weather.track_temp}°C</span>
          </div>

          <div className="flex items-center space-x-1.5 text-gray-300">
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-gray-500 text-[11px]">AIR:</span>
            <span className="font-bold text-white">{weather.air_temp}°C</span>
          </div>

          <div className="flex items-center space-x-1.5 text-gray-300">
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-gray-500 text-[11px]">HUMIDITY:</span>
            <span className="font-bold text-white">{weather.humidity}%</span>
          </div>

          <div className="flex items-center space-x-1.5 text-gray-300">
            <Wind className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-gray-500 text-[11px]">WIND:</span>
            <span className="font-bold text-white">{weather.wind_speed} m/s</span>
            <span className="text-[10px] text-gray-400">({weather.wind_direction})</span>
          </div>

          <div className="flex items-center space-x-1.5 text-gray-300">
            <CloudRain className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-gray-500 text-[11px]">RAIN:</span>
            <span className="font-bold text-emerald-400">0%</span>
          </div>
        </div>
      </div>

      {/* Bottom Strip: Official FIA Race Control Live Ticker */}
      <div className="flex items-center justify-between gap-3 text-xs bg-[#0b0e14] border border-[#1f2633] rounded-xl px-3.5 py-2">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="rounded bg-red-600/30 text-pitwall-red border border-red-500/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>FIA RACE CONTROL</span>
          </span>
          <span className="text-gray-500 text-[11px] shrink-0 font-bold">
            [{currentNotice.timestamp}]
          </span>
          <span className="text-gray-200 font-bold truncate tracking-wide">
            {currentNotice.message}
          </span>
        </div>

        {/* Notice Index Dots */}
        <div className="flex items-center space-x-1 shrink-0">
          {notices.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveNoticeIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeNoticeIndex ? "w-4 bg-pitwall-cyan" : "w-1.5 bg-gray-600 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

