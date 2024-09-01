export function debounceRAF<T extends (...args: any[]) => void>(
  callback: T
): (...params: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(callback.bind(this, ...args));
  };
}

