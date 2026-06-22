import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

export interface TaskV2 {
  id: string;
  title: string;
  bundle: string;
  bundleColor: string; // hex or class
  tags: string[];
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';
  dueDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD for timeline
  assignees: { initials: string; bgColor: string }[];
  progress: number;
  est: string;
  subtasks?: TaskV2[];
  expanded?: boolean;
}

@Component({
  selector: 'app-tasks-v2',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MatDialogModule],
  templateUrl: './tasks-v2.component.html',
  styleUrl: './tasks-v2.component.scss'
})
export class TasksV2Component implements OnInit {

  activeView: 'list' | 'board' | 'calendar' | 'timeline' | 'table' = 'list';
  
  // Drawer State
  @ViewChild('taskDetailModal') taskDetailModal!: TemplateRef<any>;
  selectedTask: TaskV2 | null = null;
  drawerTab: 'subtasks' | 'comments' | 'dependencies' | 'activity' = 'subtasks';

  constructor(private dialog: MatDialog) {}

  // Accordion State
  expandedGroups: Record<string, boolean> = {
    'To Do': true,
    'In Progress': true,
    'In Review': true,
    'Done': true,
    'Blocked': true
  };

  // Board State
  creatingSubtaskFor: string | null = null;
  creatingTaskForDate: number | null = null;
  boardColumns: Record<string, TaskV2[]> = {};
  
  // Filters
  searchText = '';
  selectedStatus = 'All';
  selectedPriority = 'All';
  selectedBundle = 'All';

  statuses: TaskV2['status'][] = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];
  priorities: TaskV2['priority'][] = ['Low', 'Normal', 'High', 'Urgent'];
  
  tasks: TaskV2[] = [
    {
      id: 'ATL-103',
      title: 'ECG interpretation practice — 50 strips',
      bundle: 'USMLE Step 1 Prep',
      bundleColor: '#38bdf8',
      tags: ['practice'],
      priority: 'Normal',
      status: 'To Do',
      dueDate: '2026-06-28',
      startDate: '2026-06-21',
      assignees: [{ initials: 'LH', bgColor: '#e0f2fe' }],
      progress: 0,
      est: '5h',
      expanded: false,
      subtasks: [
        {
          id: 'ATL-103-1',
          title: 'Review first 25 strips',
          status: 'To Do',
          priority: 'Normal',
          tags: ['practice'],
          bundle: 'USMLE Step 1 Prep',
          bundleColor: '#38bdf8',
          assignees: [{ initials: 'LH', bgColor: '#e0f2fe' }],
          dueDate: '2026-06-23',
          progress: 0,
          est: '2h',
          expanded: false,
          subtasks: [
             {
                id: 'ATL-103-1-1',
                title: 'Review remaining 25 strips',
                status: 'To Do',
                priority: 'High',
                tags: ['practice'],
                bundle: 'USMLE Step 1 Prep',
                bundleColor: '#38bdf8',
                assignees: [{ initials: 'LH', bgColor: '#e0f2fe' }],
                dueDate: '2026-06-26',
                progress: 0,
                est: '3h',
                expanded: false,
                subtasks: [
                   {
                      id: 'ATL-103-1-1-1',
                      title: 'Identify arrhythmias',
                      status: 'To Do',
                      priority: 'High',
                      tags: ['arrhythmia'],
                      bundle: 'USMLE Step 1 Prep',
                      bundleColor: '#38bdf8',
                      assignees: [{ initials: 'LH', bgColor: '#e0f2fe' }],
                      dueDate: '2026-06-22',
                      progress: 0,
                      est: '1h'
                   }
                ]
             }
          ]
        }
      ]
    },
    {
      id: 'ATL-108',
      title: 'Pharmacology spaced repetition',
      bundle: 'USMLE Step 1 Prep',
      bundleColor: '#3b82f6',
      tags: ['pharm', 'anki'],
      priority: 'Low',
      status: 'To Do',
      dueDate: '2026-07-21',
      startDate: '2026-06-24',
      assignees: [{ initials: 'LH', bgColor: '#bae6fd' }],
      progress: 0,
      est: '15h'
    },
    {
      id: 'ATL-104',
      title: 'Internal Medicine rotation logbook',
      bundle: 'Clinical Rotations',
      bundleColor: '#f97316',
      tags: ['clinical', 'logbook'],
      priority: 'Normal',
      status: 'In Progress',
      dueDate: '2026-07-05',
      startDate: '2026-06-08',
      assignees: [
        { initials: 'KA', bgColor: '#fed7aa' },
        { initials: 'NF', bgColor: '#bfdbfe' }
      ],
      progress: 45,
      est: '20h'
    },
    {
      id: 'ATL-107',
      title: 'Manuscript revision — reviewer comments',
      bundle: 'Research & Publications',
      bundleColor: '#a855f7',
      tags: ['paper', 'revision'],
      priority: 'Urgent',
      status: 'In Progress',
      dueDate: '2026-06-24',
      startDate: '2026-06-18',
      assignees: [
        { initials: 'SM', bgColor: '#e9d5ff' },
        { initials: 'NF', bgColor: '#bfdbfe' }
      ],
      progress: 60,
      est: '10h'
    },
    {
      id: 'ATL-102',
      title: 'Draft personal statement v1',
      bundle: 'Residency Applications 2026',
      bundleColor: '#22c55e',
      tags: ['ERAS', 'writing'],
      priority: 'Urgent',
      status: 'In Review',
      dueDate: '2026-06-22',
      startDate: '2026-06-15',
      assignees: [{ initials: 'KA', bgColor: '#fed7aa' }],
      progress: 80,
      est: '12h'
    },
    {
      id: 'ATL-109',
      title: 'Surgery rotation case presentation',
      bundle: 'Clinical Rotations',
      bundleColor: '#f97316',
      tags: ['clinical', 'presentation'],
      priority: 'Normal',
      status: 'In Review',
      dueDate: '2026-06-22',
      startDate: '2026-06-20',
      assignees: [{ initials: 'KA', bgColor: '#fed7aa' }],
      progress: 85,
      est: '6h'
    },
    {
      id: 'ATL-106',
      title: 'Mock interview session',
      bundle: 'Residency Applications 2026',
      bundleColor: '#22c55e',
      tags: ['interview'],
      priority: 'High',
      status: 'Done',
      dueDate: '2026-06-19',
      startDate: '2026-06-12',
      assignees: [
        { initials: 'QI', bgColor: '#d8b4fe' },
        { initials: 'KA', bgColor: '#fed7aa' }
      ],
      progress: 100,
      est: '2h'
    },
    {
      id: 'ATL-110',
      title: 'Letter of recommendation requests',
      bundle: 'Residency Applications 2026',
      bundleColor: '#22c55e',
      tags: ['LOR'],
      priority: 'High',
      status: 'Done',
      dueDate: '2026-06-16',
      startDate: '2026-06-02',
      assignees: [{ initials: 'KA', bgColor: '#fed7aa' }],
      progress: 100,
      est: '3h'
    },
    {
      id: 'ATL-105',
      title: 'Submit IRB amendment',
      bundle: 'Research & Publications',
      bundleColor: '#a855f7',
      tags: ['research', 'compliance'],
      priority: 'High',
      status: 'Blocked',
      dueDate: '2026-06-23',
      startDate: '2026-06-17',
      assignees: [{ initials: 'SM', bgColor: '#e9d5ff' }],
      progress: 30,
      est: '4h'
    }
  ];

  // Calendar setup (Mock for June 2026)
  calendarDays: { date: number; currentMonth: boolean; tasks: TaskV2[] }[] = [];
  
  // Timeline setup
  timelineDays: number[] = Array.from({length: 30}, (_, i) => i + 1); // June 1-30

  ngOnInit(): void {
    this.generateCalendar();
    this.updateBoardColumns();
  }

  setView(view: typeof this.activeView) {
    this.activeView = view;
  }

  get filteredTasks(): TaskV2[] {
    let result = this.tasks;
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    if (this.selectedStatus !== 'All') {
      result = result.filter(t => t.status === this.selectedStatus);
    }
    if (this.selectedPriority !== 'All') {
      result = result.filter(t => t.priority === this.selectedPriority);
    }
    return result;
  }

  updateBoardColumns(): void {
    const cols: Record<string, TaskV2[]> = {};
    this.statuses.forEach(s => cols[s] = []);
    this.filteredTasks.forEach(t => {
      if (!cols[t.status]) cols[t.status] = [];
      cols[t.status].push(t);
    });
    this.boardColumns = cols;
  }

  getTasksByStatus(status: TaskV2['status']): TaskV2[] {
    return this.filteredTasks.filter(t => t.status === status);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'Urgent': return '#ef4444'; // red-500
      case 'High': return '#f59e0b'; // amber-500
      case 'Normal': return '#3b82f6'; // blue-500
      case 'Low': return '#64748b'; // slate-500
      default: return '#64748b';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'To Do': return '#cbd5e1'; // slate-300
      case 'In Progress': return '#38bdf8'; // sky-400
      case 'In Review': return '#fbbf24'; // amber-400
      case 'Done': return '#4ade80'; // green-400
      case 'Blocked': return '#f87171'; // red-400
      default: return '#cbd5e1';
    }
  }

  // --- Calendar logic ---
  generateCalendar() {
    // June 2026 starts on Monday. 
    // Sunday is May 31 (1 prev month day).
    // June has 30 days.
    const days = [];
    days.push({ date: 31, currentMonth: false, tasks: [] }); // May 31
    for (let i = 1; i <= 30; i++) {
      const dateStr = `2026-06-${i.toString().padStart(2, '0')}`;
      days.push({
        date: i,
        currentMonth: true,
        tasks: this.tasks.filter(t => t.dueDate === dateStr)
      });
    }
    // padding at end to complete grid (up to 35)
    for (let i = 1; i <= 4; i++) {
      days.push({ date: i, currentMonth: false, tasks: [] });
    }
    this.calendarDays = days;
  }

  // --- Timeline logic ---
  getTimelineItemStyle(task: TaskV2): any {
    // Assuming timeline starts at June 1, 2026.
    const startDay = task.startDate ? parseInt(task.startDate.split('-')[2]) : 1;
    const endDay = parseInt(task.dueDate.split('-')[2]);
    const duration = Math.max(1, endDay - startDay + 1);
    
    // Each day column is, say, 40px wide in CSS. We'll use grid columns.
    return {
      'grid-column': `${startDay} / span ${duration}`,
      'background-color': this.getTimelineBarColor(task.status),
      'color': this.getTimelineTextColor(task.status)
    };
  }
  
  getTimelineBarColor(status: string): string {
     switch (status) {
      case 'To Do': return '#f1f5f9'; // slate-100
      case 'In Progress': return '#e0f2fe'; // sky-100
      case 'In Review': return '#fef3c7'; // amber-100
      case 'Done': return '#dcfce3'; // green-100
      case 'Blocked': return '#fee2e2'; // red-100
      default: return '#f1f5f9';
    }
  }

  getTimelineTextColor(status: string): string {
     switch (status) {
      case 'To Do': return '#475569';
      case 'In Progress': return '#0284c7';
      case 'In Review': return '#d97706';
      case 'Done': return '#16a34a';
      case 'Blocked': return '#dc2626';
      default: return '#475569';
    }
  }

  // --- Drawer logic ---
  openTask(task: TaskV2) {
    this.selectedTask = task;
    this.drawerTab = 'subtasks';
    this.dialog.open(this.taskDetailModal, {
      panelClass: 'task-v2-dialog-panel',
      autoFocus: false,
      maxWidth: '100vw',
      maxHeight: '100vh'
    });
  }

  createNewTask(event: Event, date?: string | number) {
    event.stopPropagation();
    if (typeof date === 'number') {
      this.creatingTaskForDate = date;
    }
  }

  closeTask() {
    this.dialog.closeAll();
  }

  // --- Accordion logic ---
  toggleGroup(status: string) {
    this.expandedGroups[status] = !this.expandedGroups[status];
  }

  toggleTask(task: TaskV2, event: Event) {
    event.stopPropagation();
    task.expanded = !task.expanded;
  }

  // --- Board logic ---
  drop(event: CdkDragDrop<TaskV2[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id as TaskV2['status']; // Wait, the ID isn't the status unless we bind it.
      // Alternatively, pass status in drop data. Wait, event.container.data is the array. 
      // The old way we bound `[cdkDropListData]="status"`. Now we bind to the array. 
      // We need a way to know the new status. We can find it by looking up the key in boardColumns.
      const newStatusKey = Object.keys(this.boardColumns).find(k => this.boardColumns[k] === event.container.data);
      if (newStatusKey) {
        task.status = newStatusKey as TaskV2['status'];
      }
      
      import('@angular/cdk/drag-drop').then(m => {
        m.transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      });
    }
  }

  openCreateSubtask(task: TaskV2, event: Event) {
    event.stopPropagation();
    this.creatingSubtaskFor = task.id;
  }

  cancelCreateTask(event: Event) {
    event.stopPropagation();
    this.creatingSubtaskFor = null;
    this.creatingTaskForDate = null;
  }

}
