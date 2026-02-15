# Changelog

## [Unreleased] - 2026-02-15

### Added - Enhanced Reporting & Analytics

**New API Endpoints:**
- `GET /api/stats/reports/project-health` - Comprehensive project health dashboards
- `GET /api/stats/reports/agent-performance` - Detailed agent performance metrics
- `GET /api/stats/reports/token-analytics?range={days}` - Token usage analytics with time range filters

**Features:**

#### 1. Project Health Reports
- Total, completed, in-progress, and blocked tasks count
- Completion rate percentage
- Average task duration (hours)
- Weekly velocity (tasks completed per week)
- Bottleneck detection (identifies slowest status)
- Active agents count per project
- Total cost per project

#### 2. Agent Performance Reports
- Tasks completed, in-progress, and blocked per agent
- Average completion time (from start to done)
- Average response time (from assignment to first action)
- Workload score (0-100 based on active tasks)
- Total cost and average cost per task
- Token efficiency ratio (output/input tokens)
- Recent activity timestamp

#### 3. Token Analytics
- **By Project:** Total tokens, input/output breakdown, total cost, avg cost per task
- **By Agent:** Total tokens, cost, efficiency metrics
- **By Model:** Usage counts, token consumption, cost per model
- **Daily Timeline:** Historical token usage and cost trends
- Supports time range filters: 7, 30, 90 days

**UI Components:**
- New `ReportsModal` component with 3 tabs (Project Health, Agent Performance, Token Analytics)
- PieChart icon button in header for quick access
- Comprehensive metrics cards with color-coded indicators
- Responsive design for mobile and desktop
- Real-time data loading with loading states

**Backend Services:**
- `getProjectHealthReports()` - Calculates project metrics with SQL aggregations
- `getAgentPerformanceReports()` - Computes agent performance indicators
- `getTokenAnalytics(range?)` - Analyzes token usage across multiple dimensions

### Technical Details
- Added SQL queries for efficient aggregation of tasks, token_usage, and events data
- Implemented bottleneck detection algorithm (finds status with highest avg time)
- Added velocity calculation (7-day rolling window)
- Token efficiency metric: output tokens / input tokens ratio
- Workload score: (in_progress_tasks * 20), capped at 100

### Files Changed
- `packages/api/src/services/statsService.ts` - Added 3 new report functions
- `packages/api/src/routes/stats.ts` - Registered 3 new API endpoints
- `packages/web/src/components/modals/ReportsModal.tsx` - New UI component (17KB)
- `packages/web/src/components/layout/Header.tsx` - Added Reports button
- `packages/web/src/stores/uiStore.ts` - Added reportsOpen state
- `packages/web/src/app/dashboard/page.tsx` - Imported ReportsModal

### Deployment
- Build completed successfully: 2026-02-15 06:52 UTC
- Services restarted: relay-api, relay-web, relay-worker
- All services online and stable
- No breaking changes to existing endpoints

---

## Previous Releases
(See git history for full changelog)
