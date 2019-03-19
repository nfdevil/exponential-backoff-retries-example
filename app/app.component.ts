import { Component } from '@angular/core';
import { of, Subject, merge, BehaviorSubject } from 'rxjs';
import { tap, map, switchMap, startWith, mergeMap} from 'rxjs/operators';
import * as retry from '../retry';
import { BackendService, HttpError } from './backend.service';

export const INIT_INTERVAL_MS = 500; // 100 ms
export const MAX_INTERVAL_MS = 5 * 1000; // 20 sec

function isHttpError(error: {}): error is HttpError {
  return (error as HttpError).status !== undefined;
}

@Component({
  selector: 'my-app',
  template: 'Open console :) <span *ngIf="counter$ | async">Opnieuw proberen in {{ counter$ | async }} seconden...</span>  <button (click)="refresh()">Refresh</button>',
})
export class AppComponent {
  private reset$ = new Subject();
  counterSub$ = new BehaviorSubject<number>(0);
  counter$;
  constructor(private readonly service: BackendService) { 
    this.counter$ = this.counterSub$.pipe(map(val => val /1000));
    
    
  }
  ngOnInit(){
    this.reset$.pipe(switchMap(() => this.message$)).subscribe(
    msg => { {console.log('success', msg); this.counterSub$.next(0)} },
    err => { console.log('error', err) },
    () => { 
      console.log('Complete!')})
    this.refresh();
  }
  refresh(){
    this.reset$.next(void 0);
  }
  message$ = of('Retrying...').pipe(
    tap(console.log),
    switchMap(() => {
      return this.service.callBackend()
    }),
    retry.retryBackoff({
      initialInterval: INIT_INTERVAL_MS,
      maxInterval: MAX_INTERVAL_MS,
      shouldRetry: (error) => {
        //this.counter += 1;
        //console.log((Math.pow(2, this.counter) * INIT_INTERVAL_MS)/1000)
        // error could be anything, including HttpError that 
        // we want to handle from sevice.callBackend()
        // if (isHttpError(error)) {
        //   // If this is HttpError and status is not 404
        //   // then continue retrying
        //   return error.status !== '404';
        // }
        // should retry for the rest of the types of errors.
        return true;
      }
    }, this.counterSub$),

    // Could also be used as 
    // retryBackoff({ initialInterval: 100 }),
    // or
    // retryBackoff({ initialInterval: 100, maxAttempts: 12}),
    );
}
