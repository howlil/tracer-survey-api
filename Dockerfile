FROM node:18-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["pnpm","start"]