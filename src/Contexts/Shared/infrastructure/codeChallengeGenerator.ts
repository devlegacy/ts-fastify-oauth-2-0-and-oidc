import {
  createHash,
} from 'node:crypto'

export const codeChallengeGenerator = (codeVerifier: string) => {
  return createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
}
