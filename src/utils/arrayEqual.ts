export function arraysAreEqual<T = Array<unknown>>(
  arr1: T[],
  arr2: T[],
): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  const frequencyMap: { [key: string]: number } = {}

  for (const item of arr1) {
    const key = String(item)
    frequencyMap[key] = (frequencyMap[key] || 0) + 1
  }

  for (const item of arr2) {
    const key = String(item)
    if (!frequencyMap[key]) {
      return false
    }
    frequencyMap[key] -= 1
  }

  return Object.values(frequencyMap).every(count => count === 0)
}
