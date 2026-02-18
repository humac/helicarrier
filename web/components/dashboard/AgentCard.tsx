"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Cpu, Activity } from "lucide-react";

interface AgentCardProps {
  agent: string;
  role: string;
  status: "running" | "idle" | "failed" | "done";
  load: string;
  avatar?: string;
  onKill?: () => void;
}

export default function AgentCard({ agent, role, status, load, onKill }: AgentCardProps) {
  const statusColor = {
    idle: "bg-zinc-500",
    running: "bg-green-500",
    done: "bg-cyan-500",
    failed: "bg-red-500",
  }[status];

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors"
    >
      {status === "running" && (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl animate-pulse" />
      )}

      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-zinc-100 truncate">{agent}</h3>
            <p className="text-xs text-zinc-500 uppercase font-mono truncate">{role}</p>
          </div>
        </div>
        <div
          className={cn(
            "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 border bg-zinc-950/50 shrink-0",
            status === "running"
              ? "border-green-500/30 text-green-400"
              : status === "failed"
                ? "border-red-500/30 text-red-400"
                : "border-zinc-800 text-zinc-500",
          )}
        >
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusColor)} />
          {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Stat label="CPU Load" value={load} icon={<Cpu className="w-3 h-3" />} />
        <Stat label="Tasks" value="0" icon={<Activity className="w-3 h-3" />} />
      </div>

      {onKill && status === "running" && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onKill}
            className="rounded border border-red-700/60 bg-red-600/10 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-600/20"
          >
            Kill
          </button>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-950/30 rounded p-2 border border-zinc-800/50">
      <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase mb-1">
        {icon} {label}
      </div>
      <div className="text-lg font-mono font-medium text-zinc-200">{value}</div>
    </div>
  );
}
