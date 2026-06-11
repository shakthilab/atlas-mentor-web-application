import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface Branch {
  id: number;
  name: string;
  code?: string;
  location?: string;
  status?: string;
}

export interface MobileCountryCode {
  id: number;
  countryName: string;
  countryCode: string;
  mobileCode: string;
  isoAlpha2?: string;
  isoAlpha3?: string;
  isActive?: boolean;
  flagUrl: string;
  mobileNumberLength?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MasterDataService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<{ success: boolean; data: Role[] }> {
    return this.http.get<{ success: boolean; data: Role[] }>(`${this.apiUrl}/roles`);
  }

  getMobileCountryCodes(): Observable<{ success: boolean; data: MobileCountryCode[] }> {
    return this.http.get<{ success: boolean; data: MobileCountryCode[] }>(`${this.apiUrl}/mobile-country-codes`);
  }

  getBranches(includeInactive: boolean = true): Observable<{ success: boolean; data: Branch[] }> {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }
    return this.http.get<{ success: boolean; data: Branch[] }>(`${this.apiUrl}/branches`, { params });
  }

  getManagersByBranch(branchId: number, roleIds: number[]): Observable<any> {
    let params = new HttpParams().set('branchId', branchId.toString());
    roleIds.forEach(id => {
      params = params.append('roleIds', id.toString());
    });
    return this.http.get<any>(`${this.apiUrl}/admin/get-all-employee`, { params });
  }

  getCounsellorsByBranch(branchId: number): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/users/counsellors/by-branch`,
      { params: new HttpParams().set('branchId', branchId.toString()) }
    );
  }

  getCountries(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/countries`);
  }

  getUniversitiesByCountry(countryId: number): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/universities/country/${countryId}`);
  }
}
