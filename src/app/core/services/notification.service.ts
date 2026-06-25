import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';
import { NotificationDialogComponent } from '../../shared/components/notification-dialog/notification-dialog.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {}

  /**
   * Show a success toast notification.
   */
  showSuccessToast(message: string, title?: string, duration: number = 4000): void {
    this.snackBar.openFromComponent(NotificationToastComponent, {
      data: { type: 'success', title, message },
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-snack-container']
    });
  }

  /**
   * Show an error toast notification.
   */
  showErrorToast(message: string, title?: string, duration: number = 5000): void {
    this.snackBar.openFromComponent(NotificationToastComponent, {
      data: { type: 'error', title, message },
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-snack-container']
    });
  }

  /**
   * Show a warning toast notification.
   */
  showWarningToast(message: string, title?: string, duration: number = 4000): void {
    this.snackBar.openFromComponent(NotificationToastComponent, {
      data: { type: 'warning', title, message },
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-snack-container']
    });
  }

  /**
   * Show a success dialog/popup modal.
   */
  showSuccessPopup(message: string, title?: string, buttonText?: string): Observable<boolean> {
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      data: { type: 'success', title, message, buttonText },
      width: '400px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
    return dialogRef.afterClosed();
  }

  /**
   * Show an error dialog/popup modal.
   */
  showErrorPopup(message: string, title?: string, buttonText?: string): Observable<boolean> {
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      data: { type: 'error', title, message, buttonText },
      width: '400px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
    return dialogRef.afterClosed();
  }

  /**
   * Show an error dialog/popup modal specifically for unverified email error with a resend button.
   */
  showUnverifiedEmailPopup(message: string, title?: string, buttonText?: string): Observable<string | boolean> {
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      data: { 
        type: 'error', 
        title: title || 'Email Verification Required', 
        message, 
        buttonText: buttonText || 'Close',
        showResend: true
      },
      width: '400px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
    return dialogRef.afterClosed();
  }
}
