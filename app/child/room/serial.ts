/**
 * Runs async jobs one at a time, in the order they were queued (My room saves, D-074): an older save can
 * never land after a newer one. A failed job doesn't stop the ones after it.
 */
export function serial() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(job: () => Promise<T>): Promise<T> => {
    const run = tail.then(job, job);
    tail = run.catch(() => undefined);
    return run;
  };
}
