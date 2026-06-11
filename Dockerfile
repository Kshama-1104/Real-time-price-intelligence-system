FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY config ./config
COPY public ./public
COPY --from=client-builder /app/client/dist ./client/dist

RUN mkdir -p logs events partitions checkpoints offsets

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (response) => { process.exit(response.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" != \"false\" ]; then node src/database/migrations/run.js; fi && node src/server.js"]
