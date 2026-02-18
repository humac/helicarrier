"use client";

type KillModalProps = {
  isOpen: boolean;
  sessionId: string | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function KillModal({ isOpen, sessionId, isLoading = false, onConfirm, onCancel }: KillModalProps) {
  if (!isOpen || !sessionId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-red-700/50 bg-zinc-950 p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-red-400">Terminate Session?</h3>
        <p className="mt-3 text-sm text-zinc-300">
          This will terminate session <span className="font-mono text-red-300">{sessionId}</span>.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded border border-red-700 bg-red-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? "Terminating..." : "Terminate"}
          </button>
        </div>
      </div>
    </div>
  );
}
