// src/lib/debounce.ts
export function debounce<F extends (...args: any[]) => void>(fn: F, delay = 400) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const run = (...args: Parameters<F>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };

  run.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return run as ((...args: Parameters<F>) => void) & { cancel: () => void };
}
