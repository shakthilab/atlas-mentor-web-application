import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface RegisteredStudentDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string | null;
  courseName?: string;
  intakePeriod?: string;
  status: string;
  isActive?: boolean;
  branchName?: string;
  countryName?: string;
  universityName?: string;
  createdAt?: string;
  createdByName?: string;
  assignedByName?: string | null;
}

export interface StudentPageData {
  content: RegisteredStudentDto[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: string;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getRegisteredStudents(page = 0, size = 10): Observable<StudentPageData> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http
      .get<ApiResponse<StudentPageData>>(`${environment.apiUrl}/students/registered`, { headers, params })
      .pipe(map((res) => res.data));
  }

  updateActiveStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const params = new HttpParams().set('status', status);
    return this.http.put(`${environment.apiUrl}/students/${id}/active-status`, {}, { headers, params });
  }
}
