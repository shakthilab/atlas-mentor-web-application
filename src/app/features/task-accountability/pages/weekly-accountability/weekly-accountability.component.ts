import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmployeeNode, DayNode, YearNode, MonthNode, BranchNode, RoleNode } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-weekly-accountability',
  templateUrl: './weekly-accountability.component.html',
  styleUrls: ['./weekly-accountability.component.scss']
})
export class WeeklyAccountabilityComponent implements OnInit, OnDestroy {
  isAdminTreeRole = false;
  
  // Selection references from service
  selectedEmployee: EmployeeNode | null = null;
  selectedRole: RoleNode | null = null;
  selectedBranch: BranchNode | null = null;
  selectedYear: YearNode | null = null;
  selectedMonth: MonthNode | null = null;
  selectedDay: DayNode | null = null;

  // View control states
  todayDate = '';
  checkpointDate = '';
  selectedDayNum = 7; // Default checkpoint chip: 7, 14, 21, 28
  
  // Template & Answer states
  template: any = null;
  questions: any[] = [];
  answers: { [key: number]: string } = {};
  savedTimestamps: { [key: number]: string } = {}; // For per-question saved status
  
  // UX states
  isLoading = false;
  isSaving = false;
  isSuccess = false;
  hasError = false;
  isForbidden = false;
  errorMessage = '';
  noTemplateAssigned = false;
  notYetAnswered = false;
  isReadOnly = false;

  private subs = new Subscription();

  constructor(
    private service: TaskAccountabilityService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.todayDate = this.getLocalDateString();
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.isAdminTreeRole = this.service.isAdminTreeRole(user.role);
    }

    // Subscribe to selection states from tree
    this.subs.add(
      this.service.selectedEmployee$.subscribe(emp => {
        this.selectedEmployee = emp;
        this.resetState();
        if (this.isAdminTreeRole) {
          if (emp) {
            this.onReviewerSelectionChange();
          }
        } else {
          this.onEmployeeInit();
        }
      })
    );

    this.subs.add(
      this.service.selectedRole$.subscribe(role => this.selectedRole = role)
    );

    this.subs.add(
      this.service.selectedBranch$.subscribe(branch => this.selectedBranch = branch)
    );

    this.subs.add(
      this.service.selectedYear$.subscribe(yr => {
        this.selectedYear = yr;
        if (this.isAdminTreeRole && this.selectedEmployee) {
          this.onReviewerSelectionChange();
        }
      })
    );

    this.subs.add(
      this.service.selectedMonth$.subscribe(m => {
        this.selectedMonth = m;
        if (this.isAdminTreeRole && this.selectedEmployee) {
          this.onReviewerSelectionChange();
        }
      })
    );

    this.subs.add(
      this.service.selectedDay$.subscribe(d => {
        this.selectedDay = d;
        if (d && d.isWeekly) {
          // Extract day number (e.g. Day 7 -> 7)
          const matched = d.name.match(/\d+/);
          if (matched) {
            this.selectedDayNum = Number(matched[0]);
          }
          if (this.isAdminTreeRole && this.selectedEmployee) {
            this.onReviewerSelectionChange();
          }
        }
      })
    );

    // Initial load for Employee Mode (since no tree is rendered)
    if (!this.isAdminTreeRole) {
      this.onEmployeeInit();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  resetState(): void {
    this.template = null;
    this.questions = [];
    this.answers = {};
    this.savedTimestamps = {};
    this.hasError = false;
    this.isForbidden = false;
    this.errorMessage = '';
    this.noTemplateAssigned = false;
    this.notYetAnswered = false;
    this.isReadOnly = false;
  }

  getLocalDateString(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  calculateCheckpointDate(dayNum: number): string {
    const year = this.selectedYear?.yearNumber || new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    if (this.selectedMonth) {
      const monthsMap: { [key: string]: number } = {
        january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
      };
      const mKey = this.selectedMonth.name.toLowerCase().trim();
      if (monthsMap[mKey]) month = monthsMap[mKey];
    }
    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // --- PART 1: Employee Mode ---
  onEmployeeInit(): void {
    this.resetState();
    this.checkpointDate = this.calculateCheckpointDate(this.selectedDayNum);
    this.isReadOnly = this.checkpointDate !== this.todayDate;

    this.isLoading = true;
    this.service.getMyWeeklyTemplate().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res || res.data === null || !res.data) {
          this.noTemplateAssigned = true;
          return;
        }

        this.template = res.data;
        this.questions = (res.data.questions || []).sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        // Initialize blank answers
        this.questions.forEach(q => {
          this.answers[q.id] = '';
        });

        // Load responses for the selected date
        this.loadEmployeeResponses();
      },
      error: (err) => {
        this.isLoading = false;
        this.handleError(err);
      }
    });
  }

  loadEmployeeResponses(): void {
    this.service.getMyWeeklyResponses(this.checkpointDate).subscribe({
      next: (res) => {
        const answersList = res.data || [];
        answersList.forEach((ans: any) => {
          if (ans.questionId) {
            this.answers[ans.questionId] = ans.answerText || '';
            if (ans.answeredAt) {
              this.savedTimestamps[ans.questionId] = ans.answeredAt;
            }
          }
        });
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  submitAnswers(): void {
    this.errorMessage = '';
    this.isSaving = true;

    const formattedAnswers = this.questions.map(q => ({
      questionId: q.id,
      answerText: this.answers[q.id] || ''
    }));

    const payload = {
      checkpointDate: this.todayDate, // Enforce today's date
      answers: formattedAnswers
    };

    this.service.submitMyWeeklyResponses(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.isSuccess = true;
        this.notificationService.showSuccessToast('Weekly check-in submitted successfully.', 'Success');
        
        // Update timestamps with returned answeredAt details
        const savedList = res.data || [];
        savedList.forEach((item: any) => {
          if (item.questionId) {
            this.savedTimestamps[item.questionId] = item.answeredAt || new Date().toISOString();
          }
        });

        setTimeout(() => this.isSuccess = false, 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.handleError(err);
      }
    });
  }

  // --- PART 2: Reviewer Mode ---
  onReviewerSelectionChange(): void {
    if (!this.selectedEmployee) return;

    this.resetState();
    this.checkpointDate = this.calculateCheckpointDate(this.selectedDayNum);
    this.isLoading = true;

    this.service.getEmployeeWeeklyResponses(this.selectedEmployee.id, this.checkpointDate).subscribe({
      next: (res) => {
        this.isLoading = false;
        const responseData = res.data || [];
        if (responseData.length === 0) {
          this.notYetAnswered = true;
          return;
        }

        // The response contains questions + answerText + answeredAt
        this.questions = responseData.map((item: any, idx: number) => ({
          id: item.questionId || idx,
          questionText: item.questionText || `Question ${idx + 1}`
        }));

        responseData.forEach((item: any, idx: number) => {
          const key = item.questionId || idx;
          this.answers[key] = item.answerText || 'No answer provided.';
          this.savedTimestamps[key] = item.answeredAt;
        });
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 403) {
          this.isForbidden = true;
          this.errorMessage = '403 Forbidden: You do not have permission to view this employee\'s weekly accountability review.';
          this.notificationService.showErrorPopup(
            'You are not authorized to view this employee\'s weekly checkpoint responses. Access restricted.',
            'Access Forbidden',
            'Back to Workspace'
          ).subscribe(() => {
            this.service.resetSelections();
          });
        } else {
          this.handleError(err);
        }
      }
    });
  }

  // General Chip Click navigation for checkpoints
  selectCheckpoint(dayNum: number): void {
    this.selectedDayNum = dayNum;
    if (this.isAdminTreeRole) {
      this.onReviewerSelectionChange();
    } else {
      this.onEmployeeInit();
    }
  }

  // Error Coercion & Custom Handling
  handleError(err: any): void {
    this.hasError = true;
    console.error('Weekly accountability error:', err);
    
    const statusMsg = err.error?.message || err.message || '';
    
    // Map specific backend business-rule error strings
    if (statusMsg.includes("checkpointDate isn't today")) {
      this.errorMessage = 'Business Rule Violation: This checkpoint cannot be edited because it is not today.';
    } else if (statusMsg.includes('No work day exists yet')) {
      this.errorMessage = 'No work day exists yet for the selected checkpoint date.';
    } else if (statusMsg.includes("isn't a checkpoint day for this employee")) {
      this.errorMessage = 'The selected date is not a designated weekly checkpoint day for this employee.';
    } else if (statusMsg.includes('No ACTIVE template')) {
      this.errorMessage = 'No active check-in template is currently assigned to this role.';
    } else if (statusMsg.includes("doesn't belong to that active template")) {
      this.errorMessage = 'Validation Error: Some questions do not belong to the active template.';
    } else {
      this.errorMessage = statusMsg || 'An error occurred while loading weekly accountability data.';
    }
  }
}
