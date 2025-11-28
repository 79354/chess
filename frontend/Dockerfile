# -------------------------------
# Stage 1 — Build the Vite project
# -------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached if package.json doesn't change)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm install; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  elif [ -f yarn.lock ]; then yarn install; \
  else npm install; \
  fi

# Copy rest of project
COPY . .

# Build production bundle
RUN npm run build


# ----------------------------------
# Stage 2 — Serve with Nginx (static)
# ----------------------------------
FROM nginx:stable-alpine AS production

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
