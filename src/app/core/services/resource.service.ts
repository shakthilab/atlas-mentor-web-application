import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ResourceData {
  id?: number;
  ownerId?: number;
  ownerType?: string;
  ownerName?: string;
  ownerNames?: string[];
  ownerIds?: number[];
  uploadedById?: number;
  uploadedByName?: string;
  storageType?: string;
  externalUrl?: string;
  filePath?: string | null;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  resourceType?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string | null;
}

export interface Page<T> {
  content: T[];
  pageable?: any;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size?: number;
  number?: number;
  first: boolean;
  numberOfElements?: number;
  empty: boolean;
  currentPage?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private apiUrl = `${environment.apiUrl}/referral-resources`;
  private usersApiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsersByRoleAndBranch(roleId: number, branchId?: number): Observable<any[]> {
    let params = new HttpParams().set('roleId', roleId.toString());
    if (branchId) {
      params = params.set('branchId', branchId.toString());
    }
    return this.http.get<any[]>(`${this.usersApiUrl}/active-by-role-and-branch`, { params });
  }

  createResource(resource: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, resource);
  }

  updateResource(id: number, resource: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, resource);
  }

  deleteResource(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getResources(page: number = 0, size: number = 10, filters?: any): Observable<Page<ResourceData>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<Page<ResourceData>>(this.apiUrl, { params });
  }
}
