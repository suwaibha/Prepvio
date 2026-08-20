# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build the Vite/React app
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests and install ALL deps (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Build arguments for environment variables at build time
ARG VITE_MAIN_API_URL=https://prepvio-main-backend-c9h5hpaxbecmcua7.southindia-01.azurewebsites.net/api
ENV VITE_MAIN_API_URL=$VITE_MAIN_API_URL

ARG VITE_CONTENT_API_URL=https://prepvio-admin-backend-fff0g6hwctdyhedp.southindia-01.azurewebsites.net/api
ENV VITE_CONTENT_API_URL=$VITE_CONTENT_API_URL

ARG VITE_MAIN_BACKEND_URL=https://prepvio-main-backend-c9h5hpaxbecmcua7.southindia-01.azurewebsites.net
ENV VITE_MAIN_BACKEND_URL=$VITE_MAIN_BACKEND_URL

ARG VITE_CONTENT_BACKEND_URL=https://prepvio-admin-backend-fff0g6hwctdyhedp.southindia-01.azurewebsites.net
ENV VITE_CONTENT_BACKEND_URL=$VITE_CONTENT_BACKEND_URL

ARG VITE_SOCKET_URL=https://prepvio-main-backend-c9h5hpaxbecmcua7.southindia-01.azurewebsites.net
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

ARG VITE_RAZORPAY_KEY_ID=rzp_test_StfkcaSa1klBVr
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Build the production bundle
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing (React Router support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
