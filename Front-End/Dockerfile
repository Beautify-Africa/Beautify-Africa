# ==========================================
# STAGE 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Accept API URL as a build argument (Vite needs this at compile-time to wire up the frontend)
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Production Server (Nginx)
# ==========================================
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Steal the compiled React files from the Builder stage and drop them into Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
