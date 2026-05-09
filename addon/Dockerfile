FROM node:26-alpine
RUN apk upgrade --no-cache && npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY tsconfig.json server.ts ./
COPY src/ ./src/
COPY run.sh /run.sh
RUN chmod +x /run.sh
