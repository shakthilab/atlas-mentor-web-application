import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BranchResponse {
  success: boolean;
  message: string;
  data: Branch[];
}

export interface Branch {
  id: number;
  name: string;
  location: string;
  status?: string;
  manager?: { id: number; name: string; email: string };
  userCounts?: any;
  createdAt?: string;
}

export interface CounsellorHierarchyResponse {
  success: boolean;
  message: string;
  data: CounsellorNode[];
}

export interface CounsellorNode {
  id: number;
  name: string;
  email: string;
  phone: string;
  branch: Branch;
  juniorCounsellors: JuniorCounsellor[];
}

export interface JuniorCounsellor {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  studentsAssigned: number;
}

export interface ManagerHierarchyResponse {
  success: boolean;
  message: string;
  data: ManagerNode[];
}

export interface ManagerNode {
  id: number;
  name: string;
  email: string;
  phone: string;
  branch: Branch;
  employees: EmployeeNode[];
}

export interface EmployeeNode {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class HierarchyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBranches(includeInactive: boolean = true): Observable<BranchResponse> {
    return this.http.get<BranchResponse>(`${this.apiUrl}/branches?includeInactive=${includeInactive}`);
  }

  getUnassignedEmployees(managerId?: number): Observable<any> {
    const url = managerId 
      ? `${this.apiUrl}/branches/unassigned-employees?managerId=${managerId}`
      : `${this.apiUrl}/branches/unassigned-employees`;
    return this.http.get<any>(url);
  }

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/roles`);
  }

  getUsersByRole(role: string, branchId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/hierarchy/users-by-role?role=${role}&branchId=${branchId}`);
  }

  assignEmployeeByRoles(payload: { roleId: number; managerId: number; userIds: number[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/hierarchy/assign-employee-by-roles`, payload);
  }

  assignEmployee(payload: { managerId: number; userIds: number[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/hierarchy/assign-employee`, payload);
  }

  assignJuniorCounsellors(payload: { seniorCounsellorId: number; juniorCounsellorIds: number[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/hierarchy/assign-junior-counsellors`, payload);
  }

  unassignEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/hierarchy/unassign-employee/${id}`);
  }

  unassignJuniorCounsellor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/hierarchy/unassign-junior-counsellor/${id}`);
  }

  getManagersHierarchy(): Observable<ManagerHierarchyResponse> {
    return this.http.get<ManagerHierarchyResponse>(`${this.apiUrl}/hierarchy/managers`);
  }

  getCounsellorsHierarchy(): Observable<CounsellorHierarchyResponse> {
    return this.http.get<CounsellorHierarchyResponse>(`${this.apiUrl}/hierarchy/counsellors`);
  }
}
