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
import {
  config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'

type SignerOptionsType = SignerOptions & Record<string, string | number>

// fastJwtAccessTokenSigner
// jwtAccessTokenSigner
// libraryAccessTokenSigner
export const accessTokenSigner = (user: { id: string, fullName: string }) => {
  const expiresIn = config.get('accessToken.expirationTime') * ONE_SECOND_IN_MILLISECONDS
  // const expiresIn = Date.now() + expiresIn
  // const expiresIn = Date.now() + ONE_MINUTE_IN_MILLISECONDS

  /**
   * [JSON Web Token (JWT)](https://www.iana.org/assignments/jwt/jwt.xhtml)
   * [JSON Web Token Claims](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims#registered-claims)
   */
  const registeredClaims: SignerOptionsType = {
    // iss: config.get('app.url'), // token issuer, authorization server
    sub: user.id, // user id
    // aud: 'urn:fast-jwt:aud', // audience, who the token is intended for
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
    key: config.get('accessToken.secret'),
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
