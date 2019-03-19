import { Injectable } from '@angular/core';
import { of, throwError, defer } from 'rxjs';

export interface HttpError {
  error: string,
  status: string,
}

const ERROR_404: HttpError = { error: 'No need to try anymore', status: '404' };
const ERROR_503: HttpError = { error: 'Try again?', status: '503' };

@Injectable()
export class BackendService {
  retries = 0;

  /**
   * Fake backend responses.
   * Fails with 503 until 10-th retry
   * Fails with 404 on 5-th retry
   * Succeeds on 10+
   */
  callBackend() {
    this.retries++;

    const result$ = (this.retries % 10 === 0)
      ? of({ data: 'Success!', status: '200' })
      : (this.retries === 5)
        ? throwError(ERROR_404)
        : throwError(ERROR_503);

    return defer(() => result$);
  }
}