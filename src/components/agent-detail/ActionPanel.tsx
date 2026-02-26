'use client';

import React, { useState } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useGatewayStore } from '@/store/gatewayStore';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Trash2, MessageSquare, StopCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ActionPanelProps {
  agentId: string;
  isTerminated: boolean;
}

export function ActionPanel({ agentId, isTerminated }: ActionPanelProps) {
  const [isKillDialogOpen, setIsKillDialogOpen] = useState(false);
  const [killConfirmation, setKillConfirmation] = useState('');
  const [isSteerOpen, setIsSteerOpen] = useState(false);
  const [steerMessage, setSteerMessage] = useState('');
  const [isStopping, setIsStopping] = useState(false);
  
  const { killAgentAction, steerAgentAction } = useAgentStore();
  const { isConnected } = useGatewayStore();

  const handleKill = async () => {
    if (killConfirmation === 'CONFIRM') {
      const success = await killAgentAction(agentId);
      if (success) {
        setIsKillDialogOpen(false);
        setKillConfirmation('');
      }
    }
  };

  const handleSteer = async () => {
    if (steerMessage.trim()) {
      const success = await steerAgentAction(agentId, steerMessage);
      if (success) {
        setIsSteerOpen(false);
        setSteerMessage('');
      }
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      // Stop action - send interrupt signal
      await steerAgentAction(agentId, '/stop');
    } finally {
      setIsStopping(false);
    }
  };

  const isDisabled = !isConnected || isTerminated;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
        Control Panel
      </h3>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isDisabled || isStopping}
          onClick={handleStop}
          className={clsx(
            "h-9 px-3 text-sm flex items-center gap-2 bg-yellow-900/20 border-yellow-700 hover:bg-yellow-900/30 text-yellow-400",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <StopCircle size={16} />
          {isStopping ? 'Stopping...' : 'Stop'}
        </Button>

        <Dialog open={isKillDialogOpen} onOpenChange={setIsKillDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="destructive" 
              size="sm" 
              disabled={isDisabled}
              className="h-9 px-3 text-sm flex items-center gap-2"
            >
              <Trash2 size={16} />
              Kill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Kill Action</DialogTitle>
              <DialogDescription>
                This will permanently terminate the agent session. All unsaved context will be lost.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-300 mb-2">
                To confirm, type <span className="font-mono bg-gray-800 px-2 py-1 rounded">CONFIRM</span> below:
              </p>
              <Input
                value={killConfirmation}
                onChange={(e) => setKillConfirmation(e.target.value)}
                placeholder="Type CONFIRM to confirm"
                className="font-mono bg-gray-900 border-gray-700"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsKillDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleKill}
                disabled={killConfirmation !== 'CONFIRM'}
              >
                Confirm Kill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSteerOpen} onOpenChange={setIsSteerOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isDisabled}
              className="h-9 px-3 text-sm flex items-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
            >
              <MessageSquare size={16} />
              Steer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Steer Agent</DialogTitle>
              <DialogDescription>
                Send a natural language instruction to guide this agent&apos;s behavior.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <textarea
                value={steerMessage}
                onChange={(e) => setSteerMessage(e.target.value)}
                placeholder="Enter your steering message here..."
                className="w-full h-32 p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsSteerOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSteer}
                disabled={!steerMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {!isConnected && (
        <p className="mt-3 text-xs text-red-400">
          Gateway disconnected. Actions are unavailable.
        </p>
      )}
      
      {isTerminated && (
        <p className="mt-3 text-xs text-gray-500">
          This agent has been terminated. Actions are unavailable.
        </p>
      )}
    </div>
  );
}
