# Mattermost-OpenCode-Manta Bridge Service
# Docker container for Mattermost bot that spawns OpenCode/Manta agents

FROM node:20-alpine

WORKDIR /app

# Install dependencies for Docker-in-Docker support (optional)
# RUN apk add --no-cache docker bash curl

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Copy built TypeScript files
COPY dist/ ./dist/
COPY config/ ./config/

# Create workspace directory for per-channel workspaces
RUN mkdir -p /workspace/channels

# Environment variables for configuration
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the bridge service
CMD ["node", "dist/main.js"]
