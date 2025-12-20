# Build stage with specific node version
FROM node:18.20.8-alpine AS build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Clean install
RUN npm cache clean --force && \
    npm ci --legacy-peer-deps --prefer-offline --no-audit

# Copy all source files
COPY . .

# Build with error handling - MODIFIED
RUN npm run build 2>&1 || (echo "=== BUILD FAILED ===" && \
    echo "Checking for common issues:" && \
    cat package.json | grep "\"build\"" && \
    ls -la && exit 1)

# Verify build output
RUN ls -la /app/dist || ls -la /app/build || (echo "Build output not found!" && exit 1)

# Production stage
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files - handle both dist and build directories
COPY --from=build /app/dist /usr/share/nginx/html 2>/dev/null || \
     COPY --from=build /app/build /usr/share/nginx/html

# Verify copied files
RUN ls -la /usr/share/nginx/html

# Create nginx user if not exists (skip if exists)
RUN addgroup -g 101 -S nginx 2>/dev/null || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx 2>/dev/null || true

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
