import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Silent endpoints (e.g. token refresh, skip loader header) are not blocking the UI.
    const isSilent = req.url.includes('/auth/refresh') || req.headers.has('X-Skip-Loader');

    if (!isSilent) {
      this.loadingService.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (!isSilent) {
          this.loadingService.hide();
        }
      })
    );
  }
}
