# syntax=docker/dockerfile:1
# Một image duy nhất gộp backend (NestJS) + frontend (Next.js standalone).
# Build context = thư mục gốc repo (có cả backend/ và frontend/).

# ===== Backend: build (cần dev deps để nest build) =====
FROM node:24-alpine AS backend-build
RUN corepack enable
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-be,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY backend/ ./
RUN pnpm build

# ===== Backend: prod deps only =====
FROM node:24-alpine AS backend-deps
RUN corepack enable
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-be,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ===== Frontend: build (Next standalone) =====
FROM node:24-alpine AS frontend-build
RUN corepack enable
WORKDIR /app/frontend
# NEXT_PUBLIC_* được NHÚNG lúc build. Mặc định /api = gọi same-origin, Next
# proxy sang backend nội bộ (xem next.config.ts rewrites).
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_GOOGLE_API_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_GOOGLE_API_KEY=$NEXT_PUBLIC_GOOGLE_API_KEY \
    NEXT_TELEMETRY_DISABLED=1
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-fe,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# ===== Runtime =====
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 app

# Backend: dist đã build + prod node_modules + package.json
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/package.json

# Frontend: bundle standalone + static + public
COPY --from=frontend-build /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-build /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-build /app/frontend/public ./frontend/public

# Launcher chạy cả 2 tiến trình
COPY start.js ./start.js

RUN chown -R app:app /app
USER app

# Chỉ expose cổng FRONTEND (public). Backend 3001 chỉ nội bộ trong container.
EXPOSE 3000

CMD ["node", "start.js"]
