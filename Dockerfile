FROM node:22-alpine AS builder
RUN corepack enable
# RUN corepack prepare pnpm@latest --activate

WORKDIR /opt/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

# COPY tsconfig*.json ./
COPY tsconfig.build.json ./
COPY .swcrc ./
COPY src/ ./src

RUN pnpm run build

FROM node:22-alpine AS production
RUN corepack enable
# RUN corepack prepare pnpm@latest --activate

WORKDIR /opt/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --prod

COPY --from=builder /opt/app/dist ./dist
RUN touch .env
CMD ["npm", "start"]

# docker build -t ts-fastify-template -f Dockerfile .
# docker build --no-cache -t ts-fastify-template -f Dockerfile .
# docker run -it -p 3000:3000 --rm ts-fastify-template /bin/sh
# docker run -it -p 3000:3000 --rm ts-fastify-template

# docker build -t [context|bussines]/ts-fastify-template -f Dockerfile .
# docker run -it -p 3000:3000 --rm [context|bussines]/ts-fastify-template /bin/sh
# docker run -it -p 3000:3000 --rm [context|bussines]/ts-fastify-template
