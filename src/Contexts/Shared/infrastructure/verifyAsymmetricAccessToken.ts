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
  createVerifier,
} from 'fast-jwt'

import {
  ONE_SECOND_IN_MILLISECONDS,
} from '#@/src/Contexts/Shared/domain/time.js'
import {
  config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'

export const verifyAsymmetricAccessToken = (access_token: string) => {
  const publicKey = readFileSync(resolve(cwd(), config.get('accessToken.publicKeyPath')), 'utf8')
  const verifySync = createVerifier({
    key: publicKey,
    cache: true,
    ignoreExpiration: false,
  })

  const payload = verifySync(access_token)
  if (Date.now() > payload.exp * ONE_SECOND_IN_MILLISECONDS) {
    throw new Error('Access token expired')
  }
  return payload
}
