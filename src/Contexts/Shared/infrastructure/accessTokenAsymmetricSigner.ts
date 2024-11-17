import {
  readFileSync,
} from 'node:fs'
import {
  resolve,
} from 'node:path'
import {
  cwd,
} from 'node:process'

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

export const accessTokenAsymmetricSigner = (user: { id: string, fullName: string }) => {
  const expiresIn = config.get('accessToken.expirationTime') * ONE_SECOND_IN_MILLISECONDS
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

  const privateKey = readFileSync(resolve(cwd(), config.get('accessToken.privateKeyPath')), 'utf8')
  const signSync = createSigner({
    key: privateKey,
    algorithm: 'RS256', // asymmetric algorithm
    ...registeredClaims,
    ...publicClaims,
    ...privateClaims,
  })
  // json web signature
  // header.payload.signature
  const accessToken = signSync(publicClaims)

  return accessToken
}
