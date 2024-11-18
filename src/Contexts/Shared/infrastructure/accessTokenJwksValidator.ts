import {
  createDecoder,
  createVerifier,
} from 'fast-jwt'
import jwksClient from 'jwks-rsa'

export const accessTokenJwksValidator = async (accessToken: string, jwksUri: string) => {
  const client = jwksClient({
    jwksUri,
  })

  const decodedHeader = createDecoder({
    complete: true,
  })(accessToken) as { header: { kid: string } }

  if (!decodedHeader?.header?.kid) {
    throw new Error('Token header does not contain "kid"')
  }

  const getKey = async (kid: string): Promise<string | Buffer> => {
    return new Promise((resolve, reject) => {
      client.getSigningKey(kid, (err, key) => {
        if (err) {
          return reject(err)
        }
        if (!key) {
          return reject(new Error('Key not found'))
        }

        const signingKey = key.getPublicKey()
        resolve(signingKey)
      })
    })
  }
  const key = await getKey(decodedHeader.header.kid)
  const verifyToken = createVerifier({
    key,
  })
  return verifyToken(accessToken)
}
