import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private apiV1Url = `${environment.apiUrl}/v1/partners`;
  private dashboardApiUrl = `${environment.apiUrl}/dashboard`;
  private payoutsApiUrl = `${environment.apiUrl}/client-payouts`;
  private resourcesApiUrl = `${environment.apiUrl}/referral-resources`;

  constructor(private http: HttpClient) {}

  // 1. Main Dashboard
  getDashboard(partnerId: string | number, period: string): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.apiV1Url}/${partnerId}/dashboard`, { params });
  }

  // 2. Referral Summary Stats
  getReferralSummary(): Observable<any> {
    return this.http.get<any>(`${this.dashboardApiUrl}/referral-summary`);
  }

  // 3. Commission Trend
  getCommissionTrend(range?: string, from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (range) params = params.set('range', range);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any>(`${this.dashboardApiUrl}/referral-commission-trend`, { params });
  }

  // 4. My Payouts List
  getPayouts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.payoutsApiUrl}`);
  }

  // 5. Single Payout Detail
  getPayoutById(payoutId: number): Observable<any> {
    return this.http.get<any>(`${this.payoutsApiUrl}/${payoutId}`);
  }

  // 6. Payout Activity Trail
  getPayoutActivities(payoutId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.payoutsApiUrl}/${payoutId}/activities`);
  }

  // 7. Raise Dispute
  raiseDispute(payoutId: number, disputeReason: string): Observable<any> {
    return this.http.post<any>(`${this.payoutsApiUrl}/${payoutId}/dispute`, { disputeReason });
  }

  // 8. Accept Dispute
  acceptDispute(payoutId: number, response: string): Observable<any> {
    return this.http.post<any>(`${this.payoutsApiUrl}/${payoutId}/accept-dispute`, { response });
  }

  // 9. Reject Dispute
  rejectDispute(payoutId: number, response: string): Observable<any> {
    return this.http.post<any>(`${this.payoutsApiUrl}/${payoutId}/reject-dispute`, { response });
  }

  // 10. My Resources
  getMyResources(): Observable<any[]> {
    return this.http.get<any[]>(`${this.resourcesApiUrl}/my-resources`);
  }
}
