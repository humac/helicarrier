# ARCH.md - Project Helicarrier Architecture

## Realtime Agent Status Source-of-Truth (No Log Inference)

### 1) Decision
Agent card status must come from the Gateway realtime control plane, not parsed log lines.

- **Primary source**: Gateway WebSocket RPC (`ws://127.0.0.1:18789`)
- **Primary methods**:
  - `agents.list` (agent inventory + runtime metadata)
  - `sessions.list` (live session state)
- **Optional enrichers**:
  - `health` (gateway health)
  - `last-heartbeat` (staleness detection)

Logs remain for **SystemPulse console only** (observability), not status truth.

---

### 2) Architecture

#### 2.1 Data Plane
- Add server-only route: `GET /api/system/status`
- Route uses a **server-side Gateway client** (WebSocket RPC), authenticated by gateway token.
- Route aggregates `agents.list` + `sessions.list` into a normalized payload for UI.
- HeroGrid polls this route; UI never talks directly to Gateway WS.

#### 2.2 Why server-side adapter
- Keeps gateway token off browser.
- Allows strict status normalization contract for frontend.
- Decouples UI from Gateway schema churn.

---

### 3) Normalized Status Model

Helicarrier canonical status enum:

- `running`
- `idle`
- `failed`
- `done`

#### 3.1 Mapping rules (priority order)
For each agent, derive status from structured session/agent data:

1. **failed**
   - any active/recent session has terminal error (`error`, `failed`, `crashed`) or non-empty error field.
2. **running**
   - agent has active run / in-progress state / currently executing.
3. **done**
   - most recent terminal state is success (`done`, `completed`, `finished`) with no active run.
4. **idle**
   - default when reachable and none of the above.

Tie-break rule: `failed > running > done > idle`.

#### 3.2 Response shape
`GET /api/system/status` returns:

```json
{
  "generatedAt": "2026-02-17T21:45:00.000Z",
  "source": "gateway-ws",
  "gateway": { "connected": true, "healthy": true },
  "agents": [
    {
      "id": "tony",
      "name": "Tony",
      "status": "running",
      "lastActivityAt": "2026-02-17T21:44:58.000Z",
      "reason": "active session"
    }
  ]
}
```

---

### 4) Polling Cadence / Freshness

- **UI poll interval**: `2000ms`.
- **Server cache TTL**: `1000ms` (de-duplicate bursts).
- **Degraded mode**:
  - If Gateway unavailable for >10s, mark all agents `idle` with `gateway.connected=false` and expose error banner.

Future upgrade: SSE push from `/api/system/status/stream` once stable.

---

### 5) Security Model

1. **Server-only Gateway auth**
   - `OPENCLAW_AUTH_TOKEN` (or `HELICARRIER_GATEWAY_TOKEN`) used only in server runtime.
   - Never exposed via `NEXT_PUBLIC_*`.

2. **Client -> Helicarrier API auth**
   - Require `X-Secret-Key` on `/api/system/status` and `/api/logs`.
   - Validate against `HELICARRIER_SECRET` (fallback `OPENCLAW_AUTH_TOKEN` allowed only for local dev).

3. **Network scope**
   - Bind Helicarrier to localhost/Tailscale trusted interface only.

4. **Failure behavior**
   - Fail closed on auth mismatch (`401`).
   - Do not silently fall back to log-derived status.

---

### 6) Migration Notes

- Replace HeroGrid data source from `/api/agents`/log inference to `/api/system/status`.
- Keep `SystemPulse` on `/api/logs` for operator visibility.
- Remove any regex-based status parser paths after cutover.

---

### 7) Command & Control (V2)

#### 7.1 Command API
New write-path routes to interact with the OpenClaw Gateway/Runtime.

- **POST /api/control/kill**
  - **Payload**: `{ "sessionId": "string" }`
  - **Action**: Invokes termination on the specific session ID.
  - **Upstream**: Calls `openclaw process kill <pid>` or `sessions kill` equivalent via Gateway adapter.
  - **Response**: `200 OK` (signal sent) or `4xx/5xx` (error).

- **POST /api/control/spawn**
  - **Payload**: `{ "agentId": "string", "prompt": "string" }`
  - **Action**: Spawns a new session for the given agent.
  - **Upstream**: Calls `openclaw sessions spawn`.
  - **Response**: `{ "sessionId": "..." }` or error.

- **POST /api/control/model**
  - **Payload**: `{ "agentId": "string", "model": "string" }`
  - **Action**: Updates the preferred model for an agent.
  - **Upstream**: Updates runtime config or session context.
  - **Response**: `200 OK` (updated).

#### 7.2 Security (Write Actions)
- **Mechanism**: Same `X-Secret-Key` header as read-paths.
- **Policy**:
  - Write actions are **strictly** gated.
  - Missing or invalid key returns `401 Unauthorized` immediately.
  - **Audit**: All control actions are logged to server-side stdout with `[AUDIT]` tag (Operator IP + Action).

#### 7.3 UI Specifications

##### 7.3.1 Task Terminal (Jarvis Input)
- **Location**: Bottom of Dashboard or dedicated "Command" card.
- **Style**: Monospace input, terminal aesthetic (dark background, green cursor).
- **Behavior**:
  - `Enter` to submit.
  - `Up/Down` arrow for history (nice to have).
  - **Feedback**: optimizing for "Command Sent" toast vs. full stream output (V2 MVP = fire and forget).
- **Validation**: Client-side check for empty strings.

##### 7.3.2 Kill Modal (Safety Interlock)
- **Trigger**: "Kill" button on an Active Session card.
- **Visuals**:
  - Danger/Destructive styling (Red accents).
  - **Content**: "Terminate Session [ID]?"
  - **Action**: "Terminate" (Red) / "Cancel" (Gray).
- **Logic**:
  - Must display the exact Session ID being targeted.
  - Button disabled while request is in-flight.
