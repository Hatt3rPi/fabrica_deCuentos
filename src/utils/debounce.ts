/**
 * Debounce utility for delaying function execution
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunction;
}

/**
 * Creates a debounced async function that cancels previous executions
 * @param func Async function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced async function with cancel method
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let currentPromise: Promise<any> | null = null;

  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (currentPromise) {
      // Cancel current promise by creating a new one
      currentPromise = null;
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          currentPromise = func.apply(this, args);
          const result = await currentPromise;
          if (currentPromise) { // Check if not cancelled
            resolve(result);
          }
        } catch (error) {
          if (currentPromise) { // Check if not cancelled
            reject(error);
          }
        } finally {
          currentPromise = null;
        }
      }, delay);
    });
  }) as T & { cancel: () => void };

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    currentPromise = null;
  };

  return debouncedFunction;
}