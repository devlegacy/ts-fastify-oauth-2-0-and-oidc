import {
  createSigner,
  type SignerOptions,
} from 'fast-jwt'
import {
  v7 as uuid,
} from 'uuid'

import {
  ONE_SECOND_IN_MILLISECONDS,
} from '#@/src/Contexts/Shared/domain/time.js'

type SignerOptionsType = SignerOptions & Record<string, string | number>

// fastJwtAccessTokenSigner
// jwtAccessTokenSigner
// libraryAccessTokenSigner
export const accessTokenSigner = (user: { id: string, fullName: string }, config: { expirationTime: number, secret: string }) => {
  const expirationTimeInMilliseconds = config.expirationTime * ONE_SECOND_IN_MILLISECONDS
  const expiresIn = expirationTimeInMilliseconds
  // const expiresIn = Date.now() + expiresIn
  // const expiresIn = Date.now() + ONE_MINUTE_IN_MILLISECONDS

  /**
   * [JSON Web Token (JWT)](https://www.iana.org/assignments/jwt/jwt.xhtml)
   * [JSON Web Token Claims](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims#registered-claims)
   */
  const registeredClaims: SignerOptionsType = {
    // iss: config.get('app.url'), // token issuer, authorization server, who emits the token
    sub: user.id, // user id
    // aud: 'urn:fast-jwt:aud', // audience, who the token is intended for, api, client web
    expiresIn, // exp
    // notBefore: 0,
    jti: uuid(),
  }
  /**
   * [JSON Web Token (JWT)](https://www.iana.org/assignments/jwt/jwt.xhtml)
   * [JSON Web Token Claims](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims#public-claims)
   */
  const publicClaims: SignerOptionsType = {
    name: user.fullName,
  }

  /**
   * [JSON Web Token Claims](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims#private-claims)
   */
  const privateClaims: SignerOptionsType = {
    appId: '',
    ref: '',
  }

  const signSync = createSigner({
    key: config.secret,
    algorithm: 'HS256', // symmetric algorithm
    ...registeredClaims,
    ...publicClaims,
    ...privateClaims,
  })
  // json web signature
  // header.payload.signature
  const accessToken = signSync(publicClaims)

  return accessToken
}
