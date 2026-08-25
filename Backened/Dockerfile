# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Install production dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# Install build tools + canvas native dependencies for Debian
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only manifests first for better layer caching
COPY package.json package-lock.json ./

# Install only production deps (no devDependencies)
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

# Install dumb-init for proper signal handling + canvas runtime libs for Debian
RUN apt-get update && apt-get install -y \
    dumb-init \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set production environment for correct cookie/CORS behavior
ENV NODE_ENV=production

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source (exclude files via .dockerignore)
COPY . .

# Create a non-root user for security
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/bash -m prepvio
USER prepvio

EXPOSE 5000

# Use dumb-init to handle PID 1 signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
