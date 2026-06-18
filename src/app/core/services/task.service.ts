import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TaskComment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  date: string;
}

export interface TaskAttachment {
  id: number;
  name: string;
  size: string;
  type: string; // 'image' | 'doc'
  url: string;
  date: string;
}

export interface TaskActivity {
  id: number;
  user: string;
  action: string;
  date: string;
  type?: 'activity' | 'comment';
  rawAction?: string;
}

export interface TaskStats {
  openTasks: number;
  openTasksTrend: string;
  inProgress: number;
  inProgressTrend: string;
  overdue: number;
  overdueTrend: string;
  completedThisWeek: number;
  completedThisWeekTrend: string;
}

export interface TaskResponse {
  tasks: Task[];
  stats: TaskStats | null;
  totalPages?: number;
  totalElements?: number;
}

export interface BundleTask {
  id?: number;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDays: number; // Days from bundle execution
}

export interface TaskBundle {
  id: number;
  name: string;
  description: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  scheduleType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONE_TIME' | 'N/A' | '';
  executionTime?: string; // Time string like "10:25 PM"
  startDate?: string;
  executionDay?: string;
  executionDayOfMonth?: number;
  tasks: BundleTask[];
  activeTaskCount?: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: 'Development' | 'Design' | 'QA' | 'Marketing' | 'Management';
  tags: string[];
  assignee: { name: string; avatar: string };
  reporter: { name: string; avatar: string };
  dueDate: string; // ISO String or YYYY-MM-DD
  estimatedTime: string;
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  activities: TaskActivity[];
}

export const MOCK_MEMBERS = [
  { name: 'Shakthi', avatar: '/assets/images/profile/user-1.jpg' },
  { name: 'Anita', avatar: '/assets/images/profile/user-2.jpg' },
  { name: 'Rahul', avatar: '/assets/images/profile/user-3.jpg' },
  { name: 'Priya', avatar: '/assets/images/profile/user-4.jpg' },
  { name: 'Nirav Joshi', avatar: '/assets/images/profile/user-4.jpg' },
  { name: 'Sunil Joshi', avatar: '/assets/images/profile/user-1.jpg' },
  { name: 'Andrew McDownland', avatar: '/assets/images/profile/user-2.jpg' },
  { name: 'Christopher Jamil', avatar: '/assets/images/profile/user-3.jpg' }
];

export const MOCK_BUNDLES: TaskBundle[] = [
  {
    id: 1,
    name: 'Task Bundle For Branch Partner Demo',
    description: 'Testing workflow',
    role: 'BRANCH_PARTNER',
    status: 'ACTIVE',
    scheduleType: 'DAILY',
    executionTime: '10:25 PM',
    startDate: '2026-06-07',
    tasks: Array(68).fill({ title: 'Sample Task', description: 'Sample description', priority: 'Medium', dueDays: 1 })
  },
  {
    id: 2,
    name: 'Manager Task Bundle',
    description: 'Daily tasks for managers',
    role: 'MANAGER',
    status: 'ACTIVE',
    scheduleType: 'DAILY',
    executionTime: '6:00 PM',
    startDate: '2026-06-08',
    tasks: Array(198).fill({ title: 'Manager Task', description: 'Desc', priority: 'High', dueDays: 0 })
  },
  {
    id: 3,
    name: 'Scheduler Test Bundle',
    description: 'Testing full scheduler execution',
    role: 'ADMIN',
    status: 'PAUSED',
    scheduleType: 'WEEKLY',
    executionTime: '5:43 PM',
    startDate: '2026-05-08',
    tasks: Array(74).fill({ title: 'System Task', description: 'Internal', priority: 'Low', dueDays: 2 })
  }
];

const STORAGE_KEY = 'enterprise_tasks';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private initialTasks: Task[] = [
    {
      id: 1,
      title: 'Fix payment webhook timeout',
      description: 'The payment webhook has been timing out frequently when dealing with international transactions. We need to optimize the DB query and execute the webhook handler asynchronously.',
      status: 'To Do',
      priority: 'High',
      category: 'Development',
      tags: ['bug', 'payments', 'backend'],
      assignee: MOCK_MEMBERS[0], // Shakthi
      reporter: MOCK_MEMBERS[4], // Nirav Joshi
      dueDate: '2026-06-10',
      estimatedTime: '6h',
      createdBy: 'Nirav Joshi',
      createdDate: '2026-06-05T10:00:00Z',
      lastUpdated: '2026-06-07T14:00:00Z',
      comments: [
        {
          id: 101,
          author: 'Nirav Joshi',
          avatar: '/assets/images/profile/user-4.jpg',
          text: 'This is affecting users in the EU region during peak times.',
          date: '2026-06-05T10:30:00Z'
        },
        {
          id: 102,
          author: 'Shakthi',
          avatar: '/assets/images/profile/user-1.jpg',
          text: 'I have identified the slow query and am writing an index optimization migration.',
          date: '2026-06-07T09:15:00Z'
        }
      ],
      attachments: [
        {
          id: 201,
          name: 'timeout_log.txt',
          size: '4.2 KB',
          type: 'doc',
          url: 'data:text/plain;base64,V2ViaG9vayB0aW1lb3V0IGF0IDIwMjYtMDYtMDVUMTA6MDA6MDBa. ',
          date: '2026-06-05T10:15:00Z'
        }
      ],
      activities: [
        { id: 301, user: 'Nirav Joshi', action: 'created the task', date: '2026-06-05T10:00:00Z' },
        { id: 302, user: 'Nirav Joshi', action: 'assigned to Shakthi', date: '2026-06-05T10:05:00Z' }
      ]
    },
    {
      id: 2,
      title: 'Update onboarding emails',
      description: 'Review and rewrite the onboarding email sequence to improve click-through rates and onboarding success metric.',
      status: 'To Do',
      priority: 'Medium',
      category: 'Marketing',
      tags: ['copywriting', 'onboarding'],
      assignee: MOCK_MEMBERS[1], // Anita
      reporter: MOCK_MEMBERS[5], // Sunil Joshi
      dueDate: '2026-06-12',
      estimatedTime: '4h',
      createdBy: 'Sunil Joshi',
      createdDate: '2026-06-06T09:00:00Z',
      lastUpdated: '2026-06-06T09:00:00Z',
      comments: [],
      attachments: [],
      activities: [
        { id: 304, user: 'Sunil Joshi', action: 'created the task', date: '2026-06-06T09:00:00Z' }
      ]
    },
    {
      id: 3,
      title: 'QA release candidate v1.4.0',
      description: 'Perform full regression testing on the release candidate v1.4.0, including smoke tests, integration checks, and stress testing of endpoints.',
      status: 'Review',
      priority: 'High',
      category: 'QA',
      tags: ['release', 'testing'],
      assignee: MOCK_MEMBERS[2], // Rahul
      reporter: MOCK_MEMBERS[6], // Andrew McDownland
      dueDate: '2026-06-08',
      estimatedTime: '1.5d',
      createdBy: 'Andrew McDownland',
      createdDate: '2026-06-04T08:00:00Z',
      lastUpdated: '2026-06-07T12:00:00Z',
      comments: [
        {
          id: 103,
          author: 'Rahul',
          avatar: '/assets/images/profile/user-3.jpg',
          text: 'Core flows are fully tested. Just finishing boundary checks on forms.',
          date: '2026-06-07T11:45:00Z'
        }
      ],
      attachments: [],
      activities: [
        { id: 305, user: 'Andrew McDownland', action: 'created the task', date: '2026-06-04T08:00:00Z' },
        { id: 306, user: 'Rahul', action: 'changed status to Review', date: '2026-06-06T15:00:00Z' }
      ]
    },
    {
      id: 4,
      title: 'Deploy staging build',
      description: 'Build and deploy the staging environment with the latest features from the development branch.',
      status: 'Completed',
      priority: 'Low',
      category: 'Management',
      tags: ['deployment', 'ci-cd'],
      assignee: MOCK_MEMBERS[3], // Priya
      reporter: MOCK_MEMBERS[0], // Shakthi
      dueDate: '2026-06-05',
      estimatedTime: '2h',
      createdBy: 'Shakthi',
      createdDate: '2026-06-05T12:00:00Z',
      lastUpdated: '2026-06-05T14:30:00Z',
      comments: [],
      attachments: [],
      activities: [
        { id: 307, user: 'Shakthi', action: 'created the task', date: '2026-06-05T12:00:00Z' },
        { id: 308, user: 'Priya', action: 'changed status to Completed', date: '2026-06-05T14:30:00Z' }
      ]
    },
    {
      id: 5,
      title: 'Prepare sprint planning',
      description: 'Create user stories, define sprint goals, and estimate sizing for the upcoming sprint 12 development cycles.',
      status: 'To Do',
      priority: 'Medium',
      category: 'Management',
      tags: ['agile', 'sprint-planning'],
      assignee: MOCK_MEMBERS[2], // Rahul
      reporter: MOCK_MEMBERS[2], // Rahul
      dueDate: '2026-06-15',
      estimatedTime: '3h',
      createdBy: 'Rahul',
      createdDate: '2026-06-07T08:00:00Z',
      lastUpdated: '2026-06-07T08:00:00Z',
      comments: [],
      attachments: [],
      activities: [
        { id: 309, user: 'Rahul', action: 'created the task', date: '2026-06-07T08:00:00Z' }
      ]
    },
    {
      id: 6,
      title: 'Design onboarding screen UX',
      description: 'Create interactive Figma designs for the new user onboarding step with high-fidelity mockups and review with the product lead.',
      status: 'Blocked',
      priority: 'High',
      category: 'Design',
      tags: ['figma', 'ui-ux'],
      assignee: MOCK_MEMBERS[1], // Anita
      reporter: MOCK_MEMBERS[7], // Christopher Jamil
      dueDate: '2026-06-09',
      estimatedTime: '8h',
      createdBy: 'Christopher Jamil',
      createdDate: '2026-06-05T09:00:00Z',
      lastUpdated: '2026-06-07T10:00:00Z',
      comments: [
        {
          id: 104,
          author: 'Anita',
          avatar: '/assets/images/profile/user-2.jpg',
          text: 'Blocked waiting on final copywriting details for the value propositions.',
          date: '2026-06-07T10:00:00Z'
        }
      ],
      attachments: [],
      activities: [
        { id: 310, user: 'Christopher Jamil', action: 'created the task', date: '2026-06-05T09:00:00Z' },
        { id: 311, user: 'Anita', action: 'changed status to Blocked', date: '2026-06-07T10:00:00Z' }
      ]
    }
  ];

  constructor(private http: HttpClient) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.initialTasks));
    }
  }

  private getTasksFromStore(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveTasksToStore(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  getTasks(filters?: any): Observable<TaskResponse> {
    let params = new HttpParams()
      .set('page', filters && filters.page !== undefined ? filters.page : '0')
      .set('size', filters && filters.size !== undefined ? filters.size : '50')
      .set('sortBy', 'createdAt')
      .set('sortDir', 'desc');

    if (filters) {
      if (filters.overdue) params = params.set('overdue', 'true');
      if (filters.dueDateFrom) params = params.set('dueDateFrom', filters.dueDateFrom);
      if (filters.dueDateTo) params = params.set('dueDateTo', filters.dueDateTo);
      if (filters.assignedDateFrom) params = params.set('assignedDateFrom', filters.assignedDateFrom);
      if (filters.assignedDateTo) params = params.set('assignedDateTo', filters.assignedDateTo);

      if (filters.status && filters.status !== 'All') {
        // Assume backend expects IN_PROGRESS, TO_DO, etc.
        params = params.set('status', filters.status.toUpperCase().replace(/ /g, '_'));
      }
      if (filters.priority && filters.priority !== 'All') {
        params = params.set('priority', filters.priority.toUpperCase());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
    }

    return this.http.get<any>(`${environment.apiUrl}/tasks`, { params }).pipe(
      map(response => {
        const content = response.tasks ? response.tasks.content : (response.content || []);
        const stats = response.stats || null;

        // Same helper used in getTaskById — converts "IN_PROGRESS" → "In Progress"
        const formatEnum = (val: string) => {
          if (!val) return '';
          return val.split('_').map((word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
        };

        const parsedTasks = content.map((item: any) => {
          return {
            id: item.id,
            title: item.title || 'Untitled',
            description: item.description || '',
            status: formatEnum(item.status),
            priority: formatEnum(item.priority),
            category: 'Development',
            tags: [],
            assignee: { name: item.assigneeName || 'Unassigned', avatar: '/assets/images/profile/user-1.jpg' },
            reporter: { name: item.assignerName || 'System', avatar: '/assets/images/profile/user-2.jpg' },
            dueDate: item.dueDate || '',
            estimatedTime: '',
            createdBy: item.assignerName || 'System',
            createdDate: item.createdAt || '',
            lastUpdated: item.updatedAt || '',
            comments: [],
            attachments: [],
            activities: []
          } as Task;
        });

        const totalPages = response.tasks ? response.tasks.totalPages : (response.totalPages || 0);
        const totalElements = response.tasks ? response.tasks.totalElements : (response.totalElements || 0);

        return {
          tasks: parsedTasks,
          stats: stats,
          totalPages: totalPages,
          totalElements: totalElements
        };
      })
    );
  }

  getStatuses(): Observable<{value: string, label: string}[]> {
    return this.http.get<{value: string, label: string}[]>(`${environment.apiUrl}/tasks/statuses`);
  }

  getPriorities(): Observable<{value: string, label: string}[]> {
    return this.http.get<{value: string, label: string}[]>(`${environment.apiUrl}/tasks/priorities`);
  }

  updateTaskPriority(taskId: number, priority: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/tasks/${taskId}/priority`, { priority: priority.toUpperCase() });
  }

  updateTaskAssignee(taskId: number, assigneeId: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/tasks/${taskId}/assignee`, { assignedToId: assigneeId });
  }

  updateTaskDueDate(taskId: number, dueDate: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/tasks/${taskId}/due-date`, { dueDate: dueDate });
  }

  updateTaskStatusHttp(taskId: number, status: string): Observable<any> {
    // Convert UI label (e.g. "In Progress") to backend enum (e.g. "IN_PROGRESS")
    const enumStatus = status.toUpperCase().replace(/ /g, '_');
    return this.http.put<any>(`${environment.apiUrl}/tasks/${taskId}/status`, { status: enumStatus });
  }

  getTaskActivity(taskId: number): Observable<TaskActivity[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/tasks/${taskId}/activity`).pipe(
      map(activities => {
        return (activities || []).map((a: any) => {
          const user = a.doneByName || 'System';
          let actionText = a.message || a.action;
          if (actionText && actionText.startsWith(user)) {
             actionText = actionText.substring(user.length).trim();
          }
          return {
            id: a.id,
            user: user,
            action: actionText,
            date: a.createdAt,
            type: a.action === 'COMMENT_ADDED' ? 'comment' : 'activity',
            rawAction: a.action
          } as TaskActivity;
        });
      })
    );
  }

  getTaskById(id: number): Observable<Task | undefined> {
    return this.http.get<any>(`${environment.apiUrl}/tasks/${id}/details`).pipe(
      map(response => {
        if (!response || !response.task) return undefined;
        const apiTask = response.task;
        
        // Helper to format enum values (e.g., IN_PROGRESS -> In Progress)
        const formatEnum = (val: string) => {
          if (!val) return '';
          return val.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        };

        return {
          id: apiTask.id,
          title: apiTask.title || 'Untitled',
          description: apiTask.description || '',
          status: formatEnum(apiTask.status),
          priority: formatEnum(apiTask.priority),
          category: 'Development',
          tags: [],
          assignee: { name: apiTask.assigneeName || 'Unassigned', avatar: '/assets/images/profile/user-1.jpg' },
          reporter: { name: apiTask.assignerName || 'System', avatar: '/assets/images/profile/user-2.jpg' },
          dueDate: apiTask.dueDate || '',
          estimatedTime: '',
          createdBy: apiTask.assignerName || 'System',
          createdDate: apiTask.createdAt || '',
          lastUpdated: apiTask.updatedAt || '',
          comments: (response.comments || []).map((c: any) => ({
            id: c.id,
            author: c.commentedByName || 'User',
            avatar: '/assets/images/profile/user-1.jpg',
            text: c.comment,
            date: c.createdAt
          })),
          attachments: [],
          activities: (response.activities || []).map((a: any) => {
            const user = a.doneByName || 'System';
            let actionText = a.message || a.action;
            if (actionText && actionText.startsWith(user)) {
               actionText = actionText.substring(user.length).trim();
            }
            return {
              id: a.id,
              user: user,
              action: actionText,
              date: a.createdAt,
              type: a.action === 'COMMENT_ADDED' ? 'comment' : 'activity',
              rawAction: a.action
            };
          })
        } as Task;
      })
    );
  }

  createTask(taskData: Omit<Task, 'id' | 'createdDate' | 'lastUpdated' | 'activities' | 'comments' | 'attachments'>): Observable<Task> {
    const tasks = this.getTasksFromStore();
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    const now = new Date().toISOString();
    
    const newTask: Task = {
      ...taskData,
      id: newId,
      createdDate: now,
      lastUpdated: now,
      comments: [],
      attachments: [],
      activities: [
        {
          id: Date.now(),
          user: taskData.createdBy || 'System',
          action: 'created the task',
          date: now
        }
      ]
    };

    tasks.unshift(newTask);
    this.saveTasksToStore(tasks);
    return of(newTask).pipe(delay(400));
  }

  createTaskApi(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/tasks`, payload);
  }

  updateTask(updatedTask: Task, changedBy: string = 'System'): Observable<Task> {
    const tasks = this.getTasksFromStore();
    const index = tasks.findIndex((t) => t.id === updatedTask.id);
    if (index === -1) {
      throw new Error(`Task with ID ${updatedTask.id} not found.`);
    }

    const original = tasks[index];
    const activities = [...original.activities];
    const now = new Date().toISOString();

    // Check what fields changed to add activity logs
    if (original.status !== updatedTask.status) {
      activities.push({
        id: Date.now() + 1,
        user: changedBy,
        action: `changed status from "${original.status}" to "${updatedTask.status}"`,
        date: now
      });
    }
    if (original.priority !== updatedTask.priority) {
      activities.push({
        id: Date.now() + 2,
        user: changedBy,
        action: `changed priority from "${original.priority}" to "${updatedTask.priority}"`,
        date: now
      });
    }
    if (original.assignee?.name !== updatedTask.assignee?.name) {
      activities.push({
        id: Date.now() + 3,
        user: changedBy,
        action: `reassigned task to ${updatedTask.assignee?.name || 'Unassigned'}`,
        date: now
      });
    }

    const finalTask: Task = {
      ...updatedTask,
      activities,
      lastUpdated: now
    };

    tasks[index] = finalTask;
    this.saveTasksToStore(tasks);
    return of(finalTask).pipe(delay(400));
  }

  updateTaskStatus(id: number, status: string, changedBy: string = 'System'): Observable<Task> {
    const tasks = this.getTasksFromStore();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task with ID ${id} not found.`);
    }

    const task = tasks[index];
    const oldStatus = task.status;
    const now = new Date().toISOString();

    if (oldStatus !== status) {
      task.status = status as any;
      task.lastUpdated = now;
      task.activities.push({
        id: Date.now(),
        user: changedBy,
        action: `changed status from "${oldStatus}" to "${status}"`,
        date: now
      });
    }

    this.saveTasksToStore(tasks);
    return of(task).pipe(delay(300));
  }

  bulkUpdateTasks(ids: number[], updates: Partial<Task>, changedBy: string = 'System'): Observable<Task[]> {
    const tasks = this.getTasksFromStore();
    const now = new Date().toISOString();
    const updatedTasks: Task[] = [];

    const finalTasks = tasks.map((t) => {
      if (ids.includes(t.id)) {
        const updated = { ...t, ...updates, lastUpdated: now };
        
        // Log changes
        if (updates.status && t.status !== updates.status) {
          updated.activities.push({
            id: Date.now() + Math.random(),
            user: changedBy,
            action: `changed status from "${t.status}" to "${updates.status}" (Bulk action)`,
            date: now
          });
        }
        if (updates.priority && t.priority !== updates.priority) {
          updated.activities.push({
            id: Date.now() + Math.random(),
            user: changedBy,
            action: `changed priority from "${t.priority}" to "${updates.priority}" (Bulk action)`,
            date: now
          });
        }
        if (updates.assignee && t.assignee?.name !== updates.assignee?.name) {
          updated.activities.push({
            id: Date.now() + Math.random(),
            user: changedBy,
            action: `reassigned task to ${updates.assignee.name} (Bulk action)`,
            date: now
          });
        }
        if (updates.dueDate && t.dueDate !== updates.dueDate) {
          updated.activities.push({
            id: Date.now() + Math.random(),
            user: changedBy,
            action: `changed due date to ${updates.dueDate} (Bulk action)`,
            date: now
          });
        }

        updatedTasks.push(updated);
        return updated;
      }
      return t;
    });

    this.saveTasksToStore(finalTasks);
    return of(updatedTasks).pipe(delay(450));
  }

  bulkDeleteTasks(ids: number[]): Observable<void> {
    const tasks = this.getTasksFromStore();
    const filtered = tasks.filter((t) => !ids.includes(t.id));
    this.saveTasksToStore(filtered);
    return of(undefined).pipe(delay(400));
  }

  addComment(taskId: number, text: string, authorName: string = 'System'): Observable<Task> {
    return this.http.post<any>(`${environment.apiUrl}/tasks/${taskId}/comments`, { comment: text }).pipe(
      switchMap(() => this.getTaskById(taskId)),
      map(task => {
        if (!task) {
          throw new Error(`Failed to retrieve task details for task ${taskId}`);
        }
        return task;
      })
    );
  }

  deleteComment(taskId: number, commentId: number, user: string = 'System'): Observable<Task> {
    const tasks = this.getTasksFromStore();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    const task = tasks[index];
    task.comments = task.comments.filter((c) => c.id !== commentId);
    const now = new Date().toISOString();
    task.lastUpdated = now;
    task.activities.push({
      id: Date.now(),
      user,
      action: 'deleted a comment',
      date: now
    });

    this.saveTasksToStore(tasks);
    return of(task).pipe(delay(250));
  }

  editComment(taskId: number, commentId: number, newText: string, user: string = 'System'): Observable<Task> {
    const tasks = this.getTasksFromStore();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    const task = tasks[index];
    const cIndex = task.comments.findIndex((c) => c.id === commentId);
    if (cIndex !== -1) {
      task.comments[cIndex].text = newText;
      const now = new Date().toISOString();
      task.lastUpdated = now;
      task.activities.push({
        id: Date.now(),
        user,
        action: 'edited a comment',
        date: now
      });
    }

    this.saveTasksToStore(tasks);
    return of(task).pipe(delay(250));
  }

  addAttachment(taskId: number, attachment: { name: string; size: string; type: string; url: string }, user: string = 'System'): Observable<Task> {
    const tasks = this.getTasksFromStore();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    const task = tasks[index];
    const now = new Date().toISOString();
    const newAttach: TaskAttachment = {
      id: Date.now(),
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
      url: attachment.url,
      date: now
    };

    task.attachments.push(newAttach);
    task.lastUpdated = now;
    task.activities.push({
      id: Date.now() + 15,
      user,
      action: `uploaded attachment "${attachment.name}"`,
      date: now
    });

    this.saveTasksToStore(tasks);
    return of(task).pipe(delay(350));
  }

  deleteAttachment(taskId: number, attachmentId: number, user: string = 'System'): Observable<Task> {
    const tasks = this.getTasksFromStore();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    const task = tasks[index];
    const attachment = task.attachments.find((a) => a.id === attachmentId);
    task.attachments = task.attachments.filter((a) => a.id !== attachmentId);
    const now = new Date().toISOString();
    task.lastUpdated = now;
    task.activities.push({
      id: Date.now(),
      user,
      action: `removed attachment "${attachment ? attachment.name : 'Unknown'}"`,
      date: now
    });

    this.saveTasksToStore(tasks);
    return of(task).pipe(delay(250));
  }

  getTaskBundles(roleId?: number, status?: string, scheduleType?: string): Observable<any> {
    let params = new HttpParams();
    if (roleId) params = params.set('roleId', roleId.toString());
    if (status && status !== 'All') params = params.set('status', status.toUpperCase());
    if (scheduleType && scheduleType !== 'All') params = params.set('scheduleType', scheduleType.toUpperCase());

    return this.http.get<any>(`${environment.apiUrl}/task-bundles`, { params }).pipe(
      map(response => {
        const content = response.content || [];
        const mappedBundles = content.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            role: item.roleName,
            status: item.status,
            scheduleType: item.scheduleType || 'N/A',
            executionTime: item.nextExecutionAt ? new Date(item.nextExecutionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            startDate: item.createdAt,
            activeTaskCount: item.activeTaskCount,
            tasks: new Array(item.activeTaskCount || 0).fill({})
          } as TaskBundle;
        });

        return {
          bundles: mappedBundles,
          totalCount: response.totalCount || 0,
          activeCount: response.activeCount || 0,
          inactiveCount: response.inactiveCount || 0
        };
      })
    );
  }

  executeTaskBundleNow(bundleId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/task-bundles/${bundleId}/execute-now`, {});
  }

  activateTaskBundle(bundleId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/task-bundles/${bundleId}/activate`, {});
  }

  deactivateTaskBundle(bundleId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/task-bundles/${bundleId}/deactivate`, {});
  }

  createTaskBundle(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/task-bundles`, payload);
  }

  getTaskBundleById(bundleId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/task-bundles/${bundleId}`);
  }

  updateTaskBundle(bundleId: number, payload: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/task-bundles/${bundleId}`, payload);
  }

  deleteTaskBundle(bundleId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/task-bundles/${bundleId}`);
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/tasks/${taskId}`);
  }
}
