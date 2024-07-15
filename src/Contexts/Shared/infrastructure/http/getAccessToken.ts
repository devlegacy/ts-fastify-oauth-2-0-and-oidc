import type {
  FastifyRequest,
} from 'fastify'

import {
  UnauthorizedError,
} from '#@/src/Contexts/Shared/domain/errors/UnauthorizedError.js'

export const getAccessToken = (req: FastifyRequest) => {
  const {
    authorization,
  } = req.headers

  if (!authorization) {
    throw new UnauthorizedError('No authorization header provided')
  }

  // Bearer eyJhbGciOiJIUzI1(...)
  const [
    type,
    access_token,
  ] = authorization.split(' ')

  if (type !== 'Bearer') {
    throw new UnauthorizedError('Authorization type must be Bearer')
  }

  if (!access_token) {
    throw new UnauthorizedError('No access token provided')
  }

  return access_token
}
