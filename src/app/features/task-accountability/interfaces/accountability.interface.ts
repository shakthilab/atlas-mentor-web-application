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
  completionRate: number;
  progressRate: number;
  status: string; // e.g. "Manager Review", "Completed", "Closed" etc.
  isWeekly?: boolean;
  tasks?: TaskItem[];
}

export interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
}

export interface TaskItem {
  id: string;
  name: string;
  type: 'NUMERIC' | 'CHECKLIST' | 'FILE' | 'COMMENT' | 'APPROVAL' | 'TEXT' | 'DROPDOWN' | 'RATING' | 'YES_NO';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Employee' | 'Completed' | 'Counsellor Approved' | 'Manager Review' | 'Manager Feedback' | 'Verified' | 'Closed';
  actualValue: string;
  comment: string;
  description: string;
  targetValue: string;
  achievementRate: number;
  assignedTo: string;
  assignedBy: string;
  dueTime: string;
  comments: CommentItem[];
  attachments: AttachmentItem[];
  activities: ActivityItem[];
  rating?: 'Excellent' | 'Good' | 'Needs Improvement';
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
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
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
  tasks: TemplateTask[];
  active: boolean;
  createdAt: string;
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
