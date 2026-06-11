export type UserRole =
  | 'ADMIN'
  | 'STUDENT'
  | 'EMPLOYEE'
  | 'SENIOR_COUNSELLOR'
  | 'JUNIOR_COUNSELLOR'
  | 'MANAGER'
  | 'BRANCH_PARTNER'
  | 'COMPANY'
  | 'REFERRAL';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isEmployee?: boolean;
  avatar?: string;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Raw shape returned by POST /api/auth/login
export interface ApiLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    userId: number;
    name: string;
    email: string;
    role: UserRole;
    employee: boolean;
    type: string;
  };
  timestamp: string;
  statusCode: string;
}

// Legacy alias kept for any future use
export interface AuthResponse {
  user: User;
  token: string;
}
