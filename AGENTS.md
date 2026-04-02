# RBAC Platform Agent Guide

This file is for coding agents working in `E:\OpenCode\RBAC-Platform`.
Focus on making small, consistent changes that match the existing FastAPI + React codebase.

## Rule Files

- No Cursor rules were found in `.cursor/rules/`.
- No `.cursorrules` file was found.
- No Copilot instructions were found in `.github/copilot-instructions.md`.
- Treat this file as the primary agent instruction source inside the repository.

## Repository Shape

- `backend/`: FastAPI app, SQLAlchemy models, Pydantic schemas, Alembic migrations, pytest tests.
- `frontend/`: Vite + React 19 + TypeScript + Ant Design app.
- `deploy/docker/`: Docker Compose files for infra, dev, and production-like runs.
- `Makefile`: Docker and infra helper commands.

## Core Workflow

- Prefer local, minimal edits over broad refactors.
- Preserve existing Chinese user-facing copy unless the task requires changing it.
- Do not invent new architecture layers unless repetition or reuse clearly justifies it.
- When adding backend features, update models, schemas, router logic, and tests together.
- When adding frontend features, keep API access in `src/api/`, state in Zustand stores if shared, and page UI in `src/pages/`.

## Setup Commands

### Infrastructure

Run from repository root:

```bash
make infra
make infra-down
make dev
make dev-down
make status
```

Direct Docker Compose equivalents:

```bash
docker compose -f deploy/docker/compose.infra.yml up -d
docker compose -f deploy/docker/compose.infra.yml down
docker compose -f deploy/docker/compose.yml up -d
docker compose -f deploy/docker/compose.yml down
```

### Backend Setup

Run from `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Notes:

- Tests set `SKIP_DB_INIT=1` in `backend/tests/conftest.py`.
- The repository documents Ruff usage, but `ruff` is not pinned in `backend/requirements.txt`; install it separately if needed.

### Frontend Setup

Run from `frontend/`:

```bash
npm install
npm run dev
npm run build
npm run lint
```

Useful direct checks:

```bash
npx tsc -b
npx eslint src
```

## Build And Lint Commands

### Backend

Run from `backend/`:

```bash
ruff check .
ruff check . --fix
pytest -v
```

There is no repo-local `pyproject.toml`, `ruff.toml`, or `pytest.ini` in `backend/` currently.

### Frontend

Run from `frontend/`:

```bash
npm run build
npm run lint
npx tsc -b
```

There is currently no frontend unit test runner configured in `package.json`.

## Test Commands

### Run All Backend Tests

```bash
cd backend
pytest -v
```

### Run A Single Test File

```bash
cd backend
pytest tests/test_auth_flow.py -v
```

### Run A Single Test Function

```bash
cd backend
pytest tests/test_auth_flow.py::test_login_returns_tokens -v
```

### Run Tests Matching A Keyword

```bash
cd backend
pytest -k auth -v
```

### Stop On First Failure

```bash
cd backend
pytest -x -v
```

### Frontend Tests

- No frontend test command exists yet.
- If you add frontend tests, document the exact command in this file.

## Backend Style Guidelines

- Follow the existing import grouping: standard library, third-party, local modules.
- Use one import per line group; avoid unused imports.
- Prefer explicit imports from local modules such as `from core.responses import success`.
- Use Python 3.10 union syntax like `str | None`, not `Optional[str]`.
- Keep type hints on function parameters and return values when practical.
- Use SQLAlchemy 2 typed models with `Mapped[...]` and `mapped_column(...)`.
- Keep table names in `snake_case` strings such as `"sys_user"`.
- Model classes use `PascalCase`; fields and variables use `snake_case`.
- Keep shared mixins in `models/base.py` patterns rather than duplicating timestamp or audit fields.
- Prefer small private serializer helpers like `_build_user_payload()` when response shaping is nontrivial.
- Return API payloads through `core.responses.success()` for normal success cases.
- Raise `HTTPException` with clear `detail` messages for request and business rule failures.
- Preserve current soft-delete behavior using `is_deleted` rather than hard deletes unless explicitly required.
- Update `created_by` and `updated_by` where the surrounding module already follows that audit pattern.
- Use Shanghai timezone conventions already defined in `models.base.SHANGHAI_TZ`.
- Keep route handlers thin when possible, but do not create abstraction layers without a real reuse need.
- Match existing pagination shape: `items`, `total`, `page`, `page_size`.
- Prefer query construction with `select(...)`, `where(...)`, and SQLAlchemy expressions over raw SQL.
- In tests, follow the current fake dependency override pattern in `backend/tests/test_auth_flow.py`.

## Frontend Style Guidelines

- Use TypeScript everywhere in `src/`.
- Keep strict typing intact; `frontend/tsconfig.app.json` enables `strict`, `noUnusedLocals`, and `noUnusedParameters`.
- Component names, store hooks, and exported page components use `PascalCase` or `camelCase` as appropriate.
- React components are function components.
- Keep page components in `src/pages/` and export named page components such as `UsersPage`.
- Keep API helpers in `src/api/*.ts` and name them with an `Api` suffix, for example `fetchUsersApi`.
- Import types with `import type` when only types are used.
- Use `camelCase` for variables and functions; use backend field names like `page_size` or `department_id` only where API shape requires them.
- Reuse shared interfaces from `src/types.ts` or `src/types/` instead of redefining common response shapes.
- Keep authentication and shared app state in Zustand stores under `src/store/`.
- Use Ant Design components consistently for forms, tables, modals, messages, and layout controls.
- Prefer async event handlers with `try/catch/finally` for submit, load, and delete flows.
- Show user-facing errors with `message.error(...)` and success states with `message.success(...)`.
- Preserve the existing Axios wrapper in `src/utils/request.ts`; add cross-cutting request behavior there instead of repeating it in pages.
- Use lazy routes and route guards consistently with `src/router/index.tsx`.
- Follow the existing quote and semicolon style already enforced by the frontend ESLint setup and current files.

## Error Handling

- Backend: prefer explicit `HTTPException` responses over silent failures.
- Backend: include messages that the frontend can display directly when the text is user-safe.
- Frontend: catch API failures around mutations and major page loads.
- Frontend: do not swallow errors silently unless local logout or cleanup should remain best-effort.
- For non-login API failures, preserve the existing global request interceptor behavior unless the task requires a different UX.

## Naming And File Conventions

- Backend module routers live at `backend/modules/<module>/router.py`.
- Backend schema files mirror domain names such as `schemas/user.py`, `schemas/role.py`.
- Frontend page filenames are lowercase with dashes only when already established; most current files are lowercase single words like `users.tsx`.
- Store hooks use the `use...Store` pattern, for example `useAuthStore`.
- Permission codes use colon-delimited strings like `system:user:create`.

## Validation Before Finishing

- Run targeted tests for the touched backend area when possible.
- Run `npm run lint` and `npx tsc -b` for frontend edits.
- Run `pytest` for backend edits, or at least the affected file/test function.
- If you could not run verification, state that clearly in your final summary.

## Agent Notes

- Prefer editing the existing root `AGENTS.md` rather than adding another one elsewhere.
- Keep future updates concrete and command-oriented.
- If tooling changes, update this file with the exact command agents should run.
