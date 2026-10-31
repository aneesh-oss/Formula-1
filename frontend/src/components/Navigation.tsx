"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Compass, Database, Flag, Gauge } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Telemetry & Delta Studio", href: "/", icon: Activity },
    { label: "Championship & Seasons", href: "/championship", icon: Flag },
    { label: "Race Strategy Simulator", href: "/strategy", icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-pitwall-border bg-pitwall-dark/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pitwall-red shadow-lg shadow-pitwall-red/20 font-black text-white italic text-lg">
            F1
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-white text-base">PITWALL</span>
              <span className="rounded bg-pitwall-red/20 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-pitwall-red">
                OS
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">B2B Telemetry & Strategy Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-pitwall-panel text-pitwall-cyan border border-pitwall-cyan/30 shadow-sm"
                    : "text-gray-400 hover:bg-pitwall-panel/60 hover:text-white"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-pitwall-cyan" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Observability / Engine Badge */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400 border border-emerald-500/20 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>DuckDB: In-Process OLAP</span>
          </div>
          <div className="flex items-center space-x-1.5 rounded-full bg-pitwall-cyan/10 px-2.5 py-1 text-pitwall-cyan border border-pitwall-cyan/20 font-mono">
            <span>OTel: :4318</span>
          </div>
        </div>
      </div>
    </header>
  );
}

