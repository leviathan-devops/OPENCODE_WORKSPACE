# OpenCode with Python3 Enabled
# Built on top of official OpenCode image (Alpine Linux) with Python 3 pre-installed
# This image is used for Kraken v2.0 agent execution which requires Python for Docker container spawning
#
# Base image: ghcr.io/anomalyco/opencode:latest (Alpine Linux)
# Added: python3, py3-pip

FROM ghcr.io/anomalyco/opencode:latest

# Install Python3 and pip using Alpine package manager
# This enables Kraken v2.0 to spawn Docker containers using Python wrappers
RUN apk add --no-cache \
        python3 \
        py3-pip \
        python3-dev \
        build-base

# Verify Python installation
RUN python3 --version

# Set Python to use unoptimized mode for faster startup (useful for container spawning)
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Metadata labels
LABEL maintainer="Kraken Brain Team"
LABEL description="OpenCode with Python3 enabled for agent container spawning"
LABEL version="1.4.3-python3"
LABEL kraken.architecture="python3-enabled"

# Default command - pass through to original entrypoint
CMD ["opencode"]
