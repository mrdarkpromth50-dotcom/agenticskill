FROM node:24-slim

WORKDIR /app

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    netcat-openbsd \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy scripts
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# Copy configuration
COPY config/ /app/config/

# Install global dependencies
RUN npm install -g antigravity-claude-proxy@latest openclaw@latest

EXPOSE 8080 18789 3000

CMD ["/bin/bash"]
