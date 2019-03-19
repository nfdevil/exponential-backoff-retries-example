import { iif, Observable, throwError, timer, merge, of, Subject } from 'rxjs';
import { concatMap, retryWhen, switchMap, map, tap } from 'rxjs/operators';

export interface RetryBackoffConfig {
  // Initial interval. It will eventually go as high as maxInterval.
  initialInterval: number;
  // Maximum number of retry attempts.
  maxRetries?: number;
  // Maximum delay between retries.
  maxInterval?: number;
  // Conditional retry.
  shouldRetry?: (error: any) => boolean;
  backoffDelay?: (iteration: number, initialInterval: number) => number;
}

/**
 * Returns an Observable that mirrors the source Observable with the exception
 * of an error. If the source Observable calls error, rather than propagating
 * the error call this method will resubscribe to the source Observable with
 * exponentially increasing interval and up to a maximum of count
 * resubscriptions (if provided). Retrying can be cancelled at any point if
 * shouldRetry returns false.
 */
export function retryBackoff(
  config: number | RetryBackoffConfig, counterSubject$?: Subject<number>
) { //: <T>(source: Observable<T>) => Observable<[T, number?]>
  const {
    initialInterval,
    maxRetries = Infinity,
    maxInterval = Infinity,
    shouldRetry = () => true,
    backoffDelay = exponentialBackoffDelay
  } = typeof config === 'number' ? { initialInterval: config } : config;
  return <T>(source: Observable<T>) => 
    source.pipe(
      tap(() => counterSubject$.next(initialInterval)),
      retryWhen<T>(errors =>
        errors.pipe(
          map((error, i) =>  counterSubject$ ? counterSubject$.next(getDelay(backoffDelay(i, initialInterval), maxInterval)): ([error, i])),
          concatMap((error, i) =>
            iif(
              () => i < maxRetries && shouldRetry(error),
              timer(getDelay(backoffDelay(i, initialInterval), maxInterval)),
              throwError(error).pipe(tap(() => counterSubject$ ? counterSubject$.next(0): null))
            )
          )
          
        )
      ),
    );
}
    /** Calculates the actual delay which can be limited by maxInterval */
export function getDelay(backoffDelay: number, maxInterval: number) {
  return Math.min(backoffDelay, maxInterval);
}

/** Exponential backoff delay */
export function exponentialBackoffDelay(
    iteration: number, initialInterval: number) {
  return Math.pow(2, iteration) * initialInterval;
}