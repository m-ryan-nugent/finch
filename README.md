# Finch

Personal finance tracking application for self-hosted homelab deployment. Tracks accounts, transactions, budgets, and recurring items with a dashboard view.

Single-user, no app-level auth — access is controlled by Tailscale.

## Features

- Account management with real-time balance tracking
- Transaction CRUD with category tagging
- Recurring transactions with automatic generation
- Budget tracking by category
- Dashboard with spending summaries and charts
- CSV export

## Tech Stack

**Backend:** Python 3.12, FastAPI, PostgreSQL, SQLAlchemy 2 (async), Alembic, uv

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL running locally
- [uv](https://docs.astral.sh/uv/) installed

### Backend

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API available at `http://localhost:8000` — interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite proxies `/api` requests to `http://localhost:8000` during development.

## Environment Variables

| Variable       | Default | Description |
|----------------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/finch` | Async PostgreSQL connection string |
| `APP_ENV`      | `development` | `development` or `production` |

## Deployment

Deployed to a Raspberry Pi K3s cluster. Docker images are published to GHCR via GitHub Actions on push to `main` or a git tag.

See [DEPLOY.md](DEPLOY.md) for full Kubernetes deployment instructions.

## Migrations

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

## Learning Resources

See [RESOURCES.md](RESOURCES.md) for curated docs on the libraries used in this project.
