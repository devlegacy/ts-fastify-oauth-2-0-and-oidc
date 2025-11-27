# Copilot Instructions for OAuth 2.0/OIDC Project

## Project Context

This is a TypeScript-based OAuth 2.0 and OpenID Connect implementation using Fastify, structured as a monorepo with Domain-Driven Design principles. The project includes both an OAuth client and server running on ports 8080 and 8081 respectively.

## Commit Standards

All commits must follow the Conventional Commits specification:

- Use format: `<type>[optional scope]: <description>`
- Primary types: `feat:` (new feature, MINOR version), `fix:` (bug patch, PATCH version)
- Additional types: `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `chore:`, `ci:`
- Breaking changes: append `!` after type/scope (e.g., `feat!:`) or add footer `BREAKING CHANGE: <description>`
- Scope examples: `feat(oauth-client):`, `fix(jwt):`, `test(auth):`
- Always include clear, imperative description after colon and space
- Example: `feat(discord): add Discord OAuth client credentials flow`
- Example: `fix(pkce)!: correct code challenge verification algorithm`

## Code Review Standards

When reviewing code or providing feedback, use Conventional Comments format:

- Format: `<label> [decorations]: <subject>`
- Labels: `praise:`, `nitpick:`, `suggestion:`, `issue:`, `todo:`, `question:`, `thought:`, `chore:`, `note:`
- Decorations: `(non-blocking)`, `(blocking)`, `(if-minor)`, `(security)`, `(performance)`
- Examples:
  - `suggestion (security): Use parameterized queries instead of string concatenation to prevent SQL injection`
  - `issue (blocking): This endpoint lacks authentication middleware, exposing user data`
  - `praise: Excellent use of PKCE to protect against authorization code interception`
  - `question (non-blocking): Should we validate the JWT audience claim for this endpoint?`

## Security Requirements (OWASP Top 10:2025 Focus)

### A01:2025 - Broken Access Control (Critical Priority)

Detect and prevent access control vulnerabilities:

- **Insecure Direct Object References (IDOR)**: Always validate that the authenticated user has permission to access the requested resource ID
- **Horizontal Privilege Escalation**: Verify users can only access their own resources (e.g., user A cannot access user B's tokens)
- **Vertical Privilege Escalation**: Ensure role-based access control prevents regular users from accessing admin functions
- **Missing Function Level Access Control**: Every protected endpoint must verify authorization, not just authentication
- Check for: accessing resources by manipulating IDs, missing ownership validation, inadequate role checks
- Example checks: `if (token.userId !== requestedUserId) throw UnauthorizedError`

### A05:2025 - Injection Vulnerabilities

Prevent all injection types:

- **SQL Injection**: Use parameterized queries, never concatenate user input into SQL
- **NoSQL Injection**: Validate and sanitize MongoDB/database queries
- **Command Injection**: Never pass user input to shell commands without validation
- **XSS Prevention**: Sanitize all user input, use Content Security Policy headers, escape output in templates
- **LDAP/XML Injection**: Validate and escape special characters in queries
- OAuth-specific: Validate redirect URIs against whitelist, sanitize state parameters

### A07:2025 - Authentication Failures

Strengthen authentication mechanisms:

- Implement rate limiting on authentication endpoints to prevent brute force
- Use secure session management with httpOnly, secure, and SameSite cookie flags
- Validate JWT signatures, expiration (exp), and audience (aud) claims
- Implement proper token rotation and revocation
- Never log or expose credentials, tokens, or secrets
- Use strong password policies and consider multi-factor authentication

### API-Specific Security

OAuth 2.0 and OIDC implementations require additional scrutiny:

- **Authorization Code Flow**: Validate state parameter for CSRF protection, implement PKCE for public clients
- **Token Endpoint**: Require client authentication, validate redirect_uri matches registered value
- **PKCE Implementation**: Verify code_verifier matches code_challenge using correct algorithm (S256 or plain)
- **Scope Validation**: Enforce least privilege, validate requested scopes
- **Token Storage**: Use httpOnly cookies or secure storage, never localStorage for sensitive tokens
- **JWKS Validation**: Verify JWT signatures against current public keys, implement key rotation
- **Redirect URI Validation**: Strict whitelist matching, prevent open redirects

### A02:2025 - Security Misconfiguration

Configuration security checks:

- Never commit secrets, API keys, or credentials to version control
- Use environment variables for sensitive configuration
- Disable debug mode and verbose errors in production
- Set secure HTTP headers: HSTS, X-Frame-Options, X-Content-Type-Options
- Keep dependencies updated, run `pnpm audit` regularly
- Use TLS/HTTPS for all production endpoints

### A06:2025 - Insecure Design

Design-level security considerations:

- Apply principle of least privilege to all access decisions
- Implement defense in depth with multiple security layers
- Design for security failures: fail securely, don't expose internal errors
- Use security design patterns: authentication middleware, centralized authorization
- Threat model OAuth flows: consider token theft, CSRF, authorization code interception

## Code Style & Patterns

TypeScript and Fastify conventions:

- Use ES modules with `.js` extensions in imports (required for Node.js ESM)
- Path alias: `#@/*` maps to project root, use `#@/src/` in source, `#@/dist/` in builds
- Fastify controllers: export default async function receiving fastify instance
- Error handling: extend `DomainError` from `#@/src/Contexts/Shared/domain/errors/`
- Configuration: use Convict schema validation in `Config/config.ts` files
- Testing: Node.js native test runner for unit tests, Cucumber for BDD features
- Build: SWC compiler (not tsc), configured in `.swcrc.build`

## OAuth Implementation Patterns

When implementing OAuth flows:

- Structure: authorization endpoint redirects to provider, callback endpoint exchanges code for token
- Controllers: `authentication{Provider}GetController.ts` for initiation, `authentication{Provider}CallbackGetController.ts` for callback
- Token extraction: use `getAccessToken()` from `#@/src/Contexts/Shared/infrastructure/http/getAccessToken.js`
- JWT creation: use `accessTokenSigner.ts` for HS256, `accessTokenAsymmetricSigner.ts` for RS256
- JWT validation: verify signature, expiration, and claims before trusting
- Cookie settings: httpOnly, secure (production), appropriate SameSite value

## Performance & Quality

Optimization guidelines:

- Minimize dependencies, prefer built-in Node.js APIs when possible
- Use Fastify's built-in validation for request/response schemas
- Implement proper logging with Pino (structured JSON logs)
- Cache JWKS public keys with appropriate TTL
- Use connection pooling for database/HTTP clients
- Profile before optimizing, measure performance impact

## Testing Requirements

Test coverage expectations:

- Unit tests for domain logic and utilities in `tests/Contexts/`
- Feature tests for OAuth flows in `tests/apps/{client|server}/features/`
- Test security controls: authentication, authorization, token validation
- Test error conditions: invalid tokens, expired JWTs, missing authorization
- Use Supertest for HTTP integration tests against Fastify
- Minimum coverage: aim for 80%+ on critical security paths

## Documentation

Code documentation standards:

- Update [CLAUDE.md](../CLAUDE.md) when adding new architectural patterns or major features
- JSDoc for public APIs and complex functions
- Inline comments only when logic is not self-evident
- Update README.md for user-facing changes
- Document OAuth provider integration steps for future reference

## Dependencies

Dependency management:

- Use pnpm (required, enforced by engineStrict)
- Keep critical dependencies updated: fastify, fast-jwt, oauth2-server
- Review security advisories: run `pnpm audit` before releases
- Evaluate new dependencies for security, maintenance, and license compatibility
- Prefer well-maintained packages with active security response

## Environment & Runtime

Runtime requirements:

- Node.js >= 22
- ES Modules only (`"type": "module"` in package.json)
- Development: use `pnpm start:{client|server}:debug` for hot-reload and debugger
- Production: compile with `pnpm build`, run with `pnpm start`
- Docker: build optimized image with multi-stage Dockerfile
