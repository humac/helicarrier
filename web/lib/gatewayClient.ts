type RpcResult = {
  result?: unknown;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Gateway timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function rpcCall(ws: WebSocket, method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(String(event.data)) as {
          id?: string;
          error?: unknown;
          result?: unknown;
        };

        if (payload.id !== id) return;

        ws.removeEventListener("message", onMessage);
        if (payload.error) {
          reject(new Error(typeof payload.error === "string" ? payload.error : "Gateway RPC error"));
          return;
        }
        resolve(payload.result);
      } catch {
        // ignore unrelated frames
      }
    };

    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
  });
}

export async function fetchGatewayStatusData(): Promise<{ agents: unknown[]; sessions: unknown[]; healthy: boolean }> {
  const url = process.env.HELICARRIER_GATEWAY_URL ?? "ws://127.0.0.1:18789";
  const token = process.env.HELICARRIER_GATEWAY_TOKEN ?? process.env.OPENCLAW_AUTH_TOKEN;
  const timeoutMs = 5000;

  const ws = new WebSocket(url);

  await withTimeout(
    new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", () => reject(new Error("Gateway socket connection failed")), { once: true });
    }),
    timeoutMs,
  );

  try {
    if (token) {
      await withTimeout(rpcCall(ws, "auth.login", { token }), timeoutMs);
    }

    const [agentsRaw, sessionsRaw, healthRaw] = await Promise.all([
      withTimeout(rpcCall(ws, "agents.list", {}), timeoutMs),
      withTimeout(rpcCall(ws, "sessions.list", {}), timeoutMs),
      withTimeout(rpcCall(ws, "health", {}), timeoutMs).catch(() => ({ healthy: true })),
    ]);

    const agents = Array.isArray(agentsRaw) ? agentsRaw : (agentsRaw as RpcResult)?.result;
    const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : (sessionsRaw as RpcResult)?.result;

    const healthObj = (healthRaw && typeof healthRaw === "object" ? (healthRaw as Record<string, unknown>) : {}) ?? {};
    const healthy = healthObj.healthy === false ? false : true;

    return {
      agents: Array.isArray(agents) ? agents : [],
      sessions: Array.isArray(sessions) ? sessions : [],
      healthy,
    };
  } finally {
    ws.close();
  }
}
