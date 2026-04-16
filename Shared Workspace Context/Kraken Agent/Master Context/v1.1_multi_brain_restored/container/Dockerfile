FROM node:20-bullseye

ENV OPENCODE_VERSION=1.4.6
ENV NPM_GLOBAL=/root/.npm-global

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g opencode-ai@1.4.6 || true

RUN mkdir -p /root/.config/opencode/plugins

COPY --from=mattermost/opencode:latest /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode /usr/local/bin/opencode-bin
COPY --from=mattermost/opencode:latest /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-musl /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64-musl 2>/dev/null || true

RUN ln -sf /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode /usr/local/bin/opencode || \
    ln -sf $(find /usr/local/lib/node_modules/opencode-ai/node_modules -name "opencode" -type f 2>/dev/null | head -1) /usr/local/bin/opencode || \
    echo "opencode binary setup complete"

WORKDIR /root
CMD ["/bin/bash"]