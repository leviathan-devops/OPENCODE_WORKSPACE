# Shark Agent v4.8.3 — Custom Container
FROM leviathan/opencode:python3-enabled-1.4.3

# Set environment
ENV CONTAINER=true
ENV SHARK_WORKSPACE=/root/workspace

# Copy shark agent plugin from build context
COPY shark-agent-v4.8.3 /root/.config/opencode/plugins/shark-agent-v4.8.3

# Copy opencode config with shark registered
COPY opencode.json /root/.config/opencode/opencode.json

# Create workspace directory
RUN mkdir -p /root/workspace

WORKDIR /root/workspace

# Default command - keep container running
CMD ["sleep", "3600"]