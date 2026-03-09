# Tiltmeter

Tiltmeter is a full-stack analytics platform for Faceit CS2 players. It turns raw match history into clear performance insights, tilt detection, session momentum signals, and practical queue recommendations.

It combines backend engineering, data engineering, analytics, and product thinking into one end-to-end product.

---

## Features

- Search Faceit players by nickname
- Ingest Faceit match history into PostgreSQL
- Enrich matches with player-level stats (kills/deaths/assists/K/D)
- Generate form and performance summaries
- Detect tilt signals from recent vs baseline performance
- Predict next-match tilt risk with a transparent heuristic
- Surface Smart Queue Advisor actions (`Queue`, `Take a break`, `Stop queueing`)
- Track Session Momentum using recent outcomes
- Analyze map-level performance trends
- Review recent matches and timeline patterns in a polished dashboard UI

---

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- httpx (Faceit API client)
- Docker / Docker Compose

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Custom CSS (no UI framework dependency)

---

## Architecture & Data Flow

```text
Faceit API
  -> Match History Ingestion
  -> Match Enrichment (per-match player stats)
  -> PostgreSQL
  -> Analytics Layer (summary, session, tilt, maps)
  -> Dashboard API (FastAPI)
  -> Next.js Frontend
```

High-level flow:

1. User searches a Faceit nickname.
2. Backend resolves player profile and stores/updates player metadata.
3. Analyze pipeline refreshes matches, enriches stats, and materializes summary insights.
4. Dashboard endpoint aggregates player info + analytics blocks.
5. Frontend renders Smart Queue Advisor, insights, trend chart, maps, timeline, and match tables.

---

## Project Structure

```text
tiltmeter/
+- backend/
�  +- app/
�  �  +- main.py
�  �  +- models.py
�  �  +- db.py
�  �  +- match_service.py
�  �  +- dashboard_service.py
�  �  +- summary_service.py
�  �  L- ...
�  L- Dockerfile
+- frontend/
�  +- app/
�  �  +- page.tsx
�  �  +- globals.css
�  �  L- api/[...path]/route.ts
�  +- components/
�  +- lib/
�  �  +- api.ts
�  �  +- types.ts
�  �  L- ux.ts
�  L- package.json
+- docker-compose.yml
L- README.md
```

---

## Local Setup

## Prerequisites

- Docker + Docker Compose
- Node.js 18+ and npm

## 1) Start backend (and database)

From project root:

```bash
docker compose up --build
```

Backend should be available at:

- `http://localhost:8000`

## 2) Start frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend should be available at:

- `http://localhost:3000`

---

## Environment Variables

Create a `.env` file (or configure env in your Docker setup) with at least:

```env
FACEIT_API_KEY=<YOUR_FACEIT_API_KEY>
POSTGRES_DB=<YOUR_DB_NAME>
POSTGRES_USER=<YOUR_DB_USER>
POSTGRES_PASSWORD=<YOUR_DB_PASSWORD>
POSTGRES_HOST=<YOUR_DB_HOST>
POSTGRES_PORT=<YOUR_DB_PORT>
```

Notes:

- `FACEIT_API_KEY` is required for Faceit API requests.
- Database variables should match your Docker/PostgreSQL configuration.

---

## Main API Endpoints

### Health

- `GET /health`

### Player discovery

- `GET /players/search?nickname={nickname}`

### Analyze pipeline

- `POST /players/{player_id}/analyze?match_limit=50&summary_limit=20`

### Dashboard

- `GET /players/{player_id}/dashboard`

### Additional analytics endpoints

- `GET /players/{player_id}/form-history?window_size=20&limit=30`
- `GET /players/{player_id}/matches/recent?limit=15`
- `GET /players/{player_id}/maps`
- `GET /players/{player_id}/tilt-detection`
- `GET /players/{player_id}/session`

---

## Screenshots

Add your UI screenshots here:

- `docs/screenshots/dashboard-overview.png`
- `docs/screenshots/smart-queue-advisor.png`
- `docs/screenshots/form-trend-and-maps.png`

Markdown example:

```md
![Dashboard Overview](docs/screenshots/dashboard-overview.png)
```

---

## Why This Project Is Interesting

Tiltmeter demonstrates how to build a complete analytics product, not just isolated APIs or UI components.

It showcases:

- Backend API design with FastAPI and SQLAlchemy
- Data ingestion + enrichment pipelines from third-party APIs
- Time-window analytics (recent vs baseline)
- Product-oriented insight generation (queue recommendations)
- Frontend UX translation of complex metrics into actionable decisions
- End-to-end engineering from raw data to decision-support interface

---

## Future Improvements

- Background jobs (Celery/RQ) for scheduled ingestion and enrichment
- Historical trend pages (form/tilt over long horizons)
- Role-aware analytics (entry, support, lurk tendencies)
- Multi-player comparison mode
- Alerting rules (auto "take a break" notifications)
- Caching and performance tuning for larger player datasets
- Auth + saved player watchlists
- Automated tests and CI pipeline hardening

---

## Author

**Yerkin Baizhanov**

- GitHub: [github.com/yerkinbs](https://github.com/yerkinbs)
- LinkedIn: [linkedin.com/in/yerkabs](https://www.linkedin.com/in/yerkabs/)
- Telegram: [@yerkabs](https://t.me/fuckufuckinfuck6)
- Repository: [github.com/yerkabs/tiltmeter](https://github.com/yerkabs/tiltmeter)
