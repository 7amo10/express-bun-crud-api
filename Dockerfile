FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --production

COPY . .

EXPOSE 3020

CMD ["bun", "src/index.js"]
