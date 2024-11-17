import {
  createHash,
} from 'node:crypto'

export const codeChallengeGenerator = (codeVerifier: string) => {
  const base64CodeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
  const challenge = Buffer.from(base64CodeChallenge, 'base64').toString('base64url')
  return challenge
}
