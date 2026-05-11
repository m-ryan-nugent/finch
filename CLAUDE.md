# Finch

Personal finance tracking application for self-hosted homelab deployment. Single-user, no auth (Tailscale controls access).

## Tech Stack

### Backend
- **Runtime**: Python 3.12+, FastAPI, Uvicorn
- **Database**: PostgreSQL, SQLAlchemy 2.x (async + asyncpg), Alembic
- **Validation**: Pydantic v2, pydantic-settings
- **Package manager**: uv

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **Server state**: TanStack Query v5
- **Forms**: React Hook Form
- **Charts**: Recharts
- **HTTP client**: Axios
- **Icons**: Lucide React
- **Package manager**: npm

## Project Structure

```
backend/
  app/
    api/v1/routes/    # Route handlers (thin — delegate to services)
    core/             # config.py (settings), database.py (engine/session)
    models/           # SQLAlchemy ORM models + enums
    schemas/          # Pydantic request/response schemas
    services/         # Business logic (one file per resource)
    main.py           # App assembly, CORS, lifespan
  alembic/            # Database migrations
  Dockerfile

frontend/
  src/
    api/              # Axios instance + one file per resource
    components/       # Reusable UI components (Modal, Badge, Button, etc.)
    pages/            # One file per route
    types/            # TypeScript interfaces matching backend schemas
    hooks/            # Custom hooks wrapping TanStack Query calls
    utils/            # Formatters (currency, date)
    App.tsx           # Routing and provider setup
    main.tsx          # Entry point
  Dockerfile          # Multi-stage: node build, nginx serve
  nginx.conf          # SPA fallback + API proxy
```

## Local Development

### Backend
```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if needed
uv sync                # install dependencies
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

Vite proxies `/api` requests to `http://localhost:8000` during development.

## Environment Variables

| Variable       | Default                                              | Description        |
|----------------|------------------------------------------------------|--------------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/finch` | Async PG connection |
| `APP_ENV`      | `development`                                        | `development` or `production` |

## Conventions

### Backend
- **Schemas**: Base/Create/Update/Response pattern. Update uses `exclude_unset=True` for PATCH semantics.
- **Enums**: Python `str, Enum` stored as `String(50)` columns (not native PG enums).
- **Money**: Always `Decimal` / `Numeric(12, 2)`. Never `float`.
- **Balances**: Updated eagerly on every transaction CRUD, not computed from history.
- **Async**: No `asyncio.gather` with shared sessions. Use `selectinload()` for relationships.

### Frontend
- **Types**: TypeScript union string literals for enums (not TS `enum`). Monetary values typed as `string` (backend sends Decimal as string).
- **API calls**: Axios with `/api/v1` base URL. All FastAPI paths use trailing slashes (`/accounts/`).
- **State**: TanStack Query for all server state. Query key factory in `hooks/queryKeys.ts`.
- **Cache invalidation**: Transaction mutations invalidate transactions, accounts, dashboard, and budgets. Account mutations invalidate accounts and dashboard.
- **Forms**: React Hook Form with validation matching backend constraints. PATCH sends only changed fields via `exclude_unset`.
- **Dates**: Display as "MMM D, YYYY". Append `T00:00:00` to date-only strings before `new Date()` to avoid timezone shift.
- **Currency**: `formatCurrency()` in `utils/format.ts` using `Intl.NumberFormat`.

## Migrations

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```
