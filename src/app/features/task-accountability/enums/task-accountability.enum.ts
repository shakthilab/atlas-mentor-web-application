export enum TaskType {
  Numeric = 'NUMERIC',
  Checklist = 'CHECKLIST',
  File = 'FILE',
  Comment = 'COMMENT',
  Approval = 'APPROVAL'
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent'
}

export enum WorkflowStep {
  Employee = 'Employee',
  Completed = 'Completed',
  CounsellorApproved = 'Counsellor Approved',
  ManagerReview = 'Manager Review',
  ManagerFeedback = 'Manager Feedback',
  Verified = 'Verified',
  Closed = 'Closed'
}
