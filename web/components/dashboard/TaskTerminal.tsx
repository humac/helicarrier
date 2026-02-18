"use client";

import { useState } from "react";

type TaskTerminalProps = {
  onSubmit: (command: string) => Promise<void> | void;
};

export default function TaskTerminal({ onSubmit }: TaskTerminalProps) {
  const [command, setCommand] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async () => {
    const trimmed = command.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setStatus("sending");
    try {
      await onSubmit(trimmed);
      setCommand("");
      setStatus("sent");
    } finally {
      setIsSending(false);
      setTimeout(() => setStatus("idle"), 1000);
    }
  };

  return (
    <div className="rounded-xl border border-green-900/40 bg-black/40 p-4">
      <p className="mb-2 text-xs uppercase tracking-wider text-green-500">Task Terminal</p>
      <div className="flex gap-2">
        <input
          aria-label="Task command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void submit();
            }
          }}
          placeholder="> enter command..."
          className="flex-1 rounded border border-green-800/50 bg-zinc-950 px-3 py-2 font-mono text-sm text-green-300 outline-none focus:border-green-500"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isSending}
          className="rounded border border-green-700 px-3 py-2 text-sm text-green-300 hover:bg-green-900/20 disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-xs text-green-500/80">
        {status === "sending" ? "Sending..." : status === "sent" ? "Command Sent" : "Ready"}
      </p>
    </div>
  );
}
