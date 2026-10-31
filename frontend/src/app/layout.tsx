import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "PitWall OS — Formula 1 AI Telemetry & Observability Hub",
  description: "Enterprise Formula 1 race intelligence, head-to-head telemetry overlays, virtual tire physics, and season championship analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-pitwall-dark text-gray-100 antialiased selection:bg-pitwall-red selection:text-white">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}

