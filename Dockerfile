#
# Stage 1: Build TypeScript code.
#
FROM node:18-alpine AS builder

# Install rsync.
RUN apk add --no-cache rsync

# Set working directory.
WORKDIR /smm-bot

# Install dependencies.
COPY package*.json ./
RUN npm ci

# Copy source code.
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript code.
RUN npm run build

#
# Stage 2: Create production image.
#
FROM node:18-alpine

# Set working directory.
WORKDIR /smm-bot

# Copy production dependencies.
COPY --from=builder /smm-bot/package*.json ./
RUN npm ci --production

# Copy built TypeScript code.
COPY --from=builder /smm-bot/dist ./dist
