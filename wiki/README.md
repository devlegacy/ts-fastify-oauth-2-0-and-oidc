# Notes

> [!NOTE]
> This is a useful note   
> ...   

> [!IMPORTANT]
> This is an important note   
> ...   

> [!WARNING]   
> This is a warning   
> ...   

> [!TIP]
> This is a tip   
> ...   

> [!CAUTION]
> This is a caution   
> ...   

## Tools

- [Welcome to swimlanes.io](https://swimlanes.io/)
- [Curso de Introducción a OAuth 2.0 y OpenID Connect.pdf - Google Drive](https://drive.google.com/file/d/1xKbOWF3-9mkl9MUFWCFrseSTxnceUkPz/view)

## Authentication

- Process of verifying the identity of a user or process to ensure that the user or process is who it claims to be with the help of a password, token, or biometric data, etc.
- Ex.

- **Authentication**: the process of verifying who you are.
- peephole
- `username`:`password`

> [!CAUTION]
> `authenticate !== authorize`   

## Authorization

- Process of determining or given whether a user or process has the necessary permissions to access a resource or perform an action.
- Ex. service of valet parking with keys with limited permissions.

- **Authorization**: The process of verifying what you have (limit) access to.
- Groups - Roles - Permissions
- Role-based access control (RBAC)
- Attribute-based access control (ABAC)
- Rule-based access control (RAC)

## Open Authorization (OAuth) & OpenID Connect (OIDC)

- OAuth is an open standard `protocol of authorization` for access delegation, commonly used as a way for Internet users to grant websites or applications access to their information on other websites but without giving them the passwords.
- OIDC is an authentication layer on top of OAuth 2.0, an identity layer that sits on top of the OAuth 2.0 protocol. It allows third-party services to exchange your authentication information without sharing your password.
- protocol !== standard | algorithm | specification
## OAuth 2.0

> [!IMPORTANT]
> `OAuth !== auth0`   
> **OAuth**: Open Authorization Standard   
> **OAuth0**: Business that provides OAuth as a service

OIDC: OpenID Connect (OIDC) is an authentication layer on top of OAuth 2.0, an authorization framework.

## OAuth and OIDC

<!-- TRANSLATE: this -->
OAuth 2.0 nació con el fin de poder autorizar terceros en apps propias.
OAuth permitió la creación de OIDC.

- Login with discord
- Login with google
- Login page with permissions

- Roles in OAuth 2.0
  -  Client 🟪: 📲 Application (Web App, Mobile App, Backend, CLI, etc.)
  - Authorization server 🟩: 🛡️🔐 OAuth Server provides token (API). Server that issues access tokens after successfully authenticating the client and resource owner, and authorizing the client to access the resource.
    - Show concern request
    - API Server
    - Returns a token
      - JWT (Standard for OIDC)
      - Opaque token
      - Others...
    - Commonly Authorization serve and Resource Server are the same server (We ask to Discord for a token to access the user's data in Discord endpoints).
    - Those can be services like OAuth0, Okta, Amazon Cognito, Keycloak, etc.
    - Entidades que manejan authentication y authorization de usuarios, obtienen el consentimiento y emiten tokens de acceso en el contexto de Oauth2.0. Guardian que controla el acceso a los recursos del usuario en un servicio.
  - Resource owner 🟧: 👤 User 👨🏾‍💻
  - Resource server 🩷: 🗄️ API Server 🌐 provides endpoints
    - Commonly resource server and Authorization server are the same server. (We access to Discord endpoints with the token that Discord gave us).

- Terms (OAuth 2.0)
  - `Related to request`
    - Redirect URI: Where the user will be redirected after the authorization.
    - Concent request: Web page that asks the user to authorize the client.
    - Scopes: Permissions that the client is asking for.
    - Authorization grant: Code from `authorization server` to the `client` to exchange for an `access token`.

  - `Related to authorization server`
    - Client ID: similar to `user` for a client (app)
    - Client Secret: similar to `password` for a client (app)
    - Access token: Token that the client uses to access the resource server.
    - Refresh token (optional)
    - ID token (OIDC): Token that the client uses to identify the user.

- Authorization request ->
- Authorization grant <-
  - grant - concesión
    - client_credentials, password, authorization_code, implicit, refresh_token
  - permiso de autorización
  - otorgamiento de autorización
- Authorization grant (exchange) ->
  - it happens in the backend sending the client_id and client_secret
- Access token <-
- Request with access token ->
- Resource Server response <-

## JSON Web Tokens (JWT)

- JSON Web Token: JWT
  - Abstract entity.
  - JSON Web signature
    - `header`.`payload`.`signature` (compact format serialized)
    - `base64UrlEncode(header)`.`base64UrlEncode(payload)`.`base64UrlEncode(HMACSHA256(base64UrlEncode(header).base64UrlEncode(payload), secretKey))`
    - Claims (declaraciones)
      - registered
        - **iss**, **sub**, **aud**, **exp**, nbf, iat, jti
        - **issuer** (iss): Identifies the principal that issued the JWT, commonly authorization server.
        - **subject** (sub): Identifies the principal that is the subject of the JWT, commonly the user ID.
        - **audience** (aud): Identifies the recipients that the JWT is intended for.
        - **expiration time** (exp): Identifies the expiration time on or after which the JWT must not be accepted for processing. In seconds. (Unix timestamp ?).
        - not before (nbf): Identifies the time before which the JWT must not be accepted for processing.
        - issued at (iat): Identifies the time at which the JWT was issued.
        - JWT ID (jti): Provides a unique identifier for the JWT.
      - public (common)
        - name, email, etc.
      - private (custom)
        - roles, permissions, etc.
    - Signature
      - HMACSHA256, RSA, ECDSA
      - RS256, HS256, ES256
        - RS256 (asymmetric)
          - RSA public key
          - RSA private key
        - HS256 (symmetric)
          - secret key
    - private key (`string`, can't expose signature)
  - JSON Web encryption
    - private.pem (can't be exposed)
    - public.pem (can be exposed)

## Sessions vs Tokens

- Sessions vs Tokens
  - http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/
- session id
  - cookie
  - filesystem or shared memory
  - database (redis, memcached, etc.) / pricing

- session troubles
  - Single page application (SPA)
    - SPA don't refresh in the server side, there is no way to communicate the session status.
    - troubleshooting
  - RESTful API
    - Stateless
  - Scalability
    - More users, more sessions, more memory (external services)

- tokens troubles
  - JWT
  - JWT expiration
  - JWT revocation
  - Token storage best practices

## OAuth 2.0 flows

- Authorization Code Flow (common)
  - Is the `client` a web app that runs on a server?
- Authorization Code Flow with Proof Key for Code Exchange (PKCE) (recommended)
  - Is the `client` a native/mobile/single-page app?
  - Clients that can't store the secrets securely (clientSecret)
  - SPA
  - Hashing algorithm (isn't reversible)
- Implicit Flow (deprecated)
- Client Credentials Flow (no user)
  - Is the `client` the `resource owner`? 
  - Use cases: CLI, External API, etc.
- Resource Owner Password Credentials Flow (deprecated)
  - Can we trust the `client` the user's credentials?
- Device Authorization Flow
- Refresh Token Flow

-----

- Implicit flow with form post
- Hybrid flow

## OIDC

- Protocol that sits on top of OAuth 2.0
- scopes:
  - openid is a must
  - profile
  - email
- urls
  - /token
  - GET /userinfo (with access token)
- ID Token 
  - JSON Web Token (JWT)
    - Scope data
- Flows
  - Authorization Code Flow
  - Authorization Code Flow with PKCE
  - Implicit Flow with form post
  - Hybrid Flow


## Oauth 2.0 + OIDC tokens

- 🔑 Access Token → Resource Server
  - Purpose: Grants the client application permission to access protected resources on behalf of the user.​
  - Audience (aud): Specifies the Resource Server (e.g., an API endpoint) that should accept and validate the token.​
  - Usage: The client includes the access token in requests to the Resource Server to access protected resources. The Resource Server validates the token to ensure it was issued for its use.​
  - Security Note: The access token should not be interpreted by the client; it's meant solely for the Resource Server.
  - Can be a JWT or an opaque token.
  - Can be used in `/userinfo` endpoint.
- 🔄 Refresh Token → Authorization Server
  - Purpose: Allows the client to obtain a new access token (and optionally a new ID token) **without re-authenticating the user**.​
  - Audience (aud): Designated for the Authorization Server that issued it. Only this server should accept and process the refresh token.​
  - Usage: The client sends the refresh token to the Authorization Server to request new tokens when the current access token expires.​
  - Security Note: Refresh tokens are sensitive and should be stored securely. Implementing measures like refresh token rotation can enhance security.
- 🪪 ID Token → Client Application
  - Purpose: Provides information about the authenticated user, confirming their identity to the client application.​
  - Audience (aud): Intended for the client application, identified by its client ID.​
  - Usage: The client application uses the ID token to obtain user identity information, such as the user's name or email address, without making additional requests.​
  - Security Note: ID tokens should not be used to access protected resources on a Resource Server; they are meant solely for the client application. ​
  - Must be a JWT, as it contains claims about the user and the authentication event.

### 🔐 Importance of the aud Claim

The aud claim in each token ensures that the token is used only by its intended recipient:​
- Access Token: Ensures that only the specified Resource Server can accept the token.​
- Refresh Token: Restricts usage to the Authorization Server that issued it, preventing misuse by other parties.​
- ID Token: Confirms that the token is meant for the client application, preventing other applications from accepting it.​

By enforcing the correct audience for each token type, the system maintains a secure and purpose-specific flow of authentication and authorization.​   

## JSON Web keys set (JWKS)

- It's like a standardized phonebook for public cryptographic keys. It's a JSON object containing a set (keys array) of public keys (JWK - JSON Web Keys).
- Identity Providers (like Auth0, Okta, Azure AD B2C, etc.) publish their public keys at a specific URL (the JWKS URI). Applications use these public keys to verify the authenticity (signature) of JSON Web Tokens (JWTs) issued by that provider.
  - The JWKS URI is typically in the format: `https://<your-identity-provider>/.well-known/jwks.json`.
  - The JWKS contains multiple keys, each usually identified by a unique key ID (kid). 
  - When a JWT is issued, it includes the kid in its header. The application can then look up the corresponding public key in the JWKS to verify the JWT's signature.

## JSON Object Signing and Encryption (JOSE)

- JSON Object Signing and Encryption (JOSE) is a framework that defines a way to securely transmit information as a JSON object. It includes specifications for signing and encrypting JSON data structures, allowing for secure communication between parties.

## Good practices

- JWT
  - Avoid sensible data in the payload.
  - Keep the payload small.
  - Use short-lived access tokens.
  - Use JWT as opaque tokens, validate in backend.
  - Concerns
    - Storage in a secure place (http cookie).
    - Block/Ban JWT filtered (jti with blocklist or deny list).
    - Refresh token rotation (implement refresh strategy, redirect to login on error or implement silent authentication).
    - Rotate signing keys (add all not expired tokens to a blocklist and have a mechanism or strategy to rotate keys easily).
- OAuth 2.0
  - Use just the necessary scopes.
  - Never expose or use the `client_secret` in the frontend.
  - User environment variables to store sensitive data like the `client_secret` and never hardcode it in the source code or upload to a hub.- Create a Client properly with a description and data useful for the user.
  - Ensure that the Client is ready for production
  - Store tokens in a secure place (http cookie).
  - Use HTTPS.
  - Implement proper error handling and logging for better debugging when a token is expired or invalid for any reason.
