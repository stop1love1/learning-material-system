# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **monorepo** (single git repo, pushed to `github.com/stop1love1/learning-material-system`) for the **Vườn Văn / Học Viện LMS** — học liệu môn Tiếng Việt Tiểu học (ở tiểu học môn này gọi là "Tiếng Việt", không gọi "Ngữ văn"). Two apps, both pnpm:

- `frontend/` — Next.js 16 (App Router, React 19, TypeScript, Tailwind v4, antd installed).
- `backend/` — NestJS 11 + MongoDB (Mongoose), JWT auth.

There is no root-level package manager; `cd` into each app. The two apps were each scaffolded with their own toolchain, then the nested `.git`s were removed and a single repo was created at root.

## Commands

```bash
# Frontend (cd frontend)
pnpm dev            # http://localhost:3000
pnpm build          # next build (runs tsc; does NOT run eslint — see next.config.ts)
pnpm lint           # eslint (separate; not part of build)

# Backend (cd backend) — needs MongoDB on the URI in backend/.env. CAUTION: .env may point
# at MongoDB Atlas (mongodb+srv://…), NOT local 127.0.0.1 — any mongosh/script data work must
# use the URI from backend/.env or it will silently hit the wrong database.
pnpm start:dev      # watch mode, http://localhost:3001/api  ·  Swagger /api/docs
pnpm build          # nest build
pnpm seed           # ts-node src/seed.ts → creates default admin (ADMIN_EMAIL/ADMIN_PASSWORD,
                    #   default admin@vuonvan.vn / admin123456)
pnpm test           # jest;  pnpm test -- <file.spec.ts>  for a single file
```

MongoDB is required for the backend to boot. On Windows it was installed via `winget install MongoDB.Server` (runs as a service on 27017) — not Docker. Env files (`backend/.env`, `frontend/.env.local`) are git-ignored; `.env.example` files are tracked.

## Backend architecture (NestJS + Mongoose)

- **Schemas** (`src/schemas/`) are grouped by domain into subfolders: `library/` (folder, file, download), `question-bank/` (topic + question base + 9 per-type detail schemas), `rubric/` (group/rubric/level/criterion), `exercise/` (exercise, exercise-question, attempt, participant, submission, student-question, self-assessment), plus root `user`, `article`, `settings`. `src/schemas/index.ts` is the barrel.
- **`src/database/database.module.ts`** is `@Global` and registers EVERY model with `MongooseModule.forFeature`, so feature modules inject models via `@InjectModel(X.name)` **without** their own `forFeature`. The injection token is the schema **class name**, which is also what `ref:`/`refPath:` strings point to.
- **`src/global/`** (`@Global GlobalModule`) provides `JwtService` (sign/verify/decode, secret from config) and `BcryptService`. **`src/common/`** holds the reusable infra (adapted/copied from the reference API `D:\Edusoft\lms.edusoft.vn\edusoft-lms-api`): `AllExceptionsFilter` (consistent error envelope, Mongo 11000→409), pagination helpers (`getPagination`/`buildPagination`/`convertStringToObjectId`), `PaginationQueryDto`, decorators (`@Roles`/`@Public`/`@CurrentUser`), guards (`JwtAuthGuard` verifies token + sets `req.user`; `RolesGuard` checks `@Roles`).
- **Feature modules** (`src/modules/<name>/`) follow one CRUD pattern (use `users/` as the template): `@Controller` with class-level `@UseGuards(JwtAuthGuard, RolesGuard)`; reads open to any authed user (or `@Public()` for free-access content — library + articles + exercises + settings reads are `@Public`); mutations gated by `@Roles([UserRole.Teacher, UserRole.Admin])`; lists use the pagination helpers; `@CurrentUser('sub')` for the owner id.
- **Questions are polymorphic**: a base `Question` row + a per-type detail row (`SingleChoiceQuestion`, `EssayQuestion`, …) linked via `questionDetail` + `questionModel` (a `refPath`). `QuestionsService.create` writes both.
- **"Kho học liệu" files are external-link-first**: `FileItem.source` defaults to `external` and stores a `url` (a `pre('validate')` hook requires `url` for external / `fileKey` for internal). No file storage is operated.
- Design rationale + ERD: `backend/docs/DATABASE-DESIGN.md`; build plan + reuse map: `backend/docs/BACKEND-PLAN.md`.

### Backend gotchas
- tsconfig is **nodenext + strictNullChecks ON, noImplicitAny OFF**. Do **not** `import { FilterQuery } from 'mongoose'` (use `Record<string, any>` for query objects); import `Model` from `'mongoose'`. Imports are relative (`../../common/...`, `../../enums`) — no path alias for bare specifiers. Guard nullable `findById`/`findOne` results.
- `nest build` does the type-check; ESLint is NOT run during build.

## Frontend architecture (Next.js 16 App Router)

`frontend/AGENTS.md` warns: this Next.js has breaking changes — **read `frontend/node_modules/next/dist/docs/` before writing App-Router/config code**, don't trust training-data conventions.

- It is a **faithful port of an inline-style design prototype** (imported from a claude.ai/design project via the `claude_design` MCP). The design keeps its OWN inline-style system — NOT antd, NOT Tailwind utilities (antd is installed + wired in `app/layout.tsx` but unused by the LMS itself). Original `.jsx` sources are mirrored in `frontend/.design-src/` (git-ignored, reference only).
- Everything lives under `app/` (no `src/`), in flat domain folders: `theme/` (palette/fonts/icons tokens), `components/` (ui primitives, chrome `PublicChrome`/`DashboardChrome`, `LoginModal`, `TweaksPanel`, `ScreenHost`), `contexts/` (ThemeProvider/AuthProvider/LmsProviders), `configs/` (`routes.config.ts`, `nav.config.ts`), `helpers/`, `screens/` (the big screen component modules), `data/db.ts`, `store/store.ts`, `lib/`, `types/`.
- **Real file-based routes with Vietnamese (no-diacritics) slugs** matching the menus: public group `app/(site)/` (`/`, `/kho-hoc-lieu`, `/luyen-tap`, `/tu-danh-gia`, `/bai-viet`, `/cua-toi`), immersive `app/(focus)/` (`/luyen-tap/[id]`), admin `app/quan-tri/...`. Each `page.tsx` is a server component (with `metadata`) that renders `<ScreenHost Screen={X} routeKey="..." ctx={{id}} />`.
- **`ScreenHost`** (`app/components/ScreenHost.tsx`) is the adapter: it pulls theme + auth from context and translates the design's internal `setRoute(key)` / `go(key, patch)` calls into `router.push` via `configs/routes.config.ts` (`routeToHref` + `resolvePath`). The screens were ported to still take `{ p, t, ctx, setRoute, go, auth, ... }` props.
- **Data flow**: screens read a synchronous in-memory `DB` (`app/data/db.ts`) and call `LMS.*` actions (`app/store/store.ts`, a tiny pub/sub with `useLMS()`). Live backend data is layered on via **`app/lib/sync/`**: per-feature `load-*.ts` loaders fetch the API and map responses into the `DB` shape; `hydrate.ts` maps each `routeKey` → which loaders run; `ScreenHost` calls `useLMS()` + `hydrateFor(routeKey)` on mount so screens re-render with live data. Loaders are best-effort and swallow errors → the UI falls back to mock data when the API is down/logged out. Some collections (classes, schedule, overview stats) have no backend and stay mock.
- **API client**: `app/lib/api/` — a typed `fetch` wrapper (JWT in localStorage, `ApiError`, `qs` helper) + per-resource endpoint objects. Base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`). Auth is real: `AuthProvider` logs in/registers against `/auth` and restores the session via `/auth/me`; `LoginModal` submits email/password.

### Frontend gotchas
- tsconfig has **`strict: false`** (pragmatic for the ported prototype); `next.config.ts` sets `eslint.ignoreDuringBuilds`-equivalent is NOT used — instead Next 16 simply doesn't lint on build. Path alias `@/*` → `./*`.
- Files may be reformatted by an editor/linter on save mid-edit; re-Read before Edit if a write fails.
