# Kraken v2.0 - Exact Runtime Clone
# Exactly matches kraken-v2-working:1.4.3 environment

FROM debian:bookworm-slim

# Set environment
ENV HOME=/opt/opencode
ENV PATH=/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV NODE_PATH=/usr/local/lib/node_modules

WORKDIR /opt/opencode

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash

# Install opencode globally
RUN npm install -g opencode-ai@latest

# Create directories  
RUN mkdir -p /opt/opencode/.config/opencode
RUN mkdir -p /opt/opencode/plugins

# Copy config
COPY opencode-config.json /opt/opencode/.config/opencode/opencode.json

# Copy plugins (with their node_modules - EXACT copy from working image)
COPY kraken-agent/dist /opt/opencode/plugins/kraken-agent/dist
COPY subagent-manager /opt/opencode/plugins/subagent-manager

# Set permissions
RUN chmod -R 755 /opt/opencode/plugins/

# Verify
RUN opencode --version
RUN ls -laR /opt/opencode/plugins/

CMD ["/bin/bash"]