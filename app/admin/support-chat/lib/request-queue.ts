export function createRequestQueue() {
  let active = 0;
  const waiting: (() => void)[] = [];
  const drain = () => {
    while (active < 4 && waiting.length) waiting.shift()!();
  };

  return {
    run<T>(request: () => Promise<T>, isCurrent: () => boolean) {
      return new Promise<T | undefined>((resolve, reject) => {
        waiting.push(() => {
          if (!isCurrent()) {
            resolve(undefined);
            return;
          }
          active++;
          (async () => {
            try {
              resolve(await request());
            } catch (error) {
              reject(error);
            } finally {
              active--;
              drain();
            }
          })();
        });
        drain();
      });
    },
  };
}
