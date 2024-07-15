# Notes

## Tools

- [Welcome to swimlanes.io](https://swimlanes.io/)
- [Curso de Introducción a OAuth 2.0 y OpenID Connect.pdf - Google Drive](https://drive.google.com/file/d/1xKbOWF3-9mkl9MUFWCFrseSTxnceUkPz/view)

## Oauth

Oauth !== Oauth0
Oauth: Open Authorization Standard
Oauth0: Business that provides Oauth as a service

OIDC: OpenID Connect (OIDC) is an authentication layer on top of OAuth 2.0, an authorization framework.

## Authentication

- **Authentication**: The process of verifying who you are.
- peephole
- username:password

## Authorization

- **Authorization**: The process of verifying what you have (limit) access to.
- Groups - Roles - Permissions
- Role-based access control (RBAC)
- Attribute-based access control (ABAC)
- Rule-based access control (RAC)

## Oauth and OIDC

<!-- TRANSLATE: this -->
Oauth 2.0 nacio con el fin de poder autorizar terceros en apps propias.
Oauth permitio la creacion de OIDC.

- Login with discord
- Login with google
- Login page with permissions

- Roles
  - Client: Web App, Mobile App, Backend, CLI, etc. 📱
  - Authorization Server: Oauth Server 🛡️ provides token (API)
    - Those can be services like Oauth0, Okta, Amazon Cognito, Keycloak, etc.
    - Show concern request
  - Resource Owner: User 👨🏾‍💻
  - Resource Server: API Server 🌐 provides endpoints
    - Commonly Resource Server and Authorization Server are the same server

- Terms (Oauth 2.0)
  - Request
    - Redirect URI
    - Scopes
    - Concent request
    - Authorization grant
  - Authorization Server
    - Client ID (user)
    - Client Secret (password)
    - Access token
    - Refresh token (optional)
    - ID token (OIDC)

- Authorization request ->
- Authorization grant <-
  - grant - concesión
    - client_credentials, password, authorization_code, implicit, refresh_token
  - permiso de autorización
  - otorgamiento de autorización
- Authorization grant (exchange) ->
- Access token <-
- Request with access token ->
- Resource Server response <-

## JWT

- JWT: JSON Web Token
  - JSON Web signature
    - header.payload.signature
    - Claims (declaraciones)
      - registered
        - **iss**, **sub**, **aud**, **exp**, nbf, iat, jti
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
  - JSON Web encryption

- Sessions vs Tokens
  - http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/

## Oauth 2.0 flows

- Authorization Code Flow (common)
  - Is the client a web app that runs on a server?
- Authorization Code Flow with PKCE (recommended) (Proof Key for Code Exchange)
  - Is the client a native/mobile/single-page app?
- Implicit Flow (deprecated)
- Client Credentials Flow (no user)
  - Is the client the resource owner? (CLI, External API)
- Resource Owner Password Credentials Flow (deprecated)
  - Can we trust the client with the user's credentials?
- Device Authorization Flow
- Refresh Token Flow

-----

- Implicit flow with form post
- Hybrid flow
