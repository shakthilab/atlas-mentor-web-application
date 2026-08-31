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
  /** Approval history for this day, lazily fetched to work out whether the optional
   *  Branch Partner stage was actually reviewed or skipped once the day has moved past it. */
  approvalTrail?: ApprovalTrailItem[];
}

export interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
  parentCommentId?: number | string | null;
  replies?: CommentItem[];
  commentedByUserId?: number | string | null;
  createdAtRaw?: Date | string | null;
  createdAtDate?: Date | null;
  edited?: boolean;
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
  currentStep?: string | null;
  nextStep?: string | null;
  reflectState?: 'FLAGGED' | 'RESUBMITTED' | string | null;
  reflectStage?: string | null;
  reflectComment?: string | null;
  reflectFlaggedByName?: string | null;

  /**
   * Overdue Task Rollover (backend V23): true when this task doesn't actually belong to the
   * day currently being viewed - it's still OVERDUE/not-DONE from an earlier day and is only
   * being carried forward into "today's" list until it's completed. Only ever set on a day's
   * own tasks when that day is today - see EmployeeTreeService#getDayDetail. dueDate/id/status
   * are untouched by this; false for every task that's genuinely this day's own.
   */
  carriedOver?: boolean;
  /** This task's real, never-changing due date (ISO "YYYY-MM-DD") - distinct from the day being viewed when carriedOver is true. */
  dueDate?: string | null;
  /** work_date (ISO) of the day this task actually belongs to - differs from the viewed day only when carriedOver. */
  originalWorkDate?: string | null;
  /** Day number (within its own month) of the day this task actually belongs to. */
  originalDayNumber?: number | null;
  /** ISO datetime this task was actually marked DONE - independent of dueDate. Null until then. */
  completedAt?: string | null;
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
  dayNumber?: number;
  // Both null/undefined = recurring day, applies to this dayNumber every month.
  // Both set = scoped to that one calendar month only.
  month?: number | null;
  year?: number | null;
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
  description?: string;
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
  // Full flat list of days as returned by the backend (kept as-is, including multiple rows
  // sharing a dayNumber with different month/year), so the currently selected month's day
  // list can be resolved locally whenever the month dropdown changes, without refetching.
  rawDays?: any[];
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
