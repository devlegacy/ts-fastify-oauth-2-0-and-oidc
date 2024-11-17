FROM node:22-alpine AS builder
RUN corepack enable
RUN apk add --no-cache rsync

WORKDIR /opt/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY ./.bin/replace-import-paths ./.bin/replace-import-paths
COPY tsconfig.build.json ./
COPY .swcrc.build ./
COPY src/ ./src

RUN pnpm run build

FROM node:22-alpine AS production
RUN corepack enable

WORKDIR /opt/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --prod

COPY --from=builder /opt/app/dist ./dist
RUN touch .env
CMD ["npm", "start"]

# docker build -t ts-fastify-oauth-2-0-and-oidc -f Dockerfile .
# docker build --no-cache -t ts-fastify-oauth-2-0-and-oidc -f Dockerfile .
# docker run -it -p 3000:3000 --rm ts-fastify-oauth-2-0-and-oidc /bin/sh
# docker run -it -p 3000:3000 --rm ts-fastify-oauth-2-0-and-oidc

# docker build -t [context|bussines]/ts-fastify-oauth-2-0-and-oidc -f Dockerfile .
# docker run -it -p 3000:3000 --rm [context|bussines]/ts-fastify-oauth-2-0-and-oidc /bin/sh
# docker run -it -p 3000:3000 --rm [context|bussines]/ts-fastify-oauth-2-0-and-oidc
# docker run -it -p 8080:8080 --rm ts-fastify-oauth-2-0-and-oidc
