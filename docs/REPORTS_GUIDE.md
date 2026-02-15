# Enhanced Reporting Guide

## Accessing Reports

1. **Open Relay Dashboard:** https://relay.kukso.com
2. **Click the PieChart icon** (📊) in the header next to the BarChart icon
3. **Select a tab:**
   - **Project Health** - Overview of all projects
   - **Agent Performance** - Individual agent metrics
   - **Token Analytics** - Cost and usage breakdown

## Features

### 📊 Project Health
Shows for each project:
- **Completion Rate** - % of tasks done
- **Velocity** - Tasks completed this week
- **Bottleneck** - Slowest status (where tasks get stuck)
- **Active Agents** - Team members working on the project
- **Cost Tracking** - Total spend per project

**Use Cases:**
- Identify which projects are progressing well
- Find bottlenecks slowing down delivery
- Track project costs

### 👥 Agent Performance
Shows for each agent:
- **Tasks Completed** - Total finished tasks
- **Workload Score** - 0-100 (based on active tasks)
- **Response Time** - How quickly they start work
- **Completion Time** - How long tasks take
- **Token Efficiency** - Output/input ratio (higher = more efficient)
- **Cost Per Task** - Average spend

**Use Cases:**
- Balance workload across agents
- Identify high-performing agents
- Optimize token efficiency

### 💰 Token Analytics
Four views:
1. **By Project** - Which projects cost the most
2. **By Agent** - Which agents use the most tokens
3. **By Model** - Which models are most used/expensive
4. **Timeline** - Daily token usage trends

**Time Filters:** 7 days, 30 days, 90 days

**Use Cases:**
- Optimize model selection
- Track spending trends
- Identify cost-saving opportunities

## Tips

- **Velocity:** Track weekly to see if project pace is improving
- **Bottlenecks:** If a status has high avg time, investigate why
- **Workload:** Keep agents below 80% to avoid burnout
- **Token Efficiency:** Higher is better (more output per input)
- **Timeline:** Look for spikes to understand usage patterns

## API Endpoints

For programmatic access:
```bash
# Project Health
GET /api/stats/reports/project-health

# Agent Performance
GET /api/stats/reports/agent-performance

# Token Analytics (with range)
GET /api/stats/reports/token-analytics?range=30
```

All endpoints require authentication.

---

**Dashboard:** https://relay.kukso.com
**Updated:** 2026-02-15
