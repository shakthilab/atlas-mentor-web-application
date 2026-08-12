export interface BranchNode {
  id: string;
  name: string;
  count: number;
  roles: RoleNode[];
  expanded?: boolean;
}

export interface RoleNode {
  id: string;
  name: string;
  count: number;
  employees: EmployeeNode[];
  expanded?: boolean;
}

export interface EmployeeNode {
  id: string;
  name: string;
  role: string;
  roleName?: string;
  completionRate: number;
  years: YearNode[];
  expanded?: boolean;
  initials?: string;
  streak?: number;
}

export interface YearNode {
  id: string;
  yearNumber: number;
  months: MonthNode[];
  expanded?: boolean;
}

export interface MonthNode {
  id: string;
  name: string;
  isLive?: boolean;
  days: DayNode[];
  expanded?: boolean;
}

export interface DayNode {
  id: string;
  name: string;
  dateLabel: string;
  rawDate?: string;
  completionRate: number;
  progressRate: number;
  status: string; // e.g. "Manager Review", "Completed", "Closed" etc.
  nextActionRole?: 'BRANCH_PARTNER' | 'MANAGER' | 'ADMIN' | string | null;
  canCurrentUserAct?: boolean;
  approvalStage?: string;
  isWeekly?: boolean;
  tasks?: TaskItem[];
}

export interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
  parentCommentId?: number | string | null;
  replies?: CommentItem[];
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  fileUrl?: string;
  uploadedByName?: string;
  uploadedAt?: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
  action?: string;
  oldValue?: string;
  newValue?: string;
  doneByName?: string;
}

export interface TaskItem {
  id: string;
  displayId?: string;
  name: string;
  type: 'NUMERIC' | 'CHECKLIST' | 'FILE' | 'COMMENT' | 'APPROVAL' | 'TEXT' | 'DROPDOWN' | 'RATING' | 'YES_NO';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE' | 'REFLECT' | 'Employee' | 'Completed' | 'Counsellor Approved' | 'Manager Review' | 'Manager Feedback' | 'Verified' | 'Closed' | string;
  actualValue?: string;
  comment?: string;
  description: string;
  targetValue?: string;
  achievementRate?: number;
  assignedTo: string;
  assignedToId?: number;
  assignedBy: string;
  createdByName?: string;
  dueTime: string;
  comments: CommentItem[];
  attachments: AttachmentItem[];
  activities: ActivityItem[];
  rating?: 'Excellent' | 'Good' | 'Needs Improvement';
  latestCommentPreview?: string;
}

export interface PendingApproval {
  dayWorkspaceId: number | string;
  employeeId: number | string;
  employeeName: string;
  branchId: number | string;
  branchName: string;
  workDate: string;
  dayNumber: number;
  dailyCompletionPct: number;
  approvalStage: 'COMPLETED' | 'PARTNER_REVIEW' | 'MANAGER_REVIEW' | 'ADMIN_VERIFIED' | string;
}

export interface ApprovalTrailItem {
  stage: string;
  action: 'APPROVE' | 'SEND_BACK' | string;
  comment?: string | null;
  approverId?: number;
  approverName: string;
  actedAt: string;
}

export interface TemplateQuestion {
  id: string;
  questionText: string;
}

export interface TemplateDay {
  id: string;
  name: string; // e.g. "Day 1" or "Weekly Accountability"
  isWeekly?: boolean;
  tasks: TemplateTask[];
  questions?: TemplateQuestion[];
}

export interface TemplateMonth {
  id: string;
  name: string; // e.g. "Month 1"
  days: TemplateDay[];
}

export interface TemplateTask {
  id: string;
  name: string;
  description: string;
  type: 'NUMERIC' | 'CHECKLIST' | 'FILE' | 'COMMENT' | 'APPROVAL' | 'TEXT' | 'DROPDOWN' | 'RATING' | 'YES_NO';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'LOW' | 'MEDIUM' | 'HIGH';
  targetValue?: string;
  required: boolean;
  active: boolean;
  expectedOutput?: string;
  employeeInstructions?: string;
  dueTime?: string;
  status?: string;
  attachments?: AttachmentItem[];
  comments?: CommentItem[];
  activities?: ActivityItem[];
}

export interface RoleTemplate {
  id: string;
  name: string;
  role: string;
  roleId?: number | string | null;
  roleName?: string | null;
  roleDisplayName?: string | null;
  branch?: string | null;
  branchId?: number | string | null;
  branchName?: string | null;
  status?: 'DRAFT' | 'ACTIVE' | string;
  tasks: TemplateTask[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number | string;
  updatedBy?: number | string;
  months?: TemplateMonth[];
}

export interface TemplateAssignment {
  id: string;
  templateId: string;
  templateName: string;
  assignType: 'role' | 'branch' | 'employee';
  targetName: string;
  effectiveDate: string;
  active: boolean;
}
