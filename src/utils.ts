export const mapObject = <T, U>(
  obj: Record<string, T>,
  f: (entry: [key: string, value: T]) => U
): Record<string, U> => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      return [k, f([k, v])]
    })
  )
}

export const mapValues = <T, U>(obj: Record<string, T>, f: (value: T) => U): Record<string, U> => {
  return mapObject(obj, ([_, v]) => f(v))
}

export type Index<T> = Record<string, T>

export const capitalize = <T extends string>(value: T): Capitalize<T> => {
  // eslint-disable-next-line
  return upperFirst(value) as any
}

export const upperFirst = (x: string): string => {
  return `${x[0]?.toUpperCase() ?? ''}${x.slice(1)}`
}
