<h1 align="center">OAuth 2.0 &amp; OIDC — Fastify + TypeScript</h1>

<p align="center">
  Full-stack demonstration of OAuth 2.0 and OpenID Connect flows using <strong>Fastify</strong> and <strong>TypeScript</strong>.<br/>
  Includes a custom OAuth 2.0 authorization server and a multi-provider OAuth client.
</p>

<p align="center">
  <a href="https://github.com/devlegacy/ts-fastify-oauth-2-0-and-oidc/actions/workflows/nodejs.yml" target="_blank"><img src="https://github.com/devlegacy/ts-fastify-oauth-2-0-and-oidc/actions/workflows/nodejs.yml/badge.svg?branch=master" alt="Node.js CI"/></a>
  <a href="https://nodejs.org/docs/latest-v22.x/api/index.html" target="_blank"><img src="https://img.shields.io/badge/node-22.x-5FA04E.svg?logo=node.js&labelColor=282e33" alt="node"/></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/typescript-5.x-3178C6.svg?logo=typescript&labelColor=282e33" alt="typescript"/></a>
  <a href="https://pnpm.io" target="_blank"><img src="https://img.shields.io/badge/pnpm-9.x-gray?logo=pnpm&logoColor=fff&labelColor=F69220" alt="pnpm"/></a>
  <a href="https://fastify.dev/" target="_blank"><img src="https://img.shields.io/badge/fastify-5.x-000000?style=flat&logo=fastify&logoColor=white" alt="fastify"/></a>
  <a href="https://swc.rs/" target="_blank"><img src="https://img.shields.io/badge/swc-compiler-F8C457.svg?logo=swc&label=&labelColor=282e33" alt="swc"/></a>
  <a href="https://cz-git.qbb.sh/cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?logo=github&labelColor=282e33" alt="commitizen friendly"/></a>
  <a href="https://x.com/intent/follow?screen_name=jstsamuel_" target="_blank"><img src="https://img.shields.io/twitter/url?url=https://x.com/jstsamuel_&style=social&label=follow" alt="follow on X"/></a>
</p>

---

## Live Demo

| App | URL |
|-----|-----|
| OAuth Client (port 8080) | [oauth-2-0-and-oidc-client.jstsamuel.dev](https://oauth-2-0-and-oidc-client.jstsamuel.dev) |
| OAuth Server (port 8081) | [oauth-2-0-and-oidc-server.jstsamuel.dev](https://oauth-2-0-and-oidc-server.jstsamuel.dev) |

Both apps are deployed on [Render](https://render.com).

---

## Overview

This monorepo contains two independent Fastify applications that together demonstrate real-world OAuth 2.0 and OIDC patterns:

- **OAuth Client** — integrates with multiple external providers (Spotify, Twitter/X, Twitch, Auth0, Discord) and with the local OAuth Server, implementing every major grant type.
- **OAuth Server** — a custom OAuth 2.0 authorization server with Authorization Code flow, JWT issuance (HS256 / RS256), and JWKS support.

Both apps follow **Domain-Driven Design (DDD)** with bounded contexts and are structured for clarity and extensibility.

---

## OAuth 2.0 Flows Implemented

| Grant Type | Provider(s) | Notes |
|---|---|---|
| Authorization Code | Spotify, Google, Microsoft, Xbox, Discord (special), Local Server | Standard server-side flow |
| Authorization Code + PKCE | Twitter/X | RFC 7636, S256 challenge method |
| Implicit Flow | Twitch, Auth0 | SPA callback pattern |
| Client Credentials | Discord | Machine-to-machine |
| Resource Owner Password | Auth0 | Direct credentials exchange |
| OpenID 2.0 | Steam | Non-OAuth; uses Steam OpenID + Web API key |

---

## Providers

| Provider | Flow | Dashboard |
|---|---|---|
| Spotify | Authorization Code | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications) |
| Twitter / X | Authorization Code + PKCE | [Twitter/X Developer Dashboard](https://console.x.com/) |
| Twitch | Implicit | [Twitch Developer Dashboard](https://dev.twitch.tv/console/apps) |
| Auth0 | Implicit, Password Grant, JWKS validation | [Auth0 Dashboard](https://manage.auth0.com/dashboard) |
| Discord | Client Credentials |
| Discord (special) | Authorization Code (user scopes: identify, guilds, dm_channels.read) |
| Google | Authorization Code (OIDC) |
| Microsoft | Authorization Code (OIDC, tenant-aware) |
| Xbox | Authorization Code → Xbox Live XBL/XSTS token exchange |
| Steam | OpenID 2.0 + Steam Web API |
| Local Server | Authorization Code (custom server) |

---

## Key Features

- **Authorization Code + PKCE** (RFC 7636) — SHA-256 code challenge, base64url-encoded
- **CSRF protection** — `state` parameter validated on every callback
- **httpOnly cookies** — XSS-safe token storage
- **JWT (HS256 & RS256)** — symmetric and asymmetric signing/verification
- **JWKS validation** — public key rotation support via `jwks-rsa` (Auth0)
- **Structured logging** — Pino with log levels per environment
- **Security-aware error handling** — `UnauthorizedError` returns HTTP 404 in production to prevent endpoint enumeration
- **Convict config** — schema-validated, type-safe environment configuration
- **BDD + Unit tests** — Cucumber.js feature tests and Node.js native test runner

---

## Architecture

```
src/
├── apps/
│   ├── oauth-client/          # OAuth client (port 8080)
│   │   ├── controllers/       # Auto-loaded Fastify route handlers
│   │   └── *.ejs              # EJS view templates
│   └── oauth-server/          # OAuth server (port 8081)
│       └── controllers/
├── Contexts/
│   ├── Shared/
│   │   ├── domain/            # Domain errors, OAuth constants
│   │   └── infrastructure/
│   │       ├── http/          # Fastify bootstrap, token extraction
│   │       ├── accessTokenSigner.ts          # JWT HS256
│   │       ├── accessTokenAsymmetricSigner.ts # JWT RS256
│   │       ├── accessTokenJwksValidator.ts   # JWKS / Auth0
│   │       └── codeChallengeGenerator.ts     # PKCE
│   ├── OauthClient/Shared/infrastructure/Config/
│   └── OauthServer/Shared/infrastructure/Config/
tests/
├── Contexts/Shared/domain/    # Unit tests (Node.js test runner)
└── apps/oauth-client/features/ # Cucumber BDD tests
```

Controllers are auto-loaded by `@fastify/autoload` — adding a new provider requires only a config entry and two controller files.

---

## Quick Start

### Prerequisites

- Node.js >= 22
- pnpm >= 9

### Setup

```bash
pnpm install
make create_env_file   # copies .env.example → .env for each app
```

### Development

```bash
pnpm start:client:debug   # OAuth client on :8080 (hot-reload + inspector)
pnpm start:server:debug   # OAuth server on :8081 (hot-reload + inspector)
```

### Testing

```bash
pnpm test              # unit + BDD feature tests
pnpm test:unit         # Node.js native test runner
pnpm test:features     # Cucumber BDD
pnpm test:coverage     # c8 coverage report
```

### Build

```bash
pnpm build             # SWC compile → dist/, copy templates, fix import paths
pnpm build:clean       # remove dist/
```

### Lint

```bash
pnpm lint              # ESLint check
pnpm lint:fix          # auto-fix
```

### Docker

```bash
docker build -t ts-fastify-oauth-2-0-and-oidc .
docker run -p 8080:8080 ts-fastify-oauth-2-0-and-oidc
```

---

## Token Types

| Token | Audience | Purpose |
|---|---|---|
| Access Token | Resource Server | Grants access to protected endpoints |
| Refresh Token | Authorization Server | Obtains new access token without re-auth |
| ID Token (OIDC) | Client App | Carries user identity claims (always JWT) |

---

## Security Notes

- Never expose `client_secret` on the frontend — it belongs server-side only.
- Store tokens in `httpOnly` cookies, not `localStorage`.
- Use short-lived access tokens with refresh token rotation.
- Validate the `state` parameter on every OAuth callback to prevent CSRF.
- PKCE is required for native/SPA clients that cannot store secrets securely.
- Avoid storing sensitive data in JWT payloads — they are base64-encoded, not encrypted.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 (ESM) |
| Language | TypeScript 5 |
| Framework | Fastify 5 |
| Compiler | SWC |
| Package manager | pnpm 9 |
| JWT | fast-jwt |
| JWKS | jwks-rsa |
| HTTP client | Undici (native fetch) |
| Config | Convict |
| Logging | Pino |
| OAuth Server | oauth2-server |
| Unit tests | Node.js native test runner |
| BDD tests | Cucumber.js + Supertest |
| Coverage | c8 |

---

## Contributing

Conventional commits are enforced via `commitlint`. Use `pnpm cz` for guided, emoji-enabled commit prompts.

---

## License

See [LICENSE](LICENSE) for details.
