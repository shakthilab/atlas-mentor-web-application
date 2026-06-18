import { Component, OnInit, ViewChild, AfterViewInit, HostListener, TemplateRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { TaskService, Task, TaskComment, TaskAttachment, TaskActivity, MOCK_MEMBERS, MOCK_BUNDLES, TaskBundle, BundleTask } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MasterDataService, Role } from '../../../core/services/master-data.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';



@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, AfterViewInit {
  // View states
  viewMode: 'list' | 'kanban' = 'list';
  isLoading: boolean = false;
  isDrawerOpen: boolean = false;
  isMobile: boolean = false;

  // Data
  tasks: Task[] = [];
  filteredTasks: Task[] = [];

  // Member options for Assignee/Reporter selectors
  members = MOCK_MEMBERS;
  categories: Task['category'][] = ['Development', 'Design', 'QA', 'Marketing', 'Management'];
  statuses: { value: string, label: string }[] = [];
  priorities: { value: string, label: string }[] = [];

  // Kanban column tasks — dynamic, keyed by status label
  kanbanColumns: Record<string, Task[]> = {};
  /** Today's date string (YYYY-MM-DD) used for overdue comparison in the template */
  readonly todayStr: string = new Date().toISOString().substring(0, 10);

  // Toolbar state
  searchText: string = '';
  private searchSubject = new Subject<string>();

  filterStatus: string = '';
  filterPriority: string = '';
  filterAssignee: string = '';

  filterDueDate: string = '';
  customDueDateStart: Date | null = null;
  customDueDateEnd: Date | null = null;

  filterCreateDate: string = '';
  customCreateDateStart: Date | null = null;
  customCreateDateEnd: Date | null = null;

  sortBy: 'dueDate' | 'priority' | 'title' | 'createdDate' | '' = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  // Pagination state
  currentPage: number = 0;
  hasMoreTasks: boolean = false;
  isLoadingMore: boolean = false;

  // Columns visibility in List View
  visibleColumns = {
    select: true,
    title: true,
    status: true,
    priority: true,
    assignee: true,
    dueDate: true,
    createdDate: true,
    createdBy: true,
    lastUpdated: true,
    actions: true
  };

  get displayedColumns(): string[] {
    return Object.keys(this.visibleColumns).filter(
      (col) => this.visibleColumns[col as keyof typeof this.visibleColumns]
    );
  }

  // Row Selection (Bulk Actions)
  selectedTaskIds: number[] = [];

  // Details Side Drawer state
  drawerMode: 'create' | 'edit' = 'create';
  editingTask: Task | null = null;
  drawerTaskData: Partial<Task> = {};
  newCommentText: string = '';
  editingCommentId: number | null = null;
  editCommentText: string = '';

  // Activity stream (merged comments & history)
  timelineStream: any[] = [];
  activeTab: 'comments' | 'activity' = 'comments';

  // Material Table Data Source
  dataSource = new MatTableDataSource<Task>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Task Bundles State
  @ViewChild('createBundleDialog') createBundleDialog!: TemplateRef<any>;
  @ViewChild('manageBundlesDialog') manageBundlesDialog!: TemplateRef<any>;
  @ViewChild('createTaskDialog') createTaskDialog!: TemplateRef<any>;
  @ViewChild('executeBundleDialog') executeBundleDialog!: TemplateRef<any>;
  mockBundles: TaskBundle[] = MOCK_BUNDLES;

  // Bundle filters
  bundleFilterRole: string = 'All';
  bundleFilterStatus: string = 'All';
  bundleFilterSchedule: string = 'All';
  availableRoles: Role[] = [];
  availableBranches: any[] = [];
  availableAssignees: any[] = [];

  taskBundles: TaskBundle[] = [];
  bundleTotalCount: number = 0;
  bundleActiveCount: number = 0;
  bundleInactiveCount: number = 0;
  selectedBundleToExecute: TaskBundle | null = null;
  bundleSearchText: string = '';

  get filteredBundles(): TaskBundle[] {
    if (!this.bundleSearchText) {
      return this.taskBundles;
    }
    const searchLower = this.bundleSearchText.toLowerCase();
    return this.taskBundles.filter(b => b.name.toLowerCase().includes(searchLower));
  }

  getActiveCount(): number {
    return this.bundleActiveCount;
  }

  getInactiveCount(): number {
    return this.bundleInactiveCount;
  }

  loadTaskBundles(): void {
    let roleId: number | undefined;
    if (this.bundleFilterRole === 'Manager') roleId = 2;
    else if (this.bundleFilterRole === 'Admin') roleId = 1;
    else if (this.bundleFilterRole === 'Branch Partner') roleId = 9;

    this.taskService.getTaskBundles(roleId, this.bundleFilterStatus, this.bundleFilterSchedule).subscribe({
      next: (data) => {
        this.taskBundles = data.bundles;
        this.bundleTotalCount = data.totalCount;
        this.bundleActiveCount = data.activeCount;
        this.bundleInactiveCount = data.inactiveCount;
      },
      error: (err) => console.error('Failed to load task bundles', err)
    });
  }

  newBundleData: TaskBundle = {
    id: 0,
    name: '',
    description: '',
    role: '',
    status: 'ACTIVE',
    scheduleType: '',
    executionTime: '',
    startDate: '',
    tasks: [
      {
        title: '',
        description: '',
        priority: 'Medium',
        dueDays: 0
      }
    ]
  };

  newTaskData: any = {
    title: '',
    description: '',
    branch: '',
    role: '',
    assignee: { name: '', avatar: '/assets/images/profile/user-1.jpg' },
    priority: 'Low',
    dueDate: ''
  };
  isTaskFormSubmitted: boolean = false;

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private masterDataService: MasterDataService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && this.viewMode === 'list') {
      // For mobile, display compact/simplified columns
    }
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadBranches();
    this.loadTasks();
    this.loadStatuses();
    this.loadPriorities();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadTasks();
    });
  }

  onSearchChange(text: string): void {
    this.searchSubject.next(text);
  }

  loadRoles(): void {
    this.masterDataService.getRoles().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.availableRoles = res.data;
        } else if (Array.isArray(res)) {
          this.availableRoles = res;
        }
      },
      error: (err) => console.error('Failed to load roles', err)
    });
  }

  loadBranches(): void {
    this.masterDataService.getBranches().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.availableBranches = res.data;
        }
      },
      error: (err) => console.error('Failed to load branches', err)
    });
  }

  onAssignmentScopeChange(): void {
    const branchId = this.newTaskData.branch;
    const roleId = this.newTaskData.role;
    
    if (!branchId && !roleId) {
      this.availableAssignees = [];
      this.newTaskData.assignee = { name: '', avatar: '/assets/images/profile/user-1.jpg' };
      return;
    }

    this.masterDataService.getEmployeesByFilter(branchId, roleId).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.availableAssignees = res.data;
        } else if (Array.isArray(res)) {
          this.availableAssignees = res;
        } else {
          this.availableAssignees = [];
        }
        
        // Reset assignee if not in new list
        if (this.newTaskData.assignee && this.newTaskData.assignee.id) {
          const exists = this.availableAssignees.find(a => a.id === this.newTaskData.assignee.id);
          if (!exists) {
            this.newTaskData.assignee = { name: '', avatar: '/assets/images/profile/user-1.jpg' };
          }
        }
      },
      error: (err) => console.error('Failed to fetch assignees', err)
    });
  }

  loadStatuses(): void {
    this.taskService.getStatuses().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.statuses = data;
        }
      },
      error: () => console.error('Failed to load statuses')
    });
  }

  loadPriorities(): void {
    this.taskService.getPriorities().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.priorities = data;
        }
      },
      error: () => console.error('Failed to load priorities')
    });
  }

  taskStats: any = null;
  animatedStats = {
    openTasks: 0,
    inProgress: 0,
    overdue: 0,
    completedThisWeek: 0
  };

  animateValue(obj: any, start: number, end: number, duration: number, prop: string) {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      // easeOutQuart
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      obj[prop] = Math.floor(ease * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj[prop] = end;
      }
    };
    window.requestAnimationFrame(step);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // Helper to format Date to YYYY-MM-DD
  private formatDateYYYYMMDD(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  // Get start of current week (Monday)
  private getStartOfWeek(): Date {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); // Monday
    return new Date(curr.setDate(first));
  }

  // Get end of current week (Sunday)
  private getEndOfWeek(): Date {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
    const last = first + 6; 
    return new Date(curr.setDate(last));
  }

  loadTasks(showToast: boolean = false, append: boolean = false): void {
    if (!append) {
      this.currentPage = 0;
      this.isLoading = true;
    } else {
      this.isLoadingMore = true;
    }

    // Build backend filters
    const backendFilters: any = {
      page: this.currentPage,
      size: 50
    };
    
    // Status, Priority, Search
    if (this.filterStatus && this.filterStatus !== 'All') {
      backendFilters.status = this.filterStatus;
    }
    if (this.filterPriority && this.filterPriority !== 'All') {
      backendFilters.priority = this.filterPriority;
    }
    if (this.searchText && this.searchText.trim() !== '') {
      backendFilters.search = this.searchText.trim();
    }
    
    // Due Date logic
    if (this.filterDueDate === 'Overdue') {
      backendFilters.overdue = true;
    } else if (this.filterDueDate === 'Today') {
      const today = this.formatDateYYYYMMDD(new Date());
      backendFilters.dueDateFrom = today;
      backendFilters.dueDateTo = today;
    } else if (this.filterDueDate === 'Week') {
      backendFilters.dueDateFrom = this.formatDateYYYYMMDD(this.getStartOfWeek());
      backendFilters.dueDateTo = this.formatDateYYYYMMDD(this.getEndOfWeek());
    } else if (this.filterDueDate === 'Custom' && this.customDueDateStart && this.customDueDateEnd) {
      backendFilters.dueDateFrom = this.formatDateYYYYMMDD(this.customDueDateStart);
      backendFilters.dueDateTo = this.formatDateYYYYMMDD(this.customDueDateEnd);
    }

    // Created Date logic
    if (this.filterCreateDate === 'Today') {
      const today = this.formatDateYYYYMMDD(new Date());
      backendFilters.assignedDateFrom = today;
      backendFilters.assignedDateTo = today;
    } else if (this.filterCreateDate === 'Week') {
      // Last 7 days (today - 7 to today)
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      backendFilters.assignedDateFrom = this.formatDateYYYYMMDD(sevenDaysAgo);
      backendFilters.assignedDateTo = this.formatDateYYYYMMDD(today);
    } else if (this.filterCreateDate === 'Custom' && this.customCreateDateStart && this.customCreateDateEnd) {
      backendFilters.assignedDateFrom = this.formatDateYYYYMMDD(this.customCreateDateStart);
      backendFilters.assignedDateTo = this.formatDateYYYYMMDD(this.customCreateDateEnd);
    }

    this.taskService.getTasks(backendFilters).subscribe({
      next: (data) => {
        if (append) {
          this.tasks = [...this.tasks, ...data.tasks];
        } else {
          this.tasks = data.tasks;
        }
        
        // Update pagination flag
        this.hasMoreTasks = this.currentPage < ((data.totalPages || 1) - 1);

        this.taskStats = data.stats;
        if (this.taskStats) {
          this.animateValue(this.animatedStats, 0, this.taskStats.openTasks, 1500, 'openTasks');
          this.animateValue(this.animatedStats, 0, this.taskStats.inProgress, 1500, 'inProgress');
          this.animateValue(this.animatedStats, 0, this.taskStats.overdue, 1500, 'overdue');
          this.animateValue(this.animatedStats, 0, this.taskStats.completedThisWeek, 1500, 'completedThisWeek');
        }
        this.applyFiltersAndSort();
        this.isLoading = false;
        this.isLoadingMore = false;
        if (showToast) {
          this.notificationService.showSuccessToast('Task board refreshed.', 'Refreshed');
        }
      },
      error: () => {
        this.isLoading = false;
        this.isLoadingMore = false;
        this.notificationService.showErrorToast('Failed to load tasks.', 'Error');
      }
    });
  }

  loadMoreTasks(): void {
    if (this.hasMoreTasks && !this.isLoadingMore) {
      this.currentPage++;
      this.loadTasks(false, true);
    }
  }

  deleteTask(task: Task): void {
    this.notificationService.showErrorPopup(`Are you sure you want to delete task "${task.title}"?`, 'Delete Task', 'Delete').subscribe((confirmed) => {
      if (confirmed) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.notificationService.showSuccessToast('Task deleted successfully.', 'Deleted');
            this.loadTasks();
          },
          error: (err) => {
            console.error('Failed to delete task', err);
            this.notificationService.showErrorToast('Failed to delete task.', 'Error');
          }
        });
      }
    });
  }

  applyFiltersAndSort(): void {
    // 1. Filter
    this.filteredTasks = this.tasks.filter((task) => {
      const matchesAssignee =
        !this.filterAssignee || this.filterAssignee === 'All' || task.assignee.name === this.filterAssignee;

      return matchesAssignee;
    });

    // 2. Sort
    if (this.sortBy) {
      const priorityWeight: Record<string, number> = { Low: 1, Medium: 2, High: 3, LOW: 1, MEDIUM: 2, HIGH: 3 };
      this.filteredTasks.sort((a, b) => {
        let comparison = 0;
        if (this.sortBy === 'dueDate') {
          const dateA = a.dueDate || '';
          const dateB = b.dueDate || '';
          comparison = dateA.localeCompare(dateB);
        } else if (this.sortBy === 'priority') {
          comparison = (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        } else if (this.sortBy === 'title') {
          const titleA = a.title || '';
          const titleB = b.title || '';
          comparison = titleA.localeCompare(titleB);
        } else if (this.sortBy === 'createdDate') {
          const dateA = a.createdDate || '';
          const dateB = b.createdDate || '';
          comparison = dateA.localeCompare(dateB);
        }

        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // 3. Update view specific layouts
    this.dataSource.data = this.filteredTasks;
    this.updateKanbanLists();
  }

  updateKanbanLists(): void {
    const cols: Record<string, Task[]> = {};
    // Seed a column for every loaded status so empty columns still appear
    this.statuses.forEach(s => {
      cols[s.label] = [];
    });
    // Bucket each filtered task into its status column
    this.filteredTasks.forEach(t => {
      if (!cols[t.status]) {
        cols[t.status] = [];
      }
      cols[t.status].push(t);
    });
    this.kanbanColumns = cols;
  }

  /** Returns a header CSS class for each status column */
  getKanbanColumnClass(status: string): string {
    const map: Record<string, string> = {
      'To Do':       'bg-light-primary text-primary',
      'In Progress': 'bg-light-warning text-warning',
      'Pending':     'bg-light-secondary text-secondary',
      'Review':      'bg-light-info text-info',
      'Completed':   'bg-light-success text-success',
      'Blocked':     'bg-light-error text-danger',
      'Rejected':    'bg-light-error text-danger',
      'Overdue':     'bg-light-warning text-warning',
      'Cancelled':   'bg-light-secondary text-muted',
    };
    return map[status] || 'bg-light-secondary text-secondary';
  }

  /** Returns the icon name for each status column header */
  getKanbanColumnIcon(status: string): string {
    const map: Record<string, string> = {
      'To Do':       'circle-dot',
      'In Progress': 'loader',
      'Pending':     'clock',
      'Review':      'eye',
      'Completed':   'circle-check',
      'Blocked':     'ban',
      'Rejected':    'x-circle',
      'Overdue':     'alert-circle',
      'Cancelled':   'circle-off',
    };
    return map[status] || 'circle';
  }

  // Sorting helper
  toggleSort(field: 'dueDate' | 'priority' | 'title' | 'createdDate'): void {
    if (this.sortBy === field) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else {
        this.sortBy = '';
        this.sortDirection = '';
      }
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  // Row Selection (Bulk Actions)
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedTaskIds = [];
    } else {
      this.selectedTaskIds = this.filteredTasks.map((t) => t.id);
    }
  }

  toggleSelectTask(id: number): void {
    const idx = this.selectedTaskIds.indexOf(id);
    if (idx > -1) {
      this.selectedTaskIds.splice(idx, 1);
    } else {
      this.selectedTaskIds.push(id);
    }
  }

  isAllSelected(): boolean {
    return (
      this.filteredTasks.length > 0 &&
      this.selectedTaskIds.length === this.filteredTasks.length
    );
  }

  isSomeSelected(): boolean {
    return (
      this.selectedTaskIds.length > 0 &&
      this.selectedTaskIds.length < this.filteredTasks.length
    );
  }

  // Inline Quick Updates
  onStatusChangeInline(task: Task, newStatus: string): void {
    this.taskService.updateTaskStatus(task.id, newStatus as any, 'Shakthi').subscribe({
      next: () => {
        this.loadTasks();
        this.notificationService.showSuccessToast(`Task status updated to ${newStatus}.`, 'Updated');
      }
    });
  }

  onPriorityChangeInline(task: Task, newPriority: string): void {
    this.taskService.updateTaskPriority(task.id, newPriority).subscribe({
      next: () => {
        this.loadTasks();
        this.notificationService.showSuccessToast(`Task priority updated to ${newPriority}.`, 'Updated');
      }
    });
  }

  // Kanban Drag and Drop
  onCardDropped(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      // The cdkDropList [id] is the status label itself, so use it directly
      const newStatus = event.container.id as Task['status'];

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      this.taskService.updateTaskStatusHttp(task.id, newStatus).subscribe({
        next: () => {
          this.loadTasks();
        }
      });
    }
  }

  // Create Task Modal Operations
  openCreateTaskDialog(): void {
    // Reset the form
    this.isTaskFormSubmitted = false;
    this.newTaskData = {
      title: '',
      description: '',
      branch: '',
      role: '',
      assignee: { name: '', avatar: '/assets/images/profile/user-1.jpg' },
      priority: 'Low',
      dueDate: ''
    };
    this.availableAssignees = [];

    this.dialog.open(this.createTaskDialog, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'create-task-dialog-panel',
      autoFocus: false
    });
  }

  saveNewTask(): void {
    this.isTaskFormSubmitted = true;
    if (!this.newTaskData.title || !this.newTaskData.dueDate || !this.newTaskData.assignee) {
      // Basic validation: Title, Due Date and Assignee are required
      this.notificationService.showErrorToast('Please fill out required fields.', 'Validation Error');
      return;
    }

    let formattedDueDate = this.newTaskData.dueDate;
    if (this.newTaskData.dueDate instanceof Date) {
      formattedDueDate = this.newTaskData.dueDate.toISOString().substring(0, 10);
    }

    const payload = {
      title: this.newTaskData.title,
      description: this.newTaskData.description,
      priority: this.newTaskData.priority.toUpperCase(),
      dueDate: formattedDueDate,
      assignedToId: this.newTaskData.assignee?.id || null,
      branchId: this.newTaskData.branch || null
    };

    this.isLoading = true;
    this.taskService.createTaskApi(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccessToast('Task created successfully.', 'Created');
        this.dialog.closeAll();
        this.loadTasks(); // Reload the tasks table
      },
      error: (err) => {
        console.error('Failed to create task:', err);
        this.isLoading = false;
        this.notificationService.showErrorToast('Failed to create task.', 'Error');
      }
    });
  }

  // Side Drawer Operations
  openCreateDrawer(): void {
    this.drawerMode = 'create';
    this.editingTask = null;
    this.drawerTaskData = {
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      category: 'Development',
      tags: [],
      assignee: this.members[0],
      reporter: this.members[0],
      dueDate: new Date().toISOString().substring(0, 10),
      estimatedTime: '2h',
      createdBy: 'Shakthi'
    };
    this.timelineStream = [];
    this.isDrawerOpen = true;
  }

  openEditDrawer(task: Task): void {
    this.drawerMode = 'edit';
    this.editingTask = task;
    this.drawerTaskData = JSON.parse(JSON.stringify(task)); // fallback deep copy
    this.isDrawerOpen = true;

    this.taskService.getTaskById(task.id).subscribe({
      next: (fullTask) => {
        if (fullTask) {
          this.drawerTaskData = JSON.parse(JSON.stringify(fullTask));
          this.buildTimelineStream();
        }
      },
      error: (err) => {
        console.error('Failed to load task details', err);
      }
    });
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.editingTask = null;
  }

  saveDrawerChanges(): void {
    if (!this.drawerTaskData.title?.trim()) {
      this.notificationService.showErrorToast('Task title is required.', 'Validation Error');
      return;
    }

    this.isLoading = true;
    if (this.drawerMode === 'create') {
      this.taskService.createTask(this.drawerTaskData as Omit<Task, 'id' | 'createdDate' | 'lastUpdated' | 'activities' | 'comments' | 'attachments'>).subscribe({
        next: () => {
          this.isLoading = false;
          this.closeDrawer();
          this.loadTasks();
          this.notificationService.showSuccessToast('Task created successfully.', 'Success');
        },
        error: () => {
          this.isLoading = false;
          this.notificationService.showErrorToast('Failed to create task.', 'Error');
        }
      });
    } else if (this.drawerMode === 'edit' && this.editingTask) {
      const mergedTask = {
        ...this.editingTask,
        ...this.drawerTaskData
      } as Task;

      this.taskService.updateTask(mergedTask, 'Shakthi').subscribe({
        next: () => {
          this.isLoading = false;
          this.closeDrawer();
          this.loadTasks();
          this.notificationService.showSuccessToast('Task updated successfully.', 'Success');
        },
        error: () => {
          this.isLoading = false;
          this.notificationService.showErrorToast('Failed to update task.', 'Error');
        }
      });
    }
  }

  updateDrawerPriority(newPriority: string): void {
    if (!this.editingTask) return;
    const taskId = this.editingTask.id;
    this.isLoading = true;

    this.taskService.updateTaskPriority(taskId, newPriority).subscribe({
      next: () => {
        this.drawerTaskData.priority = newPriority;
        if (this.editingTask) {
          this.editingTask.priority = newPriority as any;
        }

        this.taskService.getTaskActivity(taskId).subscribe({
          next: (activities) => {
            this.drawerTaskData.activities = activities;
            this.buildTimelineStream();
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });

        this.loadTasks();
        this.notificationService.showSuccessToast(`Priority updated to ${newPriority}.`, 'Success');
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showErrorToast('Failed to update task priority.', 'Error');
      }
    });
  }

  updateDrawerStatus(newStatus: string): void {
    if (!this.editingTask) return;
    const taskId = this.editingTask.id;
    this.isLoading = true;

    this.taskService.updateTaskStatusHttp(taskId, newStatus).subscribe({
      next: () => {
        this.drawerTaskData.status = newStatus;
        if (this.editingTask) {
          this.editingTask.status = newStatus as any;
        }

        this.taskService.getTaskActivity(taskId).subscribe({
          next: (activities) => {
            this.drawerTaskData.activities = activities;
            this.buildTimelineStream();
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });

        this.loadTasks();
        this.notificationService.showSuccessToast(`Status updated to ${newStatus}.`, 'Success');
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showErrorToast('Failed to update task status.', 'Error');
      }
    });
  }

  updateDrawerAssignee(member: any): void {
    if (!this.editingTask) return;
    const taskId = this.editingTask.id;
    this.isLoading = true;

    const assignedToId = member.id || (this.members.indexOf(member) + 1);

    this.taskService.updateTaskAssignee(taskId, assignedToId).subscribe({
      next: () => {
        this.drawerTaskData.assignee = member;
        if (this.editingTask) {
          this.editingTask.assignee = member;
        }

        this.taskService.getTaskActivity(taskId).subscribe({
          next: (activities) => {
            this.drawerTaskData.activities = activities;
            this.buildTimelineStream();
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });

        this.loadTasks();
        this.notificationService.showSuccessToast(`Assignee updated.`, 'Success');
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showErrorToast('Failed to update assignee.', 'Error');
      }
    });
  }

  updateDrawerDueDate(dateValue: any): void {
    if (!this.editingTask || !dateValue) return;
    const taskId = this.editingTask.id;
    this.isLoading = true;

    const formattedDate = new Date(dateValue).toISOString().substring(0, 10);

    this.taskService.updateTaskDueDate(taskId, formattedDate).subscribe({
      next: () => {
        this.drawerTaskData.dueDate = formattedDate;
        if (this.editingTask) {
          this.editingTask.dueDate = formattedDate;
        }

        this.taskService.getTaskActivity(taskId).subscribe({
          next: (activities) => {
            this.drawerTaskData.activities = activities;
            this.buildTimelineStream();
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });

        this.loadTasks();
        this.notificationService.showSuccessToast(`Due Date updated.`, 'Success');
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showErrorToast('Failed to update due date.', 'Error');
      }
    });
  }

  // Tag Management in Drawer
  addTag(input: HTMLInputElement): void {
    const val = input.value.trim();
    if (val && this.drawerTaskData.tags) {
      if (!this.drawerTaskData.tags.includes(val)) {
        this.drawerTaskData.tags.push(val);
      }
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    if (this.drawerTaskData.tags) {
      this.drawerTaskData.tags = this.drawerTaskData.tags.filter((t) => t !== tag);
    }
  }

  // Comments & Collaboration inside Drawer
  addComment(): void {
    if (!this.newCommentText.trim() || !this.editingTask) return;

    this.taskService.addComment(this.editingTask.id, this.newCommentText, 'Shakthi').subscribe({
      next: (updated) => {
        this.editingTask = updated;
        this.drawerTaskData.comments = updated.comments;
        this.drawerTaskData.activities = updated.activities;
        this.newCommentText = '';
        this.buildTimelineStream();
        this.loadTasks();
      }
    });
  }

  deleteComment(commentId: number): void {
    if (!this.editingTask) return;

    this.notificationService.showErrorPopup(
      'Are you sure you want to delete this comment?',
      'Delete Comment',
      'Delete'
    ).subscribe((confirmed) => {
      if (confirmed && this.editingTask) {
        this.taskService.deleteComment(this.editingTask.id, commentId, 'Shakthi').subscribe({
          next: (updated) => {
            this.editingTask = updated;
            this.drawerTaskData.comments = updated.comments;
            this.drawerTaskData.activities = updated.activities;
            this.buildTimelineStream();
            this.loadTasks();
          }
        });
      }
    });
  }

  startEditComment(comment: TaskComment): void {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.text;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  saveCommentEdit(commentId: number): void {
    if (!this.editCommentText.trim() || !this.editingTask) return;

    this.taskService.editComment(this.editingTask.id, commentId, this.editCommentText, 'Shakthi').subscribe({
      next: (updated) => {
        this.editingTask = updated;
        this.drawerTaskData.comments = updated.comments;
        this.drawerTaskData.activities = updated.activities;
        this.editingCommentId = null;
        this.editCommentText = '';
        this.buildTimelineStream();
        this.loadTasks();
      }
    });
  }

  // Attachment operations
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.editingTask) return;

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    // Reading file as a mock preview url (Base64)
    const reader = new FileReader();
    reader.onload = () => {
      const mockAttachment = {
        name: file.name,
        size: sizeStr,
        type: file.type.startsWith('image/') ? 'image' : 'doc',
        url: reader.result as string
      };

      this.taskService.addAttachment(this.editingTask!.id, mockAttachment, 'Shakthi').subscribe({
        next: (updated) => {
          this.editingTask = updated;
          this.drawerTaskData.attachments = updated.attachments;
          this.drawerTaskData.activities = updated.activities;
          this.buildTimelineStream();
          this.loadTasks();
          this.notificationService.showSuccessToast('Attachment uploaded.', 'Success');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  deleteAttachment(attachmentId: number): void {
    if (!this.editingTask) return;

    this.taskService.deleteAttachment(this.editingTask.id, attachmentId, 'Shakthi').subscribe({
      next: (updated) => {
        this.editingTask = updated;
        this.drawerTaskData.attachments = updated.attachments;
        this.drawerTaskData.activities = updated.activities;
        this.buildTimelineStream();
        this.loadTasks();
        this.notificationService.showSuccessToast('Attachment deleted.', 'Deleted');
      }
    });
  }

  // Build Chronological Timeline (Activities + Comments)
  buildTimelineStream(): void {
    if (!this.drawerTaskData) {
      this.timelineStream = [];
      return;
    }

    const stream: any[] = [];

    // Add activities
    if (this.drawerTaskData.activities) {
      this.drawerTaskData.activities.forEach((act) => {
        stream.push({
          type: 'activity',
          date: act.date,
          user: act.user,
          action: act.action,
          rawAction: act.rawAction,
          data: act
        });
      });
    }

    // Add comments
    if (this.drawerTaskData.comments) {
      this.drawerTaskData.comments.forEach((com) => {
        stream.push({
          type: 'comment',
          date: com.date,
          user: com.author,
          avatar: com.avatar,
          text: com.text,
          rawAction: 'COMMENT_ADDED',
          data: com
        });
      });
    }

    // Sort chronologically (latest first or oldest first? Chronological = oldest first, but workspace feeds usually have latest or oldest. Let's sort oldest first for full chat history style, or latest first. Let's do latest first so newest events are immediately visible!).
    stream.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.timelineStream = stream;
  }

  getTimelineEventIcon(rawAction: string): string {
    if (!rawAction) return 'activity';
    switch (rawAction.toUpperCase()) {
      case 'COMMENT_ADDED':
        return 'message-dots';
      case 'STATUS_CHANGED':
        return 'circle-dot';
      case 'PRIORITY_CHANGED':
        return 'flag';
      case 'ASSIGNEE_CHANGED':
        return 'user-check';
      case 'ATTACHMENT_ADDED':
      case 'ATTACHMENT_DELETED':
        return 'paperclip';
      case 'TASK_CREATED':
      case 'CREATED':
        return 'plus';
      default:
        return 'activity';
    }
  }

  getTimelineEventColorClass(rawAction: string): string {
    if (!rawAction) return 'marker-default';
    switch (rawAction.toUpperCase()) {
      case 'COMMENT_ADDED':
        return 'marker-comment';
      case 'STATUS_CHANGED':
        return 'marker-status';
      case 'PRIORITY_CHANGED':
        return 'marker-priority';
      case 'ASSIGNEE_CHANGED':
        return 'marker-assignee';
      case 'ATTACHMENT_ADDED':
      case 'ATTACHMENT_DELETED':
        return 'marker-attachment';
      default:
        return 'marker-default';
    }
  }

  getPriorityIcon(priority: string): string {
    if (!priority) return 'flag';
    switch (priority.toLowerCase()) {
      case 'low':
        return 'flag';
      case 'medium':
        return 'flag';
      case 'high':
        return 'flag';
      default:
        return 'flag';
    }
  }

  getPriorityColorClass(priority: string): string {
    if (!priority) return 'text-muted';
    switch (priority.toLowerCase()) {
      case 'low':
        return 'text-success';
      case 'medium':
        return 'text-warning';
      case 'high':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  }

  getStatusIcon(status: string): string {
    if (!status) return 'circle';
    switch (status.toLowerCase()) {
      case 'to do':
      case 'todo':
      case 'pending':
        return 'circle-dot';
      case 'in progress':
        return 'loader';
      case 'review':
        return 'eye';
      case 'completed':
        return 'circle-check';
      case 'blocked':
      case 'rejected':
      case 'cancelled':
        return 'circle-x';
      case 'overdue':
        return 'alert-triangle';
      default:
        return 'circle';
    }
  }

  getStatusColorClass(status: string): string {
    if (!status) return 'text-muted';
    switch (status.toLowerCase()) {
      case 'to do':
      case 'todo':
      case 'pending':
        return 'text-muted';
      case 'in progress':
        return 'text-primary';
      case 'review':
        return 'text-warning';
      case 'completed':
        return 'text-success';
      case 'blocked':
      case 'rejected':
      case 'cancelled':
      case 'overdue':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  }

  // Bulk Actions
  bulkDelete(): void {
    if (this.selectedTaskIds.length === 0) return;

    this.notificationService.showErrorPopup(
      `Are you sure you want to delete the ${this.selectedTaskIds.length} selected tasks?`,
      'Confirm Bulk Deletion',
      'Delete'
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.isLoading = true;
        this.taskService.bulkDeleteTasks(this.selectedTaskIds).subscribe({
          next: () => {
            this.selectedTaskIds = [];
            this.loadTasks();
            this.notificationService.showSuccessToast('Selected tasks deleted.', 'Success');
          }
        });
      }
    });
  }

  bulkUpdateStatus(status: string): void {
    if (this.selectedTaskIds.length === 0) return;
    this.isLoading = true;
    this.taskService.bulkUpdateTasks(this.selectedTaskIds, { status: status as any }, 'Shakthi').subscribe({
      next: () => {
        this.selectedTaskIds = [];
        this.loadTasks();
        this.notificationService.showSuccessToast('Status updated for selected tasks.', 'Updated');
      }
    });
  }

  bulkUpdatePriority(priority: string): void {
    if (this.selectedTaskIds.length === 0) return;
    this.isLoading = true;
    this.taskService.bulkUpdateTasks(this.selectedTaskIds, { priority: priority as any }, 'Shakthi').subscribe({
      next: () => {
        this.selectedTaskIds = [];
        this.loadTasks();
        this.notificationService.showSuccessToast('Priority updated for selected tasks.', 'Updated');
      }
    });
  }

  bulkUpdateAssignee(member: typeof MOCK_MEMBERS[0]): void {
    if (this.selectedTaskIds.length === 0) return;
    this.isLoading = true;
    this.taskService.bulkUpdateTasks(this.selectedTaskIds, { assignee: member }, 'Shakthi').subscribe({
      next: () => {
        this.selectedTaskIds = [];
        this.loadTasks();
        this.notificationService.showSuccessToast('Assignee updated for selected tasks.', 'Updated');
      }
    });
  }

  compareMembers(c1: any, c2: any): boolean {
    return c1 && c2 ? c1.name === c2.name : c1 === c2;
  }

  parseDate(dateString: string | undefined): Date | null {
    return dateString ? new Date(dateString) : null;
  }

  getDueDateLabel(): string {
    if (this.filterDueDate === 'Custom') {
      if (this.customDueDateStart && this.customDueDateEnd) {
        return `${this.customDueDateStart.toLocaleDateString()} - ${this.customDueDateEnd.toLocaleDateString()}`;
      } else if (this.customDueDateStart) {
        return `From ${this.customDueDateStart.toLocaleDateString()}`;
      }
      return 'Custom Range';
    }
    if (this.filterDueDate === 'Overdue') return 'Overdue';
    if (this.filterDueDate === 'Today') return 'Today';
    if (this.filterDueDate === 'Week') return 'This Week';
    return 'All';
  }

  getCreateDateLabel(): string {
    if (this.filterCreateDate === 'Custom') {
      if (this.customCreateDateStart && this.customCreateDateEnd) {
        return `${this.customCreateDateStart.toLocaleDateString()} - ${this.customCreateDateEnd.toLocaleDateString()}`;
      } else if (this.customCreateDateStart) {
        return `From ${this.customCreateDateStart.toLocaleDateString()}`;
      }
      return 'Custom Range';
    }
    if (this.filterCreateDate === 'Today') return 'Today';
    if (this.filterCreateDate === 'Week') return 'Last 7 Days';
    return 'All';
  }

  onCustomDueDateChange() {
    if (this.customDueDateStart && this.customDueDateEnd) {
      this.filterDueDate = 'Custom';
      this.loadTasks();
    }
  }

  onCustomCreateDateChange() {
    if (this.customCreateDateStart && this.customCreateDateEnd) {
      this.filterCreateDate = 'Custom';
      this.loadTasks();
    }
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchText || 
      (this.filterStatus && this.filterStatus !== 'All') || 
      (this.filterPriority && this.filterPriority !== 'All') || 
      this.filterDueDate || 
      this.filterCreateDate
    );
  }

  resetFilters(): void {
    this.searchText = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterDueDate = '';
    this.customDueDateStart = null;
    this.customDueDateEnd = null;
    this.filterCreateDate = '';
    this.customCreateDateStart = null;
    this.customCreateDateEnd = null;
    this.loadTasks();
  }

  onDueDateChange(date: any): void {
    if (date) {
      let d: Date;
      if (typeof date === 'string') d = new Date(date);
      else d = date.value || date;
      const iso = d.toISOString();
      this.drawerTaskData.dueDate = iso.substring(0, 10);
    }
  }

  // Task Bundles Methods
  openCreateBundleDialog(): void {
    this.newBundleData = {
      id: 0,
      name: '',
      description: '',
      role: '',
      status: 'ACTIVE',
      scheduleType: 'DAILY',
      executionTime: '',
      startDate: new Date().toISOString().substring(0, 10),
      tasks: [
        { title: '', description: '', priority: 'Medium', dueDays: 0 }
      ]
    };
    this.dialog.open(this.createBundleDialog, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'responsive-dialog',
      autoFocus: false
    });
  }

  openManageBundlesDialog(): void {
    this.loadTaskBundles();
    this.dialog.open(this.manageBundlesDialog, {
      width: '1000px',
      maxWidth: '95vw',
      panelClass: 'responsive-dialog',
      autoFocus: false
    });
  }

  editBundle(bundle: TaskBundle): void {
    this.taskService.getTaskBundleById(bundle.id).subscribe({
      next: (response) => {
        // Map backend response to newBundleData
        this.newBundleData = {
          id: response.id,
          name: response.name,
          description: response.description || '',
          role: response.role?.name || bundle.role || '',
          status: response.status || 'ACTIVE',
          scheduleType: response.schedule?.scheduleType || 'DAILY',
          executionTime: response.schedule?.executionTime ? response.schedule.executionTime.substring(0, 5) : '',
          startDate: response.schedule?.startDate ? response.schedule.startDate : new Date().toISOString().substring(0, 10),
          executionDay: response.schedule?.executionDay,
          executionDayOfMonth: response.schedule?.executionDayOfMonth,
          tasks: (response.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            priority: t.priority ? t.priority.charAt(0) + t.priority.slice(1).toLowerCase() : 'Medium',
            dueDays: t.defaultDueDays || 0
          }))
        };

        if (this.newBundleData.tasks.length === 0) {
          this.newBundleData.tasks.push({ title: '', description: '', priority: 'Medium', dueDays: 0 });
        }

        this.dialog.open(this.createBundleDialog, {
          width: '900px',
          maxWidth: '95vw',
          panelClass: 'responsive-dialog',
          autoFocus: false
        });
      },
      error: () => {
        this.notificationService.showErrorToast('Failed to load bundle details.', 'Error');
      }
    });
  }

  addBundleTask(): void {
    this.newBundleData.tasks.push({ title: '', description: '', priority: 'Medium', dueDays: 0 });
  }

  cyclePriority(task: BundleTask): void {
    const priorities = ['Low', 'Medium', 'High'];
    const currentIndex = priorities.indexOf(task.priority || 'Medium');
    task.priority = priorities[(currentIndex + 1) % priorities.length] as 'Low' | 'Medium' | 'High';
  }

  removeBundleTask(index: number): void {
    this.newBundleData.tasks.splice(index, 1);
  }

  saveBundle(): void {
    if (!this.newBundleData.name || !this.newBundleData.role || this.newBundleData.tasks.length === 0) {
      this.notificationService.showErrorToast('Please fill all required fields.', 'Validation Error');
      return;
    }

    const role = this.availableRoles.find(r => r.name === this.newBundleData.role);
    const roleId = role ? role.id : 2; // fallback to 2 if not found

    const payload: any = {
      name: this.newBundleData.name,
      description: this.newBundleData.description || null,
      roleId: roleId,
      status: this.newBundleData.status || 'ACTIVE',
      schedule: {
        executionTime: this.newBundleData.executionTime ? (this.newBundleData.executionTime.length === 5 ? this.newBundleData.executionTime + ':00' : this.newBundleData.executionTime) : '09:00:00',
      },
      tasks: this.newBundleData.tasks.map((t, index) => {
        const mappedTask: any = {
          title: t.title,
          description: t.description || null,
          priority: t.priority?.toUpperCase() || 'MEDIUM',
          taskOrder: index + 1,
          defaultDueDays: t.dueDays || 0
        };
        if (t.id) {
          mappedTask.id = t.id;
        }
        return mappedTask;
      })
    };

    if (this.newBundleData.startDate) {
      const d = new Date(this.newBundleData.startDate);
      payload.schedule.startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      const d = new Date();
      payload.schedule.startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (this.newBundleData.scheduleType === 'WEEKLY') {
      payload.schedule.scheduleType = 'WEEKLY';
      payload.schedule.executionDay = this.newBundleData.executionDay || 'MONDAY';
    } else if (this.newBundleData.scheduleType === 'MONTHLY') {
      payload.schedule.scheduleType = 'MONTHLY';
      payload.schedule.executionDayOfMonth = this.newBundleData.executionDayOfMonth || 1;
    } else if (this.newBundleData.scheduleType === 'ONE_TIME') {
      payload.schedule.scheduleType = 'ONE_TIME';
      payload.schedule.oneTimeExecutionDate = `${payload.schedule.startDate}T${payload.schedule.executionTime}`;
      delete payload.schedule.startDate;
    } else {
      payload.schedule.scheduleType = 'DAILY';
    }

    if (this.newBundleData.id && this.newBundleData.id > 0) {
      this.taskService.updateTaskBundle(this.newBundleData.id, payload).subscribe({
        next: () => {
          this.notificationService.showSuccessToast('Task Bundle has been successfully updated.', 'Bundle Updated');
          this.dialog.closeAll();
          this.loadTaskBundles();
        },
        error: (err) => {
          console.error('Failed to update bundle', err);
          this.notificationService.showErrorToast('Failed to update bundle.', 'Error');
        }
      });
    } else {
      this.taskService.createTaskBundle(payload).subscribe({
        next: () => {
          this.notificationService.showSuccessToast('Task Bundle has been successfully created.', 'Bundle Created');
          this.dialog.closeAll();
          this.loadTaskBundles();
        },
        error: (err) => {
          console.error('Failed to create bundle', err);
          this.notificationService.showErrorToast('Failed to create bundle.', 'Error');
        }
      });
    }
  }

  deleteBundle(bundle: TaskBundle): void {
    this.notificationService.showErrorPopup('Are you sure you want to delete this bundle?', 'Delete Bundle', 'Delete').subscribe((confirmed) => {
      if (confirmed) {
        this.taskService.deleteTaskBundle(bundle.id).subscribe({
          next: () => {
            this.notificationService.showSuccessToast('Bundle deleted successfully.', 'Deleted');
            this.loadTaskBundles();
          },
          error: (err) => {
            console.error('Failed to delete bundle', err);
            this.notificationService.showErrorToast('Failed to delete bundle.', 'Error');
          }
        });
      }
    });
  }

  toggleBundleStatus(bundle: TaskBundle): void {
    const currentStatus = bundle.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    if (newStatus === 'ACTIVE') {
      this.taskService.activateTaskBundle(bundle.id).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(`Bundle activated successfully.`, 'Status Updated');
          this.loadTaskBundles();
        },
        error: () => {
          this.notificationService.showErrorToast(`Failed to activate bundle.`, 'Error');
        }
      });
    } else {
      this.taskService.deactivateTaskBundle(bundle.id).subscribe({
        next: () => {
          this.notificationService.showSuccessToast(`Bundle deactivated successfully.`, 'Status Updated');
          this.loadTaskBundles();
        },
        error: () => {
          this.notificationService.showErrorToast(`Failed to deactivate bundle.`, 'Error');
        }
      });
    }
  }

  openExecuteBundleDialog(bundle: TaskBundle): void {
    this.selectedBundleToExecute = bundle;
    this.dialog.open(this.executeBundleDialog, {
      width: '400px',
      panelClass: ['responsive-dialog', 'custom-rounded-dialog'],
      autoFocus: false
    });
  }

  confirmExecuteBundle(): void {
    if (!this.selectedBundleToExecute) return;
    
    this.taskService.executeTaskBundleNow(this.selectedBundleToExecute.id).subscribe({
      next: () => {
        this.notificationService.showSuccessToast(`Bundle "${this.selectedBundleToExecute?.name}" executed successfully.`, 'Execution Started');
        this.dialog.closeAll();
        this.selectedBundleToExecute = null;
      },
      error: (err) => {
        console.error('Failed to execute bundle', err);
        this.notificationService.showErrorToast('Failed to execute bundle. Please try again.', 'Execution Error');
      }
    });
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'UN';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getRelativeTime(dateInput: any): string {
    if (!dateInput) return 'Just now';
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}
