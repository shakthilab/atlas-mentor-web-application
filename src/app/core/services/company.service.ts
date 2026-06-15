import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/company`;

  constructor(private http: HttpClient) {}

  getCompanies(page: number, size: number, branchId?: number | null): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (branchId !== null && branchId !== undefined) {
      params = params.set('branchId', branchId.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/list`, { params });
  }

  createCompany(companyData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, companyData);
  }

  updateCompany(id: number, companyData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/edit/${id}`, companyData);
  }

  toggleCompanyStatus(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/toggle-status/${id}`, {});
  }

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
