import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LeadApi {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  country?: string;
  university?: string;
  interestedCourse?: string;
  leadDate?: string;
  createdAt?: string;
  assignedTo?: any;
  addedBy?: any;
  avatar?: string;
  profilePicture?: string;
  // nested objects
  assignedEmployee?: any;
  createdByUser?: any;
  role?: any;
}

export interface LeadPage {
  content: LeadApi[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  constructor(private http: HttpClient) {}

  getLeads(page: number = 0, size: number = 100, filters?: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(`${environment.apiUrl}/students/non-registered`, { params });
  }

  getLead(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/students/${id}`);
  }

  createLead(lead: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/students/onboarding`, lead);
  }

  updateLead(id: number, lead: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/students/${id}`, lead);
  }

  updateLeadStatus(id: number, status: string, reason?: string): Observable<any> {
    const payload: any = { status };
    if (reason && status === 'LOST') {
      payload.reason = reason;
    }
    return this.http.put<any>(`${environment.apiUrl}/students/${id}/status`, payload);
  }

  deleteLead(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/students/${id}`);
  }
}
