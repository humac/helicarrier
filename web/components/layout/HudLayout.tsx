"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Activity, Terminal, Shield, Cpu } from "lucide-react";

interface HudLayoutProps {
  children: React.ReactNode;
  activeTab: "overview" | "logs" | "resources";
  onTabChange: (tab: "overview" | "logs" | "resources") => void;
}

export default function HudLayout({ children, activeTab, onTabChange }: HudLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden bg-[url('/grid-pattern.svg')]">
      {/* Sidebar (Glass) */}
      <aside className="w-64 border-r border-zinc-800/50 bg-zinc-900/30 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-zinc-800/50">
          <h1 className="text-xl font-bold tracking-tighter text-cyan-400 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            HELICARRIER
          </h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Mission Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<Activity />} label="Overview" active={activeTab === "overview"} onClick={() => onTabChange("overview")} />
          <NavItem icon={<Terminal />} label="System Logs" active={activeTab === "logs"} onClick={() => onTabChange("logs")} />
          <NavItem icon={<Cpu />} label="Resources" active={activeTab === "resources"} onClick={() => onTabChange("resources")} />
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400">GATEWAY: ONLINE</span>
          </div>
        </div>
      </aside>

      {/* Main Deck */}
      <main className="flex-1 overflow-auto bg-zinc-950/80 p-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactElement<{ className?: string }>, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
      active ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100"
    )}>
      {React.cloneElement(icon, { className: "w-4 h-4" })}
      {label}
    </button>
  );
}
