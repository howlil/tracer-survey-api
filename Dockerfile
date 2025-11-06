FROM node:18-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

COPY prisma ./prisma

RUN pnpm install

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

COPY . .

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]