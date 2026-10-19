# FinTrack - Living Project State & Architectural Context

## 1. Project Overview & Architecture

- **Goal**: Production-style personal finance management application built as a serious backend and full-stack engineering practice project[cite: 9].
- **Architecture**: Monorepo with a FastAPI modular monolith backend and a decoupled client-side React SPA[cite: 9, 10].
- **Directory Structure**:
    02_fintrack/
    ├── backend/               # FastAPI Modular Monolith[cite: 9, 10]
    ├── frontend/              # Vite + React (JavaScript) + Tailwind CSS v4
    ├── .github/workflows/     # GitHub Actions CI/CD Pipeline
    ├── docker-compose.yml     # Multi-Container Orchestration (API, DB, Redis, Worker)
    └── PROJECT_STATE.md       # Living Context Anchor

---

## 2. Technology Stack & Specifications

### Backend (/backend)

- **Language & Runtime**: Python 3.12+ managed with uv[cite: 9, 10]
- **Framework**: FastAPI with Pydantic v2 schemas[cite: 9]
- **Persistence**: PostgreSQL 16, SQLAlchemy 2.0 (Asyncpg), Alembic migrations[cite: 9, 10]
- **Authentication**: JWT access token (JSON payload) + HTTP-only refresh token cookie with token-family rotation and revocation tracking[cite: 3, 9, 10]
- **Password Hashing**: Argon2id via Passlib / pwd_context[cite: 9]
- **Asynchronous Workers**: Celery + Redis message broker and backend [custom isolated event loop runner for async SQLAlchemy operations](cite: 9)
- **Security & Rate Limiting**: SlowAPI with Redis backend (multi-tiered 5/minute;20/hour on /login, disabled when ENVIRONMENT=test)
- **Observability**: /api/v1/healthz endpoint verifying active PostgreSQL and Redis connectivity
- **Testing**: pytest, pytest-asyncio, httpx [27 integration tests covering all routes and business constraints](cite: 9, 10)

### Frontend (/frontend)

- **Build Tool & Framework**: Vite + React 19 (JavaScript — .jsx)
- **Styling**: Tailwind CSS v4 (configured via @tailwindcss/vite plugin and @import "tailwindcss"; in src/index.css)
- **State Management & Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios with request/response interceptors for automatic Bearer token injection and seamless cookie-based refresh rotation on 401s
- **Icons & Visuals**: lucide-react, recharts

### Infrastructure & Deployment

- **Docker Compose**
  1. fintrack_postgres: postgres:16-alpine (persistent volume postgres_data)
  2. fintrack_redis: redis:7-alpine
  3. fintrack_api: FastAPI backend running on port 8000 with automatic alembic upgrade head on startup
  4. fintrack_worker: Celery worker executing app.tasks.export_tasks
- **CI/CD**: GitHub Actions workflow (.github/workflows/ci.yml) running ephemeral PostgreSQL and Redis service containers, executing uv run pytest -v, and verifying the multi-stage Docker build

---

## 3. Completed Milestones (Backend Complete)

1. **Auth Domain**: Registration, login, cookie-based token family rotation, logout, and /me[cite: 10].
2. **Category Domain**: Ownership-scoped access, system default defaults, and expense/income integrity[cite: 10].
3. **Transaction Domain**: Full CRUD with type matching, date range filters, pagination, and tenant isolation[cite: 10].
4. **Reports Domain**: SQL aggregates (COALESCE, SUM, GROUP BY) calculating total income, total expense, net savings, and category percentage breakdown[cite: 1, 10].
5. **Budgets Domain**: Category-scoped monthly spending ceilings with real-time remaining balance and is_over_budget tracking[cite: 10].
6. **Async Reporting Engine**: Celery + Redis background pipeline generating and streaming CSV downloads.
7. **Containerization**: Multi-stage Dockerfile and docker-compose.yml operational.
8. **Automated Testing & CI**: 27 unit and integration tests passing with automated GitHub Actions CI execution[cite: 10].

---

## 4. Current Phase: Frontend Development (/frontend)

### Active Deliverables Checklist

- [x] Scaffolding: Vite + React (JavaScript) initialized in frontend/.
- [x] Styling: Tailwind CSS v4 configured with @tailwindcss/vite and verified.
- [ ] API Client (src/api/client.js): Axios instance with request token injection and 401 refresh interceptor.
- [ ] Auth State (src/context/AuthContext.jsx): Centralized auth context with memory-stored access token and user state.
- [ ] Routing: Public (/login, /register) and protected routes (/, /transactions, /budgets, /reports).
- [ ] Dashboard View: Monthly KPI cards, expense distribution chart (Recharts), and recent activity feed.
