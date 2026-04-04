import {
  env,
} from 'node:process'

import {
  UnauthorizedError,
} from '#/src/Contexts/Shared/domain/errors/UnauthorizedError.js'

const users = [
  {
    id: env.USER_ID ?? '',
    username: env.USER_USERNAME ?? '',
    password: env.USER_PASSWORD ?? '',
    fullName: env.USER_FULL_NAME ?? '',
  },
]

/**
 *
 * This is in infrastructure layer because it is emulating a database call even though the code reflects a domain behavior.
 */
export const getUser = (username: string, password: string) => {
  const user = users.find((user) => user.username === username)

  if (!user || user.password !== password) {
    throw new UnauthorizedError('Invalid credentials')
  }

  return user
}
