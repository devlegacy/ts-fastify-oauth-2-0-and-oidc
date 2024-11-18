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
> This is a caution   
> `authenticate !== authorize`   

## Authorization

- Process of determining or given whether a user or process has the necessary permissions to access a resource or perform an action.
- Ex. service of valet parking.

- **Authorization**: The process of verifying what you have (limit) access to.
- Groups - Roles - Permissions
- Role-based access control (RBAC)
- Attribute-based access control (ABAC)
- Rule-based access control (RAC)

## Open Authorization (OAuth) & OpenID Connect (OIDC)

- OAuth is an open standard for access delegation, commonly used as a way for Internet users to grant websites or applications access to their information on other websites but without giving them the passwords.
- OIDC is an authentication layer on top of OAuth 2.0, an identity layer that sits on top of the OAuth 2.0 protocol. It allows third-party services to exchange your authentication information without sharing your password.

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
        - **expiration time** (exp): Identifies the expiration time on or after which the JWT must not be accepted for processing.
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
    - private.pem (can't expose)
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
    - More users more sessions more memory (external services)

- tokens troubles
  - JWT

## OAuth 2.0 flows

- Authorization Code Flow (common)
  - Is the `client` a web app that runs on a server?
- Authorization Code Flow with Proof Key for Code Exchange (PKCE) (recommended)
  - Is the `client` a native/mobile/single-page app?
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
- urls
  - /token
  - GET /userinfo (access token)
- ID Token 
  - JSON Web Token (JWT)
    - Scope data
- 

## JSON Web keys set (JWKS)

## JSON Object Signing and Encryption (JOSE)


