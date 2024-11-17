import {
  createVerifier,
  // TOKEN_ERROR_CODES,
  // TokenValidationErrorCode
} from 'fast-jwt'

import {
  UnauthorizedError,
} from '#@/src/Contexts/Shared/domain/errors/UnauthorizedError.js'
import {
  ONE_SECOND_IN_MILLISECONDS,
} from '#@/src/Contexts/Shared/domain/time.js'
import {
  config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'

// fastJwtAccessTokenVerifier
// jwtAccessTokenVerifier
// libraryAccessTokenVerifier
export const accessTokenVerifier = (access_token: string) => {
  const verifySync = createVerifier({
    key: config.get('accessToken.secret'),
    cache: true,
    ignoreExpiration: false,
  })

  const payload: {
    exp: number
    iat: number
    jti: string
    name: string
    sub: string
  } = verifySync(access_token)
  if (Date.now() > payload.exp * ONE_SECOND_IN_MILLISECONDS) {
    throw new UnauthorizedError('Access token expired')
  }
  return payload
}
