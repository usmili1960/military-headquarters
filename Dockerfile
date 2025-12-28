# Multi-stage build for Military Headquarters Application

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install security updates
RUN apk update && apk add --no-cache curl && rm -rf /var/cache/apk/*

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY package*.json ./
COPY server ./server
COPY src ./src
COPY .env.example ./.env

# Create users.json directory if it doesn't exist
RUN mkdir -p /app/server && touch /app/server/users.json

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run application
CMD ["npm", "start"]
