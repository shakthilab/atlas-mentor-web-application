import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-task-accountability-shell',
  templateUrl: './task-accountability-shell.component.html',
  styleUrls: ['./task-accountability-shell.component.scss']
})
export class TaskAccountabilityShellComponent implements OnInit {
  isAdminOrManager = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
    }
  }
}