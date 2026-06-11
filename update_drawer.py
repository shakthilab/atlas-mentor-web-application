import sys

html_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/shared/components/tasks/tasks.component.html"

with open(html_file, 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "<!-- DETAILS & CREATE DRAWER (SLIDE-IN SIDE PANEL / FULL SCREEN MOBILE) -->" in line:
        start_idx = i
    if "<!-- Mobile Floating Create Task Menu -->" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_drawer = """  <!-- DETAILS DRAWER (SLIDE-IN SIDE PANEL / FULL SCREEN MOBILE) -->
  <div class="task-drawer-backdrop" *ngIf="isDrawerOpen" (click)="closeDrawer()"></div>
  
  <div class="task-drawer redesigned-drawer" [class.open]="isDrawerOpen" [class.mobile-full]="isMobile">
    <!-- Header -->
    <div class="drawer-header p-x-24 p-y-20 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-12">
        <i-tabler name="file-text" class="icon-20 text-muted"></i-tabler>
        <span class="f-w-600 f-s-12 text-muted" style="letter-spacing: 0.5px; text-transform: uppercase;">TASK - {{ editingTask?.id || drawerTaskData.id || 736 }}</span>
      </div>
      <button mat-icon-button (click)="closeDrawer()" class="text-muted">
        <i-tabler name="x" class="icon-20"></i-tabler>
      </button>
    </div>

    <!-- Body Content -->
    <div class="drawer-body p-x-32 p-y-24" *ngIf="isDrawerOpen">
      <!-- Title field -->
      <h2 class="drawer-task-title m-b-8" style="font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">{{ drawerTaskData.title || 'Untitled Task' }}</h2>
      <div class="drawer-task-subtitle m-b-32 text-muted f-s-13">
        Created on {{ (drawerTaskData.createdDate | date:'MMM d, y') || 'Today' }} by {{ drawerTaskData.createdBy || 'Unknown' }}
      </div>

      <!-- 2x2 Grid Info -->
      <div class="task-info-grid m-b-32" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div class="info-cell">
          <label class="info-label text-muted f-s-11 f-w-700" style="letter-spacing: 0.5px;">ASSIGNEE</label>
          <div class="d-flex align-items-center gap-8 m-t-8">
            <div class="assignee-avatar-icon text-white d-flex align-items-center justify-content-center f-w-600 f-s-11 rounded-circle" [ngStyle]="{'background-color': '#10b981'}" style="width: 24px; height: 24px;" *ngIf="!drawerTaskData.assignee?.avatar || drawerTaskData.assignee?.avatar?.includes('user-')">
              {{ drawerTaskData.assignee?.name ? (drawerTaskData.assignee?.name | slice:0:2 | uppercase) : 'UN' }}
            </div>
            <img [src]="drawerTaskData.assignee?.avatar" class="rounded-circle object-cover" width="24" height="24" *ngIf="drawerTaskData.assignee?.avatar && !drawerTaskData.assignee?.avatar?.includes('user-')" />
            <span class="f-w-600 f-s-13 text-dark">{{ drawerTaskData.assignee?.name || 'Unassigned' }}</span>
          </div>
        </div>

        <div class="info-cell">
          <label class="info-label text-muted f-s-11 f-w-700" style="letter-spacing: 0.5px;">DUE DATE</label>
          <div class="d-flex align-items-center m-t-8">
            <span class="f-w-600 f-s-13 text-dark">{{ (drawerTaskData.dueDate | date:'MMM d, y') || 'No Due Date' }}</span>
          </div>
        </div>

        <div class="info-cell">
          <label class="info-label text-muted f-s-11 f-w-700" style="letter-spacing: 0.5px;">PRIORITY</label>
          <div class="m-t-8">
             <button class="priority-dropdown-btn" [ngClass]="drawerTaskData.priority?.toLowerCase()" [matMenuTriggerFor]="drawerPriorityMenu" style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; font-size: 11px; font-weight: 700;">
               <span class="priority-dot" style="width: 8px; height: 8px; border-radius: 50%;" [ngClass]="{'bg-error': drawerTaskData.priority === 'High', 'bg-warning': drawerTaskData.priority === 'Medium', 'bg-success': drawerTaskData.priority === 'Low'}"></span>
               {{ drawerTaskData.priority || 'NONE' | uppercase }}
               <i-tabler name="chevron-down" class="icon-14 text-muted m-l-4"></i-tabler>
             </button>
             <mat-menu #drawerPriorityMenu="matMenu" class="cardWithShadow">
               <button mat-menu-item *ngFor="let p of priorities" (click)="drawerTaskData.priority = p; saveDrawerChanges()">{{ p }}</button>
             </mat-menu>
          </div>
        </div>

        <div class="info-cell">
          <label class="info-label text-muted f-s-11 f-w-700" style="letter-spacing: 0.5px;">STATUS</label>
          <div class="m-t-8">
             <button class="status-dropdown-btn" [ngClass]="drawerTaskData.status?.toLowerCase().replace(' ', '-')" [matMenuTriggerFor]="drawerStatusMenu" style="display: flex; align-items: center; padding: 4px 10px; border-radius: 6px; border: 1px solid #fca5a5; background: #fef2f2; color: #ef4444; font-size: 11px; font-weight: 700;">
               {{ drawerTaskData.status || 'To Do' }}
               <i-tabler name="chevron-down" class="icon-14 m-l-4"></i-tabler>
             </button>
             <mat-menu #drawerStatusMenu="matMenu" class="cardWithShadow">
               <button mat-menu-item *ngFor="let s of statuses" (click)="drawerTaskData.status = s; saveDrawerChanges()">{{ s }}</button>
             </mat-menu>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="description-section m-b-32">
        <label class="info-label text-muted f-s-11 f-w-700 m-b-12 d-block" style="letter-spacing: 0.5px;">DESCRIPTION</label>
        <div class="description-box" [class.empty-description]="!drawerTaskData.description" style="background-color: #f8fafc; border-radius: 8px; padding: 20px; font-size: 13px; color: #64748b; font-style: italic;" *ngIf="!drawerTaskData.description">
          No description provided.
        </div>
        <div class="description-box" *ngIf="drawerTaskData.description" style="font-size: 13px; color: #1e293b; line-height: 1.6;">
          {{ drawerTaskData.description }}
        </div>
      </div>

      <!-- Tabs Section -->
      <div class="custom-tabs-header m-b-24 d-flex gap-24 border-bottom" style="border-bottom: 1px solid #e2e8f0;">
        <button class="custom-tab-btn" [class.active]="activeTab === 'comments'" (click)="activeTab = 'comments'" style="background: none; border: none; font-size: 14px; font-weight: 600; padding-bottom: 12px; cursor: pointer; border-bottom: 2px solid transparent; position: relative; color: #64748b;" [ngStyle]="activeTab === 'comments' ? {'color': '#0f172a', 'border-bottom-color': '#3b82f6'} : {}">
          Comments <span class="tab-badge" *ngIf="drawerTaskData.comments?.length" style="background-color: #eff6ff; color: #3b82f6; font-size: 11px; padding: 2px 6px; border-radius: 10px; margin-left: 4px;">{{ drawerTaskData.comments.length }}</span>
        </button>
        <button class="custom-tab-btn" [class.active]="activeTab === 'activity'" (click)="activeTab = 'activity'" style="background: none; border: none; font-size: 14px; font-weight: 600; padding-bottom: 12px; cursor: pointer; border-bottom: 2px solid transparent; position: relative; color: #64748b;" [ngStyle]="activeTab === 'activity' ? {'color': '#0f172a', 'border-bottom-color': '#3b82f6'} : {}">
          Activity
        </button>
      </div>

      <!-- Tab Content: Comments -->
      <div class="tab-content" *ngIf="activeTab === 'comments'">
        <div class="comments-list d-flex flex-column gap-20 m-b-24">
           <!-- Display Comments -->
           <div class="comment-item d-flex gap-16" *ngFor="let com of drawerTaskData.comments">
              <div class="comment-avatar text-white d-flex align-items-center justify-content-center f-w-600 f-s-12 rounded-circle" [ngStyle]="{'background-color': '#6366f1'}" style="width: 32px; height: 32px; flex-shrink: 0;">
                 {{ com.author | slice:0:2 | uppercase }}
              </div>
              <div class="comment-content flex-grow-1">
                 <div class="d-flex align-items-center gap-8 m-b-8">
                    <span class="f-w-600 f-s-13 text-dark">{{ com.author }}</span>
                    <span class="text-muted f-s-11" *ngIf="com.date">{{ com.date | date:'short' }}</span>
                    <span class="text-muted f-s-11" *ngIf="!com.date">Just now</span>
                 </div>
                 <div class="comment-text f-s-13 text-dark bg-light p-12 rounded-8" style="background-color: #f8fafc; border: 1px solid #e2e8f0; display: inline-block;">
                    {{ com.text }}
                 </div>
                 <div class="d-flex gap-12 m-t-8" *ngIf="com.author === 'Shakthi'">
                    <a href="javascript:void(0)" class="text-muted f-s-11 text-decoration-none hover-primary" (click)="deleteComment(com.id)">Delete</a>
                 </div>
              </div>
           </div>

           <!-- Empty State -->
           <div class="text-center text-muted f-s-13 p-y-24" *ngIf="!drawerTaskData.comments?.length">
              No comments yet.
           </div>
        </div>
      </div>

      <!-- Tab Content: Activity -->
      <div class="tab-content" *ngIf="activeTab === 'activity'">
         <!-- Timeline Stream -->
        <div class="timeline-stream p-l-12 p-t-8 m-b-24">
          <div class="timeline-event activity" *ngFor="let act of timelineStream | slice:0:10">
            <div class="activity-marker bg-warning"></div>
            <div class="activity-body f-s-12">
              <span class="f-w-600 text-dark">{{ act.user }}</span>
              <span class="text-muted m-l-4" *ngIf="act.type === 'activity'">{{ act.action }}</span>
              <span class="text-muted m-l-4" *ngIf="act.type === 'comment'">added a comment</span>
              <span class="activity-date d-block f-s-10 text-muted m-t-4">{{ act.date | date:'medium' }}</span>
            </div>
          </div>
          <div class="text-center text-muted f-s-13 p-y-24" *ngIf="!timelineStream?.length">
              No activity found.
          </div>
        </div>
      </div>

    </div>

    <!-- Fixed Comment Input Box Footer -->
    <div class="comment-footer-box p-20 border-top bg-white mt-auto w-100" *ngIf="isDrawerOpen && activeTab === 'comments'" style="position: sticky; bottom: 0; z-index: 10;">
      <div class="comment-input-container" style="position: relative; display: flex; align-items: center;">
        <input type="text" [(ngModel)]="newCommentText" (keyup.enter)="addComment()" class="comment-round-input" placeholder="Write a comment..." style="width: 100%; height: 44px; border-radius: 22px; border: 1px solid #bfdbfe; padding: 0 48px 0 20px; font-size: 14px; outline: none;" />
        <button mat-icon-button color="primary" class="send-comment-btn" (click)="addComment()" [disabled]="!newCommentText.trim()" style="position: absolute; right: 4px;">
          <i-tabler name="send" class="icon-18 text-primary"></i-tabler>
        </button>
      </div>
    </div>
  </div>
"""

    lines[start_idx:end_idx] = [new_drawer + "\n"]
    with open(html_file, 'w') as f:
        f.writelines(lines)
    print("HTML updated successfully")
else:
    print("Could not find start/end indices in HTML")

