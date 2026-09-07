import { Injectable } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavService {

    public currentUrl = new BehaviorSubject<any>(undefined);
    public closeNavRequest$ = new Subject<void>();

    constructor(private router: Router) {
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                this.currentUrl.next(event.urlAfterRedirects);
            }
        });
    }

    public requestCloseNav(): void {
        this.closeNavRequest$.next();
    }

}
