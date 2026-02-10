# Relay layeR

> The agentic command center. Kanban-based project management dashboard for orchestrating an AI agent ecosystem.

**Codename:** Relay layeR (relay_layer) — yes, it's a palindrome.

**Domain:** relay.kukso.com

**Owner:** Burak Dorman (@burakdorman)
**Orchestrator:** Bulut ☁️

## Overview

Relay layeR is a purpose-built dashboard for managing and monitoring a multi-agent AI ecosystem. It provides real-time visibility into task pipelines, agent communications, live progress tracking, and ecosystem-wide statistics.

Unlike generic PM tools, Relay layeR is designed around the concept of autonomous agents that emit structured events as they work. The dashboard is a live, event-driven window into the ecosystem.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Next.js |
| Backend | Node.js API |
| Real-time | WebSocket |
| Database | SQLite |
| Auth | Telegram Bot API (DM codes) |

## Key Features

- 7-column Kanban pipeline (INBOX → PUBLISHED)
- Telegram-styled agent chat viewer
- Live task progress (progress bar + structured logs)
- Event-driven card updates (no manual drag-and-drop)
- Collapsible activity sidebar
- Collapsible agents sidebar with full profile cards
- Global statistics (tasks/week, LLM cost tracking)
- PIN-protected broadcast (task creation)
- Multi-project support with project switching
- 3-layer authentication (PIN → Telegram code → 24h session)
- Dark theme inspired by balancer.fi
- Fully mobile responsive

## Documentation

- [Master Plan](docs/PLAN.md)
- [Event Protocol](docs/EVENT_PROTOCOL.md)
- [Structural Design](docs/STRUCTURE.md)

## Status

🟡 Planning Phase
