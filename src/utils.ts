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
