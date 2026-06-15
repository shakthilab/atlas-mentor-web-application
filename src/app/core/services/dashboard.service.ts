import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getKpiData(period: string = '7d'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/kpi`, { params: new HttpParams().set('period', period) });
  }

  getStudentsData(period: string = '7d'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/students`, { params: new HttpParams().set('period', period) });
  }

  getFinancialData(period: string = '7d'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/financial`, { params: new HttpParams().set('period', period) });
  }

  getTasksData(period: string = '7d'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tasks`, { params: new HttpParams().set('period', period) });
  }

  getTeamData(period: string = '7d'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/team`, { params: new HttpParams().set('period', period) });
  }

  getReferralsData(period: string = '7d'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/referrals`, { params: new HttpParams().set('period', period) });
  }

  getAuditData(period: string = '7d'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/audit`, { params: new HttpParams().set('period', period) });
  }
}
