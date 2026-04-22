# ---- Build stage ----
    FROM node:18 AS builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    
    RUN npm run build
    
    
    # ---- Production stage ----
    FROM node:18-alpine
    
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci --omit=dev
    
    COPY --from=builder /app/dist ./dist
    
    ENV NODE_ENV=production
    
    EXPOSE 3000
    
    CMD ["node", "dist/index.js"]