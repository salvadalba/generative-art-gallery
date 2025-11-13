# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Add security headers
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Security headers \
    add_header X-Frame-Options DENY; \
    add_header X-Content-Type-Options nosniff; \
    add_header X-XSS-Protection "1; mode=block"; \
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always; \
    add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdnjs.cloudflare.com; connect-src \'self\' http://localhost:8000 https://*.infura.io; img-src \'self\' data: https:; style-src \'self\' \'unsafe-inline\'; font-src \'self\' data:"; \
    \
    # Gzip compression \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # API proxy \
    location /api/ { \
        proxy_pass http://gan-service:8000/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]