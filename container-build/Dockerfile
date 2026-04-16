# Custom OpenCode 1.4.3 Container - Carbon Copy for Plugin Testing
# Using bun runtime instead of node

FROM node:20-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_noninteractive=true

WORKDIR /opt/opencode

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Verify bun
RUN bun --version

# Install opencode-ai@1.4.3 (should use bun internally)
RUN npm install -g opencode-ai@1.4.3

# Verify opencode version
RUN opencode --version

# Create required directory structure
RUN mkdir -p /root/.config/opencode /root/.shark/evidence

# Entry point
ENTRYPOINT ["opencode"]