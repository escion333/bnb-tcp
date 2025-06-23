# Multi-stage build for React/Vite app
# Stage 1: Build the application
FROM node:20-slim AS builder

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy app source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runtime with nginx
FROM nginx:alpine AS runtime

# Copy built app from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 