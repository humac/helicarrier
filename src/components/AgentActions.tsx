'use client';

import React, { useState } from 'react';
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
import { useAgentStore } from '@/store/agentStore';
import { Trash2, MessageSquare, Shield } from 'lucide-react';

interface AgentActionsProps {
  agentId: string;
  isTerminated: boolean;
}

export function AgentActions({ agentId, isTerminated }: AgentActionsProps) {
  const [isKillDialogOpen, setIsKillDialogOpen] = useState(false);
  const [killConfirmation, setKillConfirmation] = useState('');
  const [isSteerOpen, setIsSteerOpen] = useState(false);
  const [steerMessage, setSteerMessage] = useState('');
  const { killAgentAction, steerAgentAction } = useAgentStore();

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

  return (
    <div className="flex gap-2">
      <Dialog open={isKillDialogOpen} onOpenChange={setIsKillDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            disabled={isTerminated}
            className="flex items-center gap-1"
          >
            <Trash2 size={14} />
            Kill
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Kill Action</DialogTitle>
            <DialogDescription>
              This will terminate the agent session. Are you sure you want to proceed?
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
              className="font-mono"
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
            disabled={isTerminated}
            className="flex items-center gap-1"
          >
            <MessageSquare size={14} />
            Steer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Steer Agent</DialogTitle>
            <DialogDescription>
              Send a natural language instruction to guide this agent's behavior.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={steerMessage}
              onChange={(e) => setSteerMessage(e.target.value)}
              placeholder="Enter your steering message here..."
              className="w-full h-32 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}