import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to manage gateway health polling
 */
export function useGatewayHealth(intervalMs: number = 30000) {
  const [health, setHealth] = useState<{
    healthy: boolean;
    gateway: string;
    sessions: number;
    timestamp: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch gateway health:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, intervalMs);
    return () => clearInterval(interval);
  }, [fetchHealth, intervalMs]);

  return { health, loading, error, refresh: fetchHealth };
}

/**
 * Hook to manage agent banner data fetching
 */
export function useAgentBannerData() {
  const [status, setStatus] = useState<{
    agentName: string;
    version: string;
    model: string;
    contextUsage: { current: number; max: number };
    activeSessions: number;
    runtimeMode: string;
    capabilities: string[];
    resources: string[];
  } | null>(null);
  const [versionInfo, setVersionInfo] = useState<{
    current: string;
    latest: string;
    upToDate: boolean;
  } | null>(null);
  const [sessions, setSessions] = useState<Array<{
    id: string;
    label: string;
    model: string;
    status: 'active' | 'idle' | 'completed';
    updatedAt: number;
  } | null>>(() => []);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch status
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();
        setStatus(statusData);

        // Fetch version
        const versionRes = await fetch('/api/openclaw/version');
        const versionData = await versionRes.json();
        setVersionInfo({
          ...versionData,
          upToDate: versionData.current === versionData.latest,
        });

        // Fetch sessions
        const sessionsRes = await fetch('/api/sessions');
        const sessionsData = await sessionsRes.json();
        // Ensure sessions is always an array (handle gateway envelope, errors, or malformed responses)
        let sessionsArray: any[] = [];
        if (Array.isArray(sessionsData)) {
          sessionsArray = sessionsData;
        } else if (sessionsData && typeof sessionsData === 'object') {
          sessionsArray = Array.isArray(sessionsData.sessions) ? sessionsData.sessions : [];
        }
        setSessions(sessionsArray);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch agent banner data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { status, versionInfo, sessions, loading };
}
