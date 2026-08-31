FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY scripts ./scripts

RUN mkdir -p /app/uploads

ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/server.js"]
