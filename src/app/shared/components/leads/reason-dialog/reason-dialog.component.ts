import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Reason Required</h2>
    <mat-dialog-content class="mat-typography p-t-16">
      <p class="m-b-16">Please provide a reason for marking this lead as LOST.</p>
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Reason</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="3" placeholder="E.g., Student chose a different university" required></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!reason || reason.trim() === ''" (click)="submit()">Submit</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .w-100 { width: 100%; }
    .m-b-16 { margin-bottom: 16px; }
    .p-t-16 { padding-top: 16px; }
  `]
})
export class ReasonDialogComponent {
  reason: string = '';

  constructor(public dialogRef: MatDialogRef<ReasonDialogComponent>) {}

  submit(): void {
    if (this.reason && this.reason.trim()) {
      this.dialogRef.close(this.reason.trim());
    }
  }
}
