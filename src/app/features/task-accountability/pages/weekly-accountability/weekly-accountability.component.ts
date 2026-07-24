import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskAccountabilityService } from '../../services/task-accountability.service';
import { EmployeeNode, DayNode } from '../../interfaces/accountability.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-weekly-accountability',
  templateUrl: './weekly-accountability.component.html',
  styleUrls: ['./weekly-accountability.component.scss']
})
export class WeeklyAccountabilityComponent implements OnInit, OnDestroy {
  selectedEmployee: EmployeeNode | null = null;
  selectedDay: DayNode | null = null;
  selectedBranchName = '';

  // Form Field States
  achievements = '';
  challenges = '';
  supportNeeded = '';
  nextWeekPlan = '';
  managerFeedback = '';
  isSaved = false;

  private subs = new Subscription();

  constructor(private service: TaskAccountabilityService) {}

  ngOnInit(): void {
    this.subs.add(
      this.service.selectedEmployee$.subscribe(emp => {
        this.selectedEmployee = emp;
        this.loadMockWeeklyContent();
      })
    );
    this.subs.add(
      this.service.selectedDay$.subscribe(day => {
        this.selectedDay = day;
      })
    );
    this.subs.add(
      this.service.selectedBranch$.subscribe(b => {
        this.selectedBranchName = b?.name || '';
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadMockWeeklyContent(): void {
    if (this.selectedEmployee?.name === 'Rohith Krishnan') {
      this.achievements = 'Exceeded the daily caller target by 10% average. Successfully cleared the registration pipeline backlog for April intake.';
      this.challenges = 'Fewer slots available for MBBS Ukraine counsellings due to local constraints. Shifted students to Russia/Poland options.';
      this.supportNeeded = 'Requesting additional CRM lead allocation for the European MBBS programs.';
      this.nextWeekPlan = 'Conduct target follow-up seminar for Chennai division leads. Aim to convert 5 registrations.';
      this.managerFeedback = 'Rohith has shown great accountability this week. Solid effort on CRM updates and lead follow-ups!';
    } else {
      this.achievements = 'Completed all daily checklists on time. Assisted senior counsellors with documentation.';
      this.challenges = 'Slow internet connectivity during EOD file uploads.';
      this.supportNeeded = 'Need training on the new overseas student application portal.';
      this.nextWeekPlan = 'Maintain 100% completion rate for daily calls. Register 2 students.';
      this.managerFeedback = 'Good progress on training this week. Keep up the solid performance!';
    }
    this.isSaved = false;
  }

  saveWeeklyForm(): void {
    this.isSaved = true;
    setTimeout(() => {
      this.isSaved = false;
    }, 3000);
  }

  submitWeekly(): void {
    if (this.selectedDay) {
      this.selectedDay.status = 'Manager Review';
      this.service.selectDay({ ...this.selectedDay });
    }
  }

  approveWeekly(): void {
    if (this.selectedDay) {
      this.selectedDay.status = 'Verified';
      this.service.selectDay({ ...this.selectedDay });
    }
  }
}
