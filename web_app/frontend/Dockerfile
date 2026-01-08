# Stage 1: Build
FROM node:18-slim as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config if needed (optional, default works for simple SPAs usually, 
# but for SPA routing (react-router) we might need a custom config to fallback to index.html.
# This app is single page without router so default is fine.)

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
