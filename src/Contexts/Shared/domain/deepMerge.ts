import {
  isObject,
} from './shared.utils.js'

export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  if (!isObject(target) && !isObject(source)) {
    return {} as T
  }
  const output = structuredClone(target)

  for (const key in source) {
    const sourceValue = source[key as keyof T]
    const targetValue = target[key as keyof T]

    if (isObject(sourceValue)) {
      if (!(key in target)) {
        Object.assign(output, {
          [key]: sourceValue,
        })
      } else {
        output[key as keyof T] = deepMerge(targetValue, sourceValue as Partial<T[keyof T]>)
      }
    } else {
      Object.assign(output, {
        [key]: sourceValue,
      })
    }
  }
  return output
}
