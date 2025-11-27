# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a dual-application monorepo demonstrating OAuth 2.0 and OIDC implementations using Fastify and TypeScript. It contains:

1. **OAuth Client** (port 8080) - Third-party application integrating with multiple OAuth providers (Spotify, Twitter, Twitch, Auth0, Discord, and a local server)
2. **OAuth Server** (port 8081) - Custom OAuth 2.0 authorization server implementation

Both applications can run independently and are structured using Domain-Driven Design (DDD) principles with bounded contexts.

## Development Commands

### Setup
```bash
pnpm install                    # Install dependencies
make create_env_file           # Create environment files
```

### Development
```bash
# Run with hot-reload and debugger
pnpm start:client:debug        # OAuth client on :8080 (with --watch --inspect)
pnpm start:server:debug        # OAuth server on :8081 (with --watch --inspect)
```

### Build
```bash
pnpm build                     # Compile TS→JS, copy templates, fix import paths
pnpm build:clean              # Remove dist/ directory
```

### Production
```bash
pnpm start                     # Runs OAuth client (default)
pnpm start:client             # OAuth client
pnpm start:server             # OAuth server
```

### Testing
```bash
pnpm test                      # Run all tests (unit + features)
pnpm test:unit                 # Node.js native test runner
pnpm test:features            # Cucumber BDD tests
pnpm test:coverage            # Run tests with c8 coverage
```

### Linting
```bash
pnpm lint                      # ESLint check
pnpm lint:fix                 # Auto-fix linting issues
```

### Docker
```bash
docker build -t ts-fastify-oauth-2-0-and-oidc .
docker run -p 8080:8080 ts-fastify-oauth-2-0-and-oidc
```

## Architecture

### Directory Structure

```
src/
├── apps/                                    # Application entry points
│   ├── oauth-client/                       # OAuth client app
│   │   ├── main.ts                         # Process setup, error handling
│   │   ├── server.ts                       # Fastify server config
│   │   ├── controllers/                    # Auto-loaded route handlers
│   │   └── *.ejs                          # View templates
│   └── oauth-server/                       # OAuth server app
│       └── (same structure)
├── Contexts/                               # DDD bounded contexts
│   ├── Shared/                            # Common infrastructure
│   │   ├── domain/                        # Domain logic & errors
│   │   │   ├── oauth.ts                   # OAuth constants
│   │   │   ├── errors/                    # Custom error classes
│   │   │   └── *.ts                       # Domain utilities
│   │   └── infrastructure/                # Infrastructure services
│   │       ├── http/                      # Fastify setup & utilities
│   │       │   ├── fastifyBootstrap.ts    # Central server config
│   │       │   ├── getAccessToken.ts      # Bearer token extraction
│   │       │   └── getBasicCredentials.ts # Basic auth extraction
│   │       ├── accessTokenSigner.ts       # JWT creation (HS256)
│   │       ├── accessTokenVerifier.ts     # JWT validation
│   │       ├── accessTokenAsymmetricSigner.ts    # RSA signing
│   │       ├── accessTokenAsymmetricVerifier.ts  # RSA verification
│   │       ├── accessTokenJwksValidator.ts       # JWKS validation
│   │       ├── codeChallengeGenerator.ts  # PKCE implementation
│   │       ├── Logger/PinoLogger.ts       # Structured logging
│   │       └── Users/getUser.ts           # User auth (demo)
│   ├── OauthClient/Shared/infrastructure/Config/  # Client config
│   └── OauthServer/Shared/infrastructure/Config/  # Server config
tests/
├── Contexts/Shared/domain/                # Unit tests
└── apps/oauth-client/features/           # Cucumber BDD tests
    ├── *.feature                         # Gherkin scenarios
    └── step_definitions/                 # Step implementations
```

### Key Architectural Patterns

**Fastify Auto-loading**: Controllers in `apps/*/controllers/` are automatically loaded as routes. Each controller exports a default async function that receives the Fastify instance.

**Configuration Management**: Uses Convict for schema-based config validation. Each app has its own config file that:
- Loads `.env` files with `dotenv-expand`
- Validates against schema (types: url, ipaddress, port)
- Provides type-safe access via `config.get('key')`

**Error Handling**: Custom domain errors extend base `DomainError` class. The Fastify error handler in `fastifyBootstrap.ts` transforms these into appropriate HTTP responses.

**Path Aliasing**: `#@/*` maps to project root. Build script transforms `#@/src/` → `#@/dist/` in compiled output.

## OAuth Implementation Details

### Supported Grant Types

**OAuth Client supports**:
- **Authorization Code** (Spotify, Local) - Standard server-side flow
- **Authorization Code + PKCE** (Twitter) - For public clients
- **Implicit Flow** (Twitch, Auth0) - SPA callback pattern
- **Password Grant** (Auth0) - Direct credentials exchange
- **Client Credentials** (Discord) - Machine-to-machine

**OAuth Server implements**:
- Authorization Code Grant with in-memory storage

### Authentication Flow Pattern

Most OAuth integrations follow this controller pattern:

1. **Initiate Flow**: `GET /authentication/{provider}` redirects to provider with client_id, redirect_uri, scope, state
2. **Handle Callback**: `GET /authentication/{provider}/callback` receives code, exchanges for token
3. **Store Token**: Sets httpOnly cookie with access_token
4. **Protected Access**: Routes check cookie/Bearer token via middleware

### Token Management

**JWT Structure** (used by local OAuth server):
- **Registered Claims**: `sub` (user ID), `exp` (expiration), `jti` (UUID)
- **Public Claims**: `name` (user full name)
- **Private Claims**: `appId`, `ref`
- **Algorithms**: HS256 (symmetric) or RS256 (asymmetric)

**Token Utilities**:
- `accessTokenSigner.ts` - Create JWTs with HS256
- `accessTokenVerifier.ts` - Verify signature and expiration
- `accessTokenAsymmetricSigner.ts` / `accessTokenAsymmetricVerifier.ts` - RSA-based tokens
- `accessTokenJwksValidator.ts` - JWKS validation for Auth0

### Security Features

- **PKCE Support**: Code challenge/verifier for Twitter flow
- **State Parameter**: CSRF protection across all flows
- **httpOnly Cookies**: XSS protection for token storage
- **Bearer Tokens**: Standard OAuth 2.0 authorization
- **JWT Expiration**: Time-limited access control
- **JWKS Rotation**: Support for Auth0 public key updates

## Configuration

Each application has comprehensive configuration in:
- OAuth Client: `src/Contexts/OauthClient/Shared/infrastructure/Config/config.ts`
- OAuth Server: `src/Contexts/OauthServer/Shared/infrastructure/Config/config.ts`

Configuration includes:
- App metadata (env, url)
- HTTP server settings (host, port)
- JWT settings (secret, expiration)
- Provider credentials (clientId, clientSecret)
- Provider URLs (authorizationUrl, tokenUrl, userInfoUrl)
- Cookie settings for each provider

Environment variables are loaded from `.env` files and validated against Convict schemas.

## Testing

### Unit Tests
- **Framework**: Node.js native test runner
- **Location**: `tests/Contexts/Shared/domain/`
- **Run**: `pnpm test:unit`
- **Pattern**: Uses `node --test` with TypeScript via `@swc-node/register`

### BDD Tests
- **Framework**: Cucumber.js
- **Location**: `tests/apps/oauth-client/features/`
- **Run**: `pnpm test:features`
- **Pattern**: Gherkin `.feature` files with step definitions in `step_definitions/`
- **HTTP Testing**: Uses Supertest against Fastify server

### Adding New Tests

**Unit Test Example**:
```typescript
// tests/Contexts/Shared/domain/myUtil.test.ts
import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('MyUtil', () => {
  it('should do something', () => {
    assert.strictEqual(myUtil(), expectedValue)
  })
})
```

**Feature Test Example**:
```gherkin
# tests/apps/oauth-client/features/myFeature.feature
Feature: My Feature
  Scenario: Test scenario
    When I send a GET request to "/api/endpoint"
    Then the response status code should be 200
```

## Build System

**Compiler**: SWC (not tsc) - configured in `.swcrc.build`

**Build Steps**:
1. Clean `dist/` directory
2. Compile TypeScript to JavaScript with SWC (minified, source maps)
3. Copy EJS templates with rsync
4. Replace import paths (`#@/src/` → `#@/dist/`) with custom script

**Output**: `dist/` directory ready for Node.js execution

**Note**: The build produces optimized, minified JavaScript suitable for production.

## Implementation Details

### Fastify Plugin Registration Order

The `fastifyBootstrap.ts` establishes a specific plugin loading sequence critical for OAuth flows:

1. `@fastify/formbody` - Parses `application/x-www-form-urlencoded` (required for OAuth token endpoints)
2. `@fastify/multipart` - Handles multipart form data
3. `@fastify/static` - Serves static assets for implicit flow client-side handling
4. `@fastify/autoload` - Auto-loads controllers from `{app}/controllers/` with prefix `/api`
   - Uses `matchFilter` to only load files containing 'Controller' in filename
   - Sets `forceESM: true` and `dirNameRoutePrefix: false`
5. `@fastify/cors` - Enables cross-origin requests
6. `@fastify/compress` - Gzip compression
7. `@fastify/cookie` - Cookie parsing/setting (critical for token storage in httpOnly cookies)
8. `@fastify/view` - EJS template rendering with `viewAsync` method

### Security-Aware Error Handling

The error handler in `fastifyBootstrap.ts` implements **security by obscurity for unauthorized errors**:
- `UnauthorizedError` or `TokenError` → Returns HTTP 404 (not 401) in production
- Prevents endpoint enumeration via status code probing
- Dev environments prefix error messages with actual status codes for debugging
- Stack traces only included when `APP_ENV !== 'production'`

### PKCE Implementation (Twitter OAuth)

Twitter flow uses PKCE per RFC 7636 in `codeChallengeGenerator.ts`:
```typescript
// Code Challenge: BASE64URL(SHA256(codeVerifier))
const base64CodeChallenge = createHash('sha256').update(codeVerifier).digest('base64')
const challenge = Buffer.from(base64CodeChallenge, 'base64').toString('base64url')
```
- **Code Verifier**: 128 random bytes, base64-encoded
- Stored in httpOnly cookie `twitter.cookie.oauthCodeVerifier` during authorization
- Retrieved during callback for token exchange with `code_challenge_method: 'S256'`

### CSRF Protection Pattern

All OAuth flows implement state parameter validation:
- Generate: `randomBytes(16).toString('base64')`
- Store in httpOnly cookie during authorization request
- Validate match in callback: `if (state !== req.query.state) reject`
- Applied across Spotify, Twitter, Discord-special, and local OAuth flows

### Token Verification

**JWT Expiration Check** (`accessTokenVerifier.ts`):
```typescript
Date.now() > payload.exp * 1000  // exp is in seconds, not milliseconds
```

**JWKS Rotation** (`accessTokenJwksValidator.ts`):
1. Decode JWT header to extract `kid` (key ID)
2. Fetch public key from JWKS endpoint via `jwks-rsa` client
3. Verify signature using fetched key (supports Auth0 key rotation)

### HTTP Client Pattern

Uses **Undici** (Node.js built-in, same as `fetch`):
- Type-safe: `satisfies RequestInit`
- Headers: `new Headers()` with `.append()` method
- Bearer auth: `Authorization: 'Bearer ${token}'`
- Basic auth: `Authorization: 'Basic ' + btoa('username:password')`

### Cookie Management for OAuth

Named cookies configured per provider in `config.ts`:
```typescript
{
  path: '/',
  httpOnly: true,  // XSS protection - inaccessible to JavaScript
  expires: new Date(Date.now() + expiresIn * 1000)  // Convert seconds to ms
}
```

Provider-specific cookies:
- `spotify.cookie.accessToken`
- `twitter.cookie.accessToken`, `.oauthCodeVerifier`, `.oauthState`
- `discord.cookie.accessToken`, `.oauthState`
- `auth0.cookie.accessToken`

### OAuth Server In-Memory Storage

Uses `oauth2-server` library with in-memory database structure:
```typescript
{
  authorizationCode: { authorizationCode, expiresAt, redirectUri, client, user },
  client: { id, redirectUris, grants, clientSecret },
  token: { accessToken, accessTokenExpiresAt, client, user }
}
```

**Authorization Flow**:
1. GET `/oauth/authorize` → Renders login form
2. POST with credentials → `oauth.authorize()` → Redirect with `?code=...&state=...`
3. POST `/oauth/token` with `grant_type=authorization_code` → Returns access_token

**Code Generation**: SHA1 hash of 256 random bytes

### Testing Infrastructure

**Cucumber Hooks** (`step_definitions/hooks.steps.ts`):
- `BeforeAll`: Start Fastify server via `AppBackend`, create Supertest agent wrapping `application.httpServer`
- `AfterAll`: Stop server gracefully
- Default timeout: 60 seconds
- Environment: `SWCRC=true`, `FASTIFY_AUTOLOAD_TYPESCRIPT=1`

**Unit Tests**: Node.js native test runner with `@swc-node/register/esm-register` for TypeScript support

### Build System Path Transformation

Custom script `.bin/replace-import-paths` post-processes compiled output:
- Replaces `#@/src/` → `#@/dist/` in all `dist/**/*.js` files
- Replaces `./src/apps/` → `./dist/apps/`
- Uses `replace-in-file` library
- Required because SWC doesn't transform path aliases in imports

### Process Error Handling

In `main.ts` entry points:
```typescript
process
  .on('unhandledRejection', (err, origin) => { error & exit(1) })  // Prevents zombie processes
  .on('uncaughtException', (err) => { error })  // Logged but may continue
```

## Common Patterns

### Adding a New OAuth Provider

1. **Add config** to `OauthClient/Shared/infrastructure/Config/config.ts`:
   ```typescript
   newProvider: {
     clientId: { env: 'NEW_PROVIDER_CLIENT_ID', ... },
     clientSecret: { ... },
     authorizationUrl: { ... },
     tokenUrl: { ... },
     // etc.
   }
   ```

2. **Create controllers** in `apps/oauth-client/controllers/`:
   - `authenticationNewProviderGetController.ts` - Initiate flow
   - `authenticationNewProviderCallbackGetController.ts` - Handle callback

3. **Add view** in `apps/oauth-client/` for the home page

4. **Add link** in the main view to trigger the flow

### Adding a New Protected Route

```typescript
// apps/oauth-client/controllers/myProtectedRoute.ts
import { getAccessToken } from '#@/src/Contexts/Shared/infrastructure/http/getAccessToken.js'

export default async (fastify) => {
  fastify.get('/my-route', async (request, reply) => {
    const token = getAccessToken(request)
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    // Use token to access protected resources
  })
}
```

### Error Handling

Throw domain errors that extend `DomainError`:
```typescript
import { UnauthorizedError } from '#@/src/Contexts/Shared/domain/errors/UnauthorizedError.js'

if (!isValid) {
  throw new UnauthorizedError('Invalid credentials', { userId })
}
```

The Fastify error handler will automatically convert these to appropriate HTTP responses.

## Dependencies

**Critical Dependencies**:
- `fastify` (5.6.1) - Web framework
- `oauth2-server` (3.1.1) - OAuth server implementation
- `fast-jwt` (6.0.2) - JWT handling
- `jwks-rsa` (3.2.0) - JWKS validation
- `convict` (6.2.4) - Configuration management
- `pino` (10.1.0) - Logging

**Build Tools**:
- `@swc/cli` + `@swc/core` - TypeScript compilation
- `@swc-node/register` - On-the-fly TS compilation for dev/test

**Testing**:
- `@cucumber/cucumber` (12.2.0) - BDD testing
- `supertest` (7.1.4) - HTTP testing
- `c8` (10.1.3) - Coverage

## Environment Requirements

- **Node.js**: >= 22
- **npm**: >= 10
- **pnpm**: >= 9 (required - enforced by `engineStrict`)
- **ES Modules**: Project uses `"type": "module"` in package.json

## Git Workflow

- **Commit Format**: Conventional commits enforced via commitlint
- **Commit Types**: Standard types plus custom `wip` type for work in progress
- **Emojis**: Enabled via `cz-git` (useEmoji: true in commitlint.config.cjs)
- **Pre-commit**: Husky runs lint-staged (linting) before commits
- **Commit Msg Hook**: Validates commits with commitlint, returns 404-style errors
- **Interactive Commits**: Run `pnpm cz` for guided conventional commit prompts
- **VS Code Integration**: Copilot commit generation configured in `.vscode/settings.json`

For detailed commit standards and security requirements, see `.github/copilot-instructions.md`.

## Additional Resources

### Configuration Files

- **Commitizen**: `.czrc` - Points to `cz-git` adapter
- **Commitlint**: `commitlint.config.cjs` - Extends `@commitlint/config-conventional`, adds `wip` type, enables emojis
- **VS Code Settings**: `.vscode/settings.json` - Copilot commit generation instructions, ESLint config
- **Copilot Instructions**: `.github/copilot-instructions.md` - Comprehensive AI coding assistant guidelines including OWASP Top 10 security checks

### Key Files Reference

- **Fastify Bootstrap**: `src/Contexts/Shared/infrastructure/http/fastifyBootstrap.ts` - Central server configuration, plugin registration, error handling
- **JWT Signing**: `src/Contexts/Shared/infrastructure/accessTokenSigner.ts` (HS256), `accessTokenAsymmetricSigner.ts` (RS256)
- **JWT Verification**: `src/Contexts/Shared/infrastructure/accessTokenVerifier.ts`, `accessTokenJwksValidator.ts` (JWKS)
- **PKCE**: `src/Contexts/Shared/infrastructure/codeChallengeGenerator.ts`
- **Token Extraction**: `src/Contexts/Shared/infrastructure/http/getAccessToken.ts` (Bearer), `getBasicCredentials.ts` (Basic Auth)
- **OAuth Client Config**: `src/Contexts/OauthClient/Shared/infrastructure/Config/config.ts`
- **OAuth Server Config**: `src/Contexts/OauthServer/Shared/infrastructure/Config/config.ts`

### Development Workflow

1. **Setup**: `pnpm install && make create_env_file`
2. **Development**: `pnpm start:client:debug` (port 8080) or `pnpm start:server:debug` (port 8081)
3. **Testing**: `pnpm test` (runs both unit and feature tests)
4. **Linting**: `pnpm lint:fix` (auto-fix issues)
5. **Committing**: `pnpm cz` (interactive conventional commits with emojis)
6. **Building**: `pnpm build` (SWC compilation + template copy + path replacement)
7. **Production**: `pnpm start` or `pnpm start:client` / `pnpm start:server`
