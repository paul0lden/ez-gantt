export function debounceRAF<T extends (...args: any[]) => void>(
  callback: T,
): (...params: Parameters<T>) => void {
  let rafId: number | null = null

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    rafId = requestAnimationFrame(callback.bind(this, ...args))
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCallTime: number | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now()

    if (lastCallTime && now < lastCallTime + delay) {
      clearTimeout(timeoutId!)
      timeoutId = setTimeout(() => {
        lastCallTime = now
        func.apply(this, args)
      }, delay)
    }
    else {
      lastCallTime = now
      func.apply(this, args)
    }
  }
}
