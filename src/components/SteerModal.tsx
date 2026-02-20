import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';

interface SteerModalProps {
  isOpen: boolean;
  agentId: string | null;
  onClose: () => void;
}

export default function SteerModal({ isOpen, agentId, onClose }: SteerModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { steerAgentAction, agents } = useAgentStore();

  if (!isOpen || !agentId) return null;

  const agentName = agents[agentId]?.name || 'Agent';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await steerAgentAction(agentId, message);
      onClose();
      setMessage('');
    } catch (error) {
      console.error('Failed to steer agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Send size={18} className="text-blue-500" />
            Steer Agent: <span className="text-blue-400">{agentName}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="steer-message" className="block text-sm font-medium text-gray-400 mb-2">
              Inject Instruction
            </label>
            <textarea
              id="steer-message"
              rows={4}
              className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="e.g., Pause current task and prioritize X..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              This message will be injected into the agent&apos;s context immediately.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? 'Sending...' : 'Send Instruction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
