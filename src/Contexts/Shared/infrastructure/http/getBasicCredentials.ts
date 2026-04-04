import type {
  FastifyRequest,
} from 'fastify'

import {
  UnauthorizedError,
} from '#/src/Contexts/Shared/domain/errors/UnauthorizedError.js'

export const getBasicCredentials = (req: FastifyRequest) => {
  const {
    authorization,
  } = req.headers

  if (!authorization) {
    throw new UnauthorizedError('No authorization header provided')
  }

  // base 64 encoded string username:password
  // Basic Z2xyb2Rhc3o6cGxhdHpp
  const [
    type,
    credentials,
  ] = authorization.split(' ')

  if (type !== 'Basic') {
    throw new UnauthorizedError('Authorization type must be Basic')
  }

  if (!credentials) {
    throw new UnauthorizedError('No credentials provided')
  }

  // username:password in base 64
  const [
    username,
    password,
  ] = Buffer.from(credentials, 'base64')
    .toString()
    .split(':')

  if (!username || !password) {
    throw new Error('Invalid credentials')
  }

  return {
    username,
    password,
  }
}
