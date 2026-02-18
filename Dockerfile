# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS builder
WORKDIR /app/web
ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH=/app/web/node_modules/.bin:$PATH

COPY web/ ./
RUN test -x node_modules/.bin/next
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd -r app && useradd -r -g app app

COPY --from=builder --chown=app:app /app/web/.next/standalone ./
COPY --from=builder --chown=app:app /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=app:app /app/web/public ./web/public

RUN chown -R app:app /app/web/.next /app/web/public
USER app

EXPOSE 3000
CMD ["node", "server.js"]
