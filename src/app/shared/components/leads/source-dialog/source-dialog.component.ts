import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-source-dialog',
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
    <h2 mat-dialog-title>Specify Source Details</h2>
    <mat-dialog-content class="mat-typography p-t-16">
      <p class="m-b-16">Please specify the details for source <strong>{{ data.sourceType }}</strong>.</p>
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Source Description</mat-label>
        <input matInput [(ngModel)]="customText" placeholder="E.g., Dr. John Doe / Instagram Ads" required autofocus />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!customText || customText.trim() === ''" (click)="submit()">Submit</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .w-100 { width: 100%; }
    .m-b-16 { margin-bottom: 16px; }
    .p-t-16 { padding-top: 16px; }
  `]
})
export class SourceDialogComponent {
  customText: string = '';

  constructor(
    public dialogRef: MatDialogRef<SourceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { sourceType: string }
  ) {}

  submit(): void {
    if (this.customText && this.customText.trim()) {
      this.dialogRef.close(this.customText.trim());
    }
  }
}
