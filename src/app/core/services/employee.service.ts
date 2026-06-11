import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branchId: number;
  roleId: number;
  employeeType: string;
  managerId?: number;
  isSenior: boolean;
  mobileCountryCodeId: number;
  status?: string;
  // Fallbacks / display properties
  name?: string;
  avatar?: string;
  tasks?: number;
  role?: any;
  branch?: any;
  manager?: any;
  taskCount?: any;
}

export interface Page<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(page: number = 0, size: number = 10, filters?: any): Observable<Page<Employee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.role) params = params.set('role', filters.role);
      if (filters.branch) params = params.set('branch', filters.branch);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<Page<Employee>>(this.apiUrl, { params });
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee);
  }

  updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee);
  }

  updateEmployeeStatus(id: number, status: string): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
