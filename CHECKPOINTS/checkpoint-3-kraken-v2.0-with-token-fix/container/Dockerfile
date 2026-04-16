# Kraken V2.0 Container - Carbon Copy for Testing
# Tests the complete Kraken V2.0 multi-brain orchestrator

FROM node:20-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_noninteractive=true

WORKDIR /opt/opencode

# Install bun runtime
RUN curl -fsSL https://bun.sh/install | bash && \
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

ENV PATH="/root/.bun/bin:$PATH"

# Create required directories
RUN mkdir -p /opt/opencode/.config /opt/opencode/workspace /opt/opencode/plugins /opt/opencode/artifacts

# Copy opencode config
COPY opencode-config.json /opt/opencode/.config/opencode.json

# Environment variables for Kraken
ENV KRAKEN_CONTAINER=true
ENV KRAKEN_PLUGIN_DIR=/opt/opencode/plugins/kraken-agent-v2.0
ENV KRAKEN_ALLOWED_PATHS=/opt/opencode,/app,/workspace
ENV KRAKEN_COMPACTION_DIR=/tmp/kraken-compaction
ENV KRAKEN_LAUNCHPAD=/opt/opencode/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md

# Copy Kraken V2.0 plugin
COPY ../dist /opt/opencode/plugins/kraken-agent-v2.0/dist

# Create workspace directories
RUN mkdir -p /opt/opencode/workspace /opt/opencode/ACTIVE_CONTEXT /tmp/kraken-compaction

# Create evidence directories
RUN mkdir -p /opt/opencode/artifacts /opt/opencode/.shark/evidence

# Entry point
CMD ["/bin/bash"]
