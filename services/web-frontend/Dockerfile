# Build from repo root: docker build -f services/web-frontend/Dockerfile .
FROM node:20-alpine

WORKDIR /app

COPY services/web-frontend/package.json services/web-frontend/package-lock.json ./
RUN npm ci

COPY services/web-frontend/ ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
