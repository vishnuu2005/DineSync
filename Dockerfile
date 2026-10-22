# Multi-stage Dockerfile for DineSync Platform
# Stage 1: Build Frontend SPA
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install production backend dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy backend application source
COPY server/ /app/server/

# Copy compiled frontend from Stage 1 into client/dist
COPY --from=client-builder /app/client/dist /app/client/dist

WORKDIR /app

# Expose HTTP & WebSocket port
EXPOSE 5000

# Start unified server
CMD ["node", "server/server.js"]
