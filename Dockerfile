FROM node:18-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpx prisma generate

EXPOSE 3000

CMD ["pnpm","start"]