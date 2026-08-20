# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

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

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
