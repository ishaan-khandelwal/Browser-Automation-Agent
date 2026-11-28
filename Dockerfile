# The web interface, built for production.
#
#   docker build -t browseai-frontend \
#     --build-arg BACKEND_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_BACKEND_WS_URL=wss://api.example.com .
#   docker run -p 3000:3000 browseai-frontend
#
# Both URLs are build arguments, not runtime settings. The build writes
# BACKEND_URL into its routing table and NEXT_PUBLIC_BACKEND_WS_URL into the
# code the browser runs, so pointing the image at another backend means building
# it again. BACKEND_URL is called from this container; the WebSocket URL is
# opened by the visitor's browser, so it has to be an address the browser can
# reach, and wss:// on an HTTPS site.

# ------------------------------------------------------------------ deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ----------------------------------------------------------------- build
FROM node:22-alpine AS build
WORKDIR /app
ARG BACKEND_URL=http://127.0.0.1:8000
ARG NEXT_PUBLIC_BACKEND_WS_URL=ws://localhost:8000
ENV BACKEND_URL=$BACKEND_URL \
    NEXT_PUBLIC_BACKEND_WS_URL=$NEXT_PUBLIC_BACKEND_WS_URL \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------- runner
# Only the standalone server, the static assets and public/. No node_modules
# beyond what the server traced, and no source.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# The node image comes with an unprivileged `node` user.
USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
