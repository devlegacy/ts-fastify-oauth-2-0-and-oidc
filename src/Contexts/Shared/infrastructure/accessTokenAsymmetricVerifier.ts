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

export const accessTokenAsymmetricVerifier = (accessToken: string, config: { publicKeyPath: string }) => {
  const publicKey = readFileSync(resolve(cwd(), config.publicKeyPath), 'utf8')
  const verifySync = createVerifier({
    key: publicKey,
    cache: true,
    ignoreExpiration: false,
  })

  const payload = verifySync(accessToken)
  const isAccessTokenExpired = Date.now() > payload.exp * ONE_SECOND_IN_MILLISECONDS
  if (isAccessTokenExpired) {
    throw new Error('Access token expired')
  }
  return payload
}
