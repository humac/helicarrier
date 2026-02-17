"use client";

import { useState } from "react";
import HudLayout from "@/components/layout/HudLayout";
import HeroGrid from "@/components/dashboard/HeroGrid";
import SystemPulse from "@/components/dashboard/SystemPulse";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "resources">("overview");

  return (
    <HudLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Command Deck</h2>
          <p className="text-zinc-400">Active Session: <span className="text-cyan-400 font-mono">PROJ_HELICARRIER</span></p>
        </header>

        {activeTab === "overview" && (
          <>
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Agent Roster</h3>
                <span className="text-xs px-2 py-1 bg-green-900/20 text-green-400 border border-green-900/50 rounded">4 ACTIVE</span>
              </div>
              <HeroGrid />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SystemPulse />
              </div>
              <ResourcesPanel />
            </section>
          </>
        )}

        {activeTab === "logs" && (
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">System Logs</h3>
            <SystemPulse />
          </section>
        )}

        {activeTab === "resources" && (
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Resource Usage</h3>
            <ResourcesPanel />
          </section>
        )}
      </div>
    </HudLayout>
  );
}

function ResourcesPanel() {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Resource Usage</h3>
      <div className="space-y-4">
        <ResourceBar label="P40 VRAM" value={12} total={24} unit="GB" color="bg-purple-500" />
        <ResourceBar label="System RAM" value={64} total={256} unit="GB" color="bg-blue-500" />
        <ResourceBar label="Storage /scratch" value={120} total={512} unit="GB" color="bg-orange-500" />
      </div>
    </div>
  );
}

function ResourceBar({ label, value, total, unit, color }: { label: string, value: number, total: number, unit: string, color: string }) {
  const pct = (value / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-200 font-mono">{value} / {total} {unit}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
