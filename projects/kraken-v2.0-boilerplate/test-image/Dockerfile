# Kraken v2.0 Proper - Test Image
# For container TUI verification of real Docker spawn

FROM opencode-python3:latest

# Install docker CLI for container spawning
RUN apk add --no-cache docker-cli docker-cli-compose

# Create plugin directories
RUN mkdir -p /root/.config/opencode/plugins/kraken-agent
RUN mkdir -p /root/.config/opencode/plugins/shark-agent  
RUN mkdir -p /root/.config/opencode/plugins/manta-agent
RUN mkdir -p /root/.config/opencode/plugins/subagent-manager

# Copy bundled plugins
COPY index.js /root/.config/opencode/plugins/kraken-agent/
COPY shark-agent/index.js /root/.config/opencode/plugins/shark-agent/
COPY manta-agent/index.js /root/.config/opencode/plugins/manta-agent/
COPY subagent-manager/dist/index.js /root/.config/opencode/plugins/subagent-manager/
COPY subagent-manager/wrappers /root/.config/opencode/plugins/subagent-manager/wrappers/

# Copy test opencode.json
COPY opencode.json /root/.config/opencode/opencode.json

# Set proper permissions
RUN chmod -R 755 /root/.config/opencode/plugins/

# Verify Python (docker CLI will be mounted at runtime)
RUN python3 --version

CMD ["opencode"]
