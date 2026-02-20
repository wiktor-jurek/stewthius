# ── Web base: slim Node image, no extra tooling ──
FROM node:20-bookworm-slim AS web-base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

# ── Task base: adds ffmpeg, python3, yt-dlp for video processing ──
FROM web-base AS task-base
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl python3 \
  && curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# ── Install all dependencies ──
FROM web-base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build Next.js ──
FROM web-base AS builder
ARG DATABASE_URL
ARG DATABASE_SSL=false
ENV DATABASE_URL=${DATABASE_URL}
ENV DATABASE_SSL=${DATABASE_SSL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npm run build

# ── Web runner: standalone Next.js server ──
FROM web-base AS web-runner
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

# ── Task runner: full source + toolchain for pipeline scripts ──
FROM task-base AS task-runner
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data/videos

CMD ["tail", "-f", "/dev/null"]
