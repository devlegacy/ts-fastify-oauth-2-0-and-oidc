import {
  createDecoder,
  createVerifier,
} from 'fast-jwt'
import jwksClient from 'jwks-rsa'

// 1. Receives the incoming access token (JWT).
export const accessTokenJwksValidator = async (accessToken: string, jwksUri: string) => {
  const client = jwksClient({
    jwksUri,
  })

  // 2. Extracts the kid from the JWT header.
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
  // 3. Uses the jwks-rsa client to get the public key corresponding to the kid from the JWKS endpoint.
  const key = await getKey(decodedHeader.header.kid)
  const verifyToken = createVerifier({
    key,
  })
  // 4. Calls jose.jwtVerify, passing the token, the fetched public key, and validation options (issuer, audience).
  const tokenDecoded = verifyToken(accessToken) as { nonce: string }
  // 5. If jose.jwtVerify succeeds, the token is valid, and the function might return the decoded payload.
  return tokenDecoded
}
