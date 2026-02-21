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
import { useGatewayStore } from '@/store/gatewayStore';
import { AlertTriangle, Shield } from 'lucide-react';

export function GlobalControls() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const { killAllAgentsAction } = useAgentStore();
  const { isConnected } = useGatewayStore();

  const handleKillAll = async () => {
    if (confirmation === 'EMERGENCY_STOP') {
      const success = await killAllAgentsAction();
      if (success) {
        setIsDialogOpen(false);
        setConfirmation('');
      }
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm" 
          className="flex items-center gap-2"
          disabled={!isConnected}
        >
          <AlertTriangle size={16} />
          Emergency Stop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emergency Stop All Agents</DialogTitle>
          <DialogDescription className="flex items-start gap-2">
            <Shield size={20} className="mt-0.5 flex-shrink-0 text-yellow-500" />
            <span>
              This will terminate ALL active agent sessions. This action is irreversible.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-300 mb-2">
            To confirm, type <span className="font-mono bg-gray-800 px-2 py-1 rounded">EMERGENCY_STOP</span> below:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type EMERGENCY_STOP to confirm"
            className="font-mono"
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleKillAll}
            disabled={confirmation !== 'EMERGENCY_STOP'}
          >
            Confirm Emergency Stop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
