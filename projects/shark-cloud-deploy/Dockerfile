# Shark Cloud - Railway Deployment
FROM ghcr.io/anomalyco/opencode:latest

USER root

RUN apk add --no-cache bash curl util-linux nodejs npm

RUN mkdir -p /app/bot-bridge

COPY bot-bridge/package*.json /app/bot-bridge/

WORKDIR /app/bot-bridge
RUN npm install --production

COPY bot-bridge/index.js /app/bot-bridge/

RUN mkdir -p /workspace

ENV NODE_ENV=production
ENV SHARK_WORKSPACE=/workspace
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["node", "/app/bot-bridge/index.js"]