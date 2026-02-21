import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useGatewayStore } from '@/store/gatewayStore';

export function OfflineBanner() {
  const { isConnected, connectionStatus, retryCount } = useGatewayStore();
  const [countdown, setCountdown] = useState(2);

  // Auto-retry countdown logic
  useEffect(() => {
    if (isConnected) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 2));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  if (isConnected) {
    return null;
  }

  const isRecovering = connectionStatus === 'recovering' || retryCount > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-900/95 text-white shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-top-full">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 animate-pulse text-red-200" />
          <div>
            <h3 className="font-bold uppercase tracking-wide">Gateway Connection Lost</h3>
            <p className="text-sm text-red-200">
              {isRecovering 
                ? `Retrying connection (Attempt ${retryCount})...` 
                : "Unable to reach OpenClaw Gateway."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right text-sm font-medium text-red-200">
            {isRecovering ? (
               <span>Next retry in {countdown}s</span>
            ) : (
              <span>Check your network</span>
            )}
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reconnect Now
          </button>
        </div>
      </div>
    </div>
  );
}
