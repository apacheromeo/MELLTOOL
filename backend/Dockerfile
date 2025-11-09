# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL 3 libraries and other system dependencies for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files from backend directory (build context is root)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies without running postinstall scripts
# This prevents Prisma from downloading engines during npm ci
RUN npm ci --ignore-scripts

# Generate Prisma Client explicitly after dependencies are installed
# This gives us better control and error handling
RUN npx prisma generate

# Copy source code from backend directory
COPY backend/ .

# Build application (Prisma Client already generated above)
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies including OpenSSL 3 libraries for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Copy package files and prisma schema from backend directory
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install production dependencies without postinstall scripts
RUN npm ci --only=production --ignore-scripts

# Generate Prisma client explicitly
RUN npx prisma generate

# Clean npm cache to reduce image size
RUN npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create directories for uploads and logs
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "run", "start:prod"]


