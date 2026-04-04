import {
  createVerifier,
  // TOKEN_ERROR_CODES,
  // TokenValidationErrorCode
} from 'fast-jwt'

import {
  UnauthorizedError,
} from '#/src/Contexts/Shared/domain/errors/UnauthorizedError.js'
import {
  ONE_SECOND_IN_MILLISECONDS,
} from '#/src/Contexts/Shared/domain/time.js'

// this is an accessTokenVerifier and accessTokenExpirationVerifier
// fastJwtAccessTokenVerifier
// jwtAccessTokenVerifier
// libraryAccessTokenVerifier
export const accessTokenVerifier = (accessToken: string, config: { secret: string }) => {
  const verifySync = createVerifier({
    key: config.secret,
    cache: true,
    ignoreExpiration: false,

  })

  const payload: {
    exp: number
    iat: number
    jti: string
    name: string
    sub: string
  } = verifySync(accessToken)

  const isAccessTokenExpired = Date.now() > payload.exp * ONE_SECOND_IN_MILLISECONDS
  if (isAccessTokenExpired) {
    throw new UnauthorizedError('Access token expired')
  }

  return payload
}
