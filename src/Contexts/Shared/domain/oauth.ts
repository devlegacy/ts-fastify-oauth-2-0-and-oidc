export const RESPONSE_TYPE = {
  CODE: 'code',
} as const

export const GRANT_TYPE = {
  AUTHORIZATION_CODE: 'authorization_code',
  TOKEN: 'token',
  ID_TOKEN: 'id_token token',
  CLIENT_CREDENTIALS: 'client_credentials',
} as const
