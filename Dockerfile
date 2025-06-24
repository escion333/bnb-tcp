# Multi-stage build for React/Vite app
# Stage 1: Build the application
FROM node:20 AS builder

# Install system dependencies needed for node-gyp and native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy app source code
COPY . .

# Declare build-time arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_OPENAI_API_KEY
ARG VITE_BSC_RPC_URL
ARG VITE_PANCAKESWAP_ROUTER
ARG VITE_WBNB_ADDRESS
ARG VITE_USDT_ADDRESS

# Make environment variables available during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_BSC_RPC_URL=$VITE_BSC_RPC_URL
ENV VITE_PANCAKESWAP_ROUTER=$VITE_PANCAKESWAP_ROUTER
ENV VITE_WBNB_ADDRESS=$VITE_WBNB_ADDRESS
ENV VITE_USDT_ADDRESS=$VITE_USDT_ADDRESS

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