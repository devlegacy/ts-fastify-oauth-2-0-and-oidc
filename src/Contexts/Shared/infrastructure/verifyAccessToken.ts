import {
  createVerifier,
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

export const verifyAccessToken = (access_token: string) => {
  const verifySync = createVerifier({
    key: config.get('accessToken.secret'),
    cache: true,
    ignoreExpiration: false,
  })

  const payload = verifySync(access_token)
  if (Date.now() > payload.exp * ONE_SECOND_IN_MILLISECONDS) {
    throw new UnauthorizedError('Access token expired')
  }
  return payload
}
