# Kraken V2.0 Container - For Testing
# Build with: docker build -t kraken-v2-test .
# 
# NOTE: This Dockerfile expects the plugins to be copied at build time:
#   docker build -t kraken-v2-test .
#
# The full container setup with plugins is at:
#   /home/leviathan/OPENCODE_WORKSPACE/.shark/container-kraken-v2/

FROM node:20-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_noninteractive=true

WORKDIR /opt/opencode

# Install bun runtime
RUN curl -fsSL https://bun.sh/install | bash && \
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

ENV PATH="/root/.bun/bin:$PATH"

# Create required directories
RUN mkdir -p /opt/opencode/.config /opt/opencode/workspace /opt/opencode/plugins /opt/opencode/artifacts /opt/opencode/ACTIVE_CONTEXT /tmp/kraken-compaction

# Environment variables for Kraken
ENV KRAKEN_CONTAINER=true
ENV KRAKEN_PLUGIN_DIR=/opt/opencode/plugins/kraken-agent-v2.0
ENV KRAKEN_ALLOWED_PATHS=/opt/opencode,/app,/workspace
ENV KRAKEN_COMPACTION_DIR=/tmp/kraken-compaction

# Copy opencode config
COPY opencode-config.json /opt/opencode/.config/opencode.json

# Entry point
CMD ["/bin/bash"]

# NOTE: To include plugins, create a build context that includes:
#   - container/ (this folder)
#   - plugins/kraken-agent-v2.0/ (from dist/)
#   - plugins/coding-subagents/
#   - plugins/spider-agent/
#
# Or modify to copy from your installed plugins:
#   COPY ~/.config/opencode/plugins/kraken-agent-v2.0 /opt/opencode/plugins/kraken-agent-v2.0
