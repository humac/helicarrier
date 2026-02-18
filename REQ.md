# Project Helicarrier - Requirements (V3 Sprint)

## 1) Product Objective
Evolve Helicarrier from Command & Control (V2) into an **Intelligence** layer (V3) that enables:
- forensic session review,
- cost/runtime visibility,
- model effectiveness comparison,
- and proactive budget/performance alerting.

## 2) Sprint Scope (V3)
This sprint implements four V3 capabilities:
1. **Session History Ledger**
2. **Usage Analytics** (tokens, runtime, cost)
3. **Model Performance Matrix**
4. **Alerting Thresholds**

## 3) User Stories

### US-301: Session History Ledger
As an operator, I want a searchable history of completed/past sessions so I can audit outcomes and investigate failures.

### US-302: Usage Analytics
As an operator, I want usage analytics (tokens/runtime/cost) over time so I can identify waste and control spending.

### US-303: Model Performance Matrix
As an operator, I want to compare model success rates by task type so I can choose the most reliable model for future runs.

### US-304: Alerting Thresholds
As an operator, I want configurable alert thresholds for spend/runtime/error signals so I can intervene before budgets or SLAs are breached.

## 4) Functional Requirements

### 4.1 Session History Ledger (FR-LG)
- **FR-LG-01**: System must persist session metadata and lifecycle outcomes for completed and terminated sessions.
- **FR-LG-02**: Ledger UI must support filtering by agent, outcome (`success|failed|killed|cancelled`), model, and date range.
- **FR-LG-03**: Ledger UI must support keyword search by session id/title/task text.
- **FR-LG-04**: Session detail view must show transcript/event timeline and links to produced artifacts/diffs when available.
- **FR-LG-05**: Sorting must support newest-first by default and toggling by runtime/cost.
- **FR-LG-06**: Empty/error states must be explicit and operator-readable.

### 4.2 Usage Analytics (FR-UA)
- **FR-UA-01**: System must capture token usage per session (prompt/completion/total where available).
- **FR-UA-02**: System must capture runtime duration per session and aggregate by day/agent/model.
- **FR-UA-03**: System must estimate or record cost per session and provide daily/weekly totals.
- **FR-UA-04**: Dashboard must provide time-series visualization for tokens, runtime, and cost.
- **FR-UA-05**: Analytics view must allow date-range and dimension filters (agent/model/task label).
- **FR-UA-06**: Data freshness target: analytics reflect newly completed sessions within agreed ingestion window (target ≤ 5 minutes).

### 4.3 Model Performance Matrix (FR-PM)
- **FR-PM-01**: System must compute success rate by model over selectable date ranges.
- **FR-PM-02**: Matrix must include at minimum: total runs, success count, failure count, success rate, median runtime, median cost.
- **FR-PM-03**: Matrix must support segmentation by agent and task category when metadata exists.
- **FR-PM-04**: UI must expose confidence caveat when sample size is below threshold (e.g., n < 5).
- **FR-PM-05**: Failed runs must be drillable to corresponding ledger entries.

### 4.4 Alerting Thresholds (FR-AL)
- **FR-AL-01**: Operators must be able to configure threshold rules for daily cost, runtime overrun, and failure-rate spikes.
- **FR-AL-02**: Thresholds must support scope at global and per-agent/per-model levels.
- **FR-AL-03**: Alert evaluation must run on ingestion/update and trigger state transitions (`ok|warning|critical`).
- **FR-AL-04**: Active alerts must be visible in dashboard HUD with timestamp and triggering metric.
- **FR-AL-05**: Alert notifications must include metric value, threshold, and affected scope.
- **FR-AL-06**: Alert dedup/suppression must prevent repeated noisy notifications for unchanged violations.

## 5) Cross-Feature Requirements
- **FR-CF-01**: All analytics inputs and derived metrics must be auditable and traceable to source sessions.
- **FR-CF-02**: Metric definitions (success, runtime, cost) must be documented and consistent across UI/API.
- **FR-CF-03**: Historical queries must be backed by persistent storage (no log-only dependency).
- **FR-CF-04**: Existing V1/V2 operational features must remain functional (no regression to monitoring/control actions).

## 6) Acceptance Criteria (Explicit)

### AC-Ledger
- Operator can filter and search past sessions by agent/outcome/date and open a session detail view.
- Detail view includes timeline/transcript with artifact links when present.
- Ledger returns consistent results after service restart (proves persistence).

### AC-Usage Analytics
- For a selected date range, dashboard shows tokens/runtime/cost totals and trend charts.
- At least one known test dataset produces expected aggregate totals within acceptable tolerance.
- Newly completed session metrics appear in analytics within the ingestion SLA.

### AC-Performance Matrix
- Matrix displays model rows with runs, success/failure counts, success rate, median runtime, and median cost.
- Filtering by date and agent updates matrix correctly.
- Clicking a failed metric cell/drilldown opens relevant ledger failures.

### AC-Alerting
- Configured thresholds can be created/updated and persisted.
- Crossing a threshold creates visible HUD alert with correct severity and metric payload.
- Repeated evaluations without state change do not spam duplicate alerts.
- Returning below threshold resolves or downgrades alert state according to rule policy.

### AC-Non-Regression
- V1 Hero Grid/System Pulse and V2 kill/spawn/reassign remain operational in smoke tests.

## 7) Out of Scope (V3 Sprint)
- V4 autonomy features (auto-scale, auto-kill/respawn, budget hard-stop enforcement automation).
- Full public-deployment auth redesign (Auth V2).
- Multi-tenant billing/invoicing.
- Predictive forecasting/ML recommendations beyond descriptive analytics.
- Cross-project federation (single pane across multiple Helicarrier instances).

## 8) Dependencies & Risks
- Persistent data store selection/migration (SQLite/Postgres) and schema readiness.
- Upstream provider telemetry completeness for token/cost fields.
- Stable event ingestion pipeline and idempotent aggregation jobs.
- Clear metric taxonomy for task categories and success outcome labeling.

## 9) Handoff Status
**REQ V3 Sprint is ready for @tony (Architect)** to produce updated architecture/design and implementation task breakdown.