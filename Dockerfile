# ─── Production Dockerfile for Lunaa (Next.js + Custom WS Server) ───
FROM node:20-alpine AS base

# Cài đặt thư viện hệ thống cần thiết (nếu có)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Dependencies Stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vô hiệu hoá telemetry trong quá trình build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 3. Runner Stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Tạo user bảo mật không quyền root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy các file cần thiết để chạy server.mjs và next.js
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
