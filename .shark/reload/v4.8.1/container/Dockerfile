# Shark Agent v4.8.1 Container - Carbon Copy of Local Device
# This container replicates the exact ship target environment for testing

FROM node:20-bullseye

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_noninteractive=true

# Set up workspace
WORKDIR /opt/opencode

# Install bun runtime
RUN curl -fsSL https://bun.sh/install | bash && \
    export PATH="$HOME/.bun/bin:$PATH" && \
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

ENV PATH="/root/.bun/bin:$PATH"

# Copy opencode config (carbon copy of local device)
COPY opencode-config.json /opt/opencode/.config/opencode.json

# Create required directories
RUN mkdir -p /opt/opencode/.config /opt/opencode/workspace /opt/opencode/plugins /opt/opencode/artifacts /opt/opencode/.shark

# Set up environment variables for container-native testing
ENV SHARK_CONTAINER=true
ENV SHARK_PLUGIN_DIR=/opt/opencode/plugins/shark-agent
ENV SHARK_ALLOWED_PATHS=/opt/opencode,/app,/workspace
ENV SHARK_FORBIDDEN_PATTERNS="/home/,/Users/,/mnt/,C:\\"

# Install OpenCode globally
RUN npm install -g opencode@latest 2>/dev/null || true

# Install shark-agent-v4.8.1 (pre-built + source for testing)
COPY shark-agent-v481/src /opt/opencode/plugins/shark-agent/src
COPY shark-agent-v481/dist /opt/opencode/plugins/shark-agent/dist
COPY shark-agent-v481/package.json /opt/opencode/plugins/shark-agent/package.json

# Install other plugins
COPY plugins/coding-subagents /opt/opencode/plugins/coding-subagents
COPY plugins/spider-agent /opt/opencode/plugins/spider-agent

# Create .shark directories for evidence
RUN mkdir -p /opt/opencode/.shark/evidence/delivery /opt/opencode/.shark/evidence/test-results

# Entry point - drops into a shell with full opencode environment
CMD ["/bin/bash"]