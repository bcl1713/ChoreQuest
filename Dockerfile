# ChoreQuest Production Dockerfile
# Multi-stage build for optimized production deployment

# ============================================================================
# Stage 1: Dependencies (Build-time dependencies)
# ============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --only=production --frozen-lockfile

# ============================================================================
# Stage 2: Builder (Build the application)
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies for build
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
ENV NODE_ENV=production
RUN npm run build

# ============================================================================
# Stage 3: Runner (Production runtime)
# ============================================================================
FROM node:20-alpine AS runner

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files for database operations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib/generated ./lib/generated

# Copy package.json for scripts
COPY --from=builder /app/package*.json ./

# Create entrypoint script for database initialization
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Set entrypoint to initialization script
ENTRYPOINT ["./entrypoint.sh"]

# Default command to start the application
CMD ["node", "server.js"]