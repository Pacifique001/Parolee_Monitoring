# Development stage
FROM node:22-alpine as development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

# Production build stage
FROM node:22-alpine AS build
WORKDIR /app

# build-time tools for native deps (optional)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
# install devDependencies so `tsc` / vite are available
RUN npm ci

COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production
# Vite outputs to /dist by default — copy that to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# optional: custom nginx config if you have it in frontend/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]