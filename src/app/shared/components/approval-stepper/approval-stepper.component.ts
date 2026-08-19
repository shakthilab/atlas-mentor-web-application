import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type ApprovalStepState = 'done' | 'current' | 'pending';

export interface ApprovalStep {
  label: string;
  state: ApprovalStepState;
}

/**
 * Compact dot-and-line approval-chain indicator (e.g. Branch Partner -> Manager
 * -> Admin), for inline use wherever a real, staged approval status exists -
 * table cells, detail rails, etc. Purely presentational: the caller computes
 * each step's state from its own domain data (see workflow-progress.component.ts
 * for the task-accountability screen's existing computation logic, which this
 * does not replace or duplicate).
 */
@Component({
  selector: 'app-approval-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approval-stepper.component.html',
  styleUrl: './approval-stepper.component.scss',
})
export class ApprovalStepperComponent {
  @Input() steps: ApprovalStep[] = [];
}
