# Learning Resources

Curated references for the technologies used in Finch.

## FastAPI

- [Official Tutorial](https://fastapi.tiangolo.com/tutorial/) — step-by-step guide covering all core features
- [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template) — production patterns from the FastAPI creator

## SQLAlchemy 2.x (Async)

- [Async I/O Extension](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) — official docs for async engine, session, and queries
- [ORM Quick Start](https://docs.sqlalchemy.org/en/20/orm/quickstart.html) — `Mapped`, `mapped_column`, and the 2.x declarative style
- [What's New in SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/changelog/migration_20.html) — context for why the API looks different from older tutorials

## Alembic

- [Auto Generating Migrations](https://alembic.sqlalchemy.org/en/latest/autogenerate.html) — how `--autogenerate` works and its limitations
- [Cookbook: Async with asyncpg](https://alembic.sqlalchemy.org/en/latest/cookbook.html#using-asyncio-with-alembic) — the exact pattern used in this project

## Pydantic v2

- [Pydantic v2 Docs](https://docs.pydantic.dev/latest/) — models, validators, serialization
- [Migration from v1](https://docs.pydantic.dev/latest/migration/) — useful context if you encounter v1-style code in tutorials

## PostgreSQL

- [Data Types](https://www.postgresql.org/docs/current/datatype.html) — especially NUMERIC vs FLOAT for financial data
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) — practical guide covering queries, joins, indexes

## REST API Design

- [RESTful API Design Best Practices](https://restfulapi.net/) — naming conventions, status codes, CRUD patterns
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) — MDN reference for when to use which code

## Python Tooling

- [uv Documentation](https://docs.astral.sh/uv/) — fast package manager and project runner
- [Type Hints Cheat Sheet](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html) — quick reference for Python type annotations

## React + TypeScript

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) — patterns for props, hooks, context, and forms in TypeScript
- [React Docs](https://react.dev/) — official React documentation with hooks-first approach

## TanStack Query (React Query)

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview) — queries, mutations, cache invalidation, and devtools
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query) — best practices from a core maintainer

## Tailwind CSS

- [Tailwind CSS Docs](https://tailwindcss.com/docs/) — utility class reference and configuration guide
- [Tailwind UI Patterns](https://tailwindui.com/components) — component design patterns (free previews available)

## React Hook Form

- [React Hook Form Docs](https://react-hook-form.com/) — registration, validation, and performance optimization
- [API Reference](https://react-hook-form.com/docs) — useForm, register, watch, and error handling

## Recharts

- [Recharts Docs](https://recharts.org/en-US/) — composable chart components built on D3
- [API Reference](https://recharts.org/en-US/api) — BarChart, LineChart, ResponsiveContainer, and customization

## Vite

- [Vite Guide](https://vite.dev/guide/) — dev server, build configuration, and environment variables
- [Configuring Vite](https://vite.dev/config/) — proxy setup, plugins, and build options
