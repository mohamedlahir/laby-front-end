# Multi-stage Dockerfile for React (Create React App) front-end

# 1) Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Allow passing API base at build time; default to localhost:8080
ARG REACT_APP_API_BASE="/api"
ENV REACT_APP_API_BASE=${REACT_APP_API_BASE}

# Install dependencies
COPY package*.json ./
# Use npm ci when possible (faster, reproducible). Fall back to npm install if no lockfile.
# Use quiet flags to reduce output during Docker builds.
RUN npm ci --silent --no-audit --progress=false || npm install --silent --no-audit --progress=false

# Copy sources and build
COPY . ./
RUN npm run build

# 2) Production stage: nginx serves the static files
FROM nginx:stable-alpine AS production

# Copy build artifacts
COPY --from=build /app/build /usr/share/nginx/html

# Custom nginx config (fallback to index.html for SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
