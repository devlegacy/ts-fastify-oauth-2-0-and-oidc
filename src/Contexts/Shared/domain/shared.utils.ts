export const isUndefined = (value: unknown) => typeof value === 'undefined'
export const isString = (value: unknown) => typeof value === 'string'
export const isNil = (value: unknown) => isUndefined(value) || value === null
