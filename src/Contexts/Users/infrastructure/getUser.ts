import process from 'node:process'

import {
  UnauthorizedError,
} from '#@/src/Contexts/Shared/domain/errors/UnauthorizedError.js'

const users = [
  {
    id: process.env.USER_ID ?? '',
    username: process.env.USER_USERNAME ?? '',
    password: process.env.USER_PASSWORD ?? '',
    fullName: process.env.USER_FULL_NAME ?? '',
  },
]

export const getUser = (username: string, password: string) => {
  const user = users.find((user) => user.username === username)

  if (!user || user.password !== password) {
    throw new UnauthorizedError('Invalid credentials')
  }

  return user
}
