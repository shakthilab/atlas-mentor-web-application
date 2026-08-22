import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();

  show(): void {
    this.activeRequests++;
    // Defer emission to the next microtask to avoid NG0100
    // ExpressionChangedAfterItHasBeenCheckedError when called during change detection.
    Promise.resolve().then(() => this.loadingSubject.next(true));
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      Promise.resolve().then(() => this.loadingSubject.next(false));
    }
  }

  forceHide(): void {
    this.activeRequests = 0;
    Promise.resolve().then(() => this.loadingSubject.next(false));
  }
}
