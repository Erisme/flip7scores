## Étape 1 — Build React
FROM node:20-alpine AS build-front
WORKDIR /app
COPY package*.json ./
RUN NODE_ENV=development npm install
COPY . .
RUN npm run build

## Étape 2 — Image finale : nginx + API Node.js dans le même container
FROM node:20-alpine
RUN apk add --no-cache nginx

# ── API ──────────────────────────────────────────────────────────────────────
WORKDIR /app/api
COPY server/package*.json ./
RUN npm install --production --silent
COPY server/index.js .
RUN mkdir -p data

# ── Front ────────────────────────────────────────────────────────────────────
COPY --from=build-front /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf

# ── Démarrage ─────────────────────────────────────────────────────────────────
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
