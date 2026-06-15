import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReferralService {
  private apiUrl = `${environment.apiUrl}/referral`;

  constructor(private http: HttpClient) {}

  getReferralTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`);
  }

  getReferrals(page: number, size: number, referralType?: string | null, branchId?: number | null): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (referralType) params = params.set('referralType', referralType);
    if (branchId != null) params = params.set('branchId', branchId.toString());
    return this.http.get<any>(`${this.apiUrl}/list`, { params });
  }

  createReferral(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, data);
  }

  updateReferral(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, data);
  }

  toggleStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<any> {
    const params = new HttpParams().set('status', status);
    return this.http.put<any>(`${this.apiUrl}/status/${id}`, {}, { params });
  }

  deleteReferral(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
