import re
import sys

html_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/shared/components/tasks/tasks.component.html"
ts_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/shared/components/tasks/tasks.component.ts"
service_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/core/services/task.service.ts"

with open(html_file, 'r') as f:
    html = f.read()

# Replace iterations in HTML
html = html.replace('let s of statuses" (click)="filterStatus = s;', 'let s of statuses" (click)="filterStatus = s.label;')
html = html.replace('{{ s }}</button>', '{{ s.label }}</button>')
html = html.replace('let p of priorities" (click)="filterPriority = p;', 'let p of priorities" (click)="filterPriority = p.label;')
html = html.replace('{{ p }}</button>', '{{ p.label }}</button>')
html = html.replace('let s of statuses" (click)="onStatusChangeInline(element, s)">{{ s }}</button>', 'let s of statuses" (click)="onStatusChangeInline(element, s.label)">{{ s.label }}</button>')
html = html.replace('let p of priorities" (click)="onPriorityChangeInline(element, p)">{{ p }}</button>', 'let p of priorities" (click)="onPriorityChangeInline(element, p.label)">{{ p.label }}</button>')
html = html.replace('let s of statuses" (click)="bulkUpdateStatus(s)">{{ s }}</button>', 'let s of statuses" (click)="bulkUpdateStatus(s.label)">{{ s.label }}</button>')
html = html.replace('let p of priorities" (click)="bulkUpdatePriority(p)">{{ p }}</button>', 'let p of priorities" (click)="bulkUpdatePriority(p.label)">{{ p.label }}</button>')
html = html.replace('<mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>', '<mat-option *ngFor="let s of statuses" [value]="s.label">{{ s.label }}</mat-option>')
html = html.replace('<mat-option *ngFor="let p of priorities" [value]="p">{{ p }}</mat-option>', '<mat-option *ngFor="let p of priorities" [value]="p.label">{{ p.label }}</mat-option>')
html = html.replace('let p of priorities" (click)="drawerTaskData.priority = p;', 'let p of priorities" (click)="drawerTaskData.priority = p.label;')
html = html.replace('let s of statuses" (click)="drawerTaskData.status = s;', 'let s of statuses" (click)="drawerTaskData.status = s.label;')

with open(html_file, 'w') as f:
    f.write(html)


with open(ts_file, 'r') as f:
    ts = f.read()

ts = ts.replace("statuses: string[] = ['To Do', 'Review', 'Completed', 'Blocked'];", "statuses: {value: string, label: string}[] = [];")
ts = ts.replace("priorities: string[] = ['Low', 'Medium', 'High'];", "priorities: {value: string, label: string}[] = [];")

with open(ts_file, 'w') as f:
    f.write(ts)


with open(service_file, 'r') as f:
    srv = f.read()

srv = srv.replace("getStatuses(): Observable<string[]> {", "getStatuses(): Observable<{value: string, label: string}[]> {")
srv = srv.replace("return this.http.get<string[]>(`${environment.apiUrl}/tasks/statuses`);", "return this.http.get<{value: string, label: string}[]>(`${environment.apiUrl}/tasks/statuses`);")
srv = srv.replace("getPriorities(): Observable<string[]> {", "getPriorities(): Observable<{value: string, label: string}[]> {")
srv = srv.replace("return this.http.get<string[]>(`${environment.apiUrl}/tasks/priorities`);", "return this.http.get<{value: string, label: string}[]>(`${environment.apiUrl}/tasks/priorities`);")

with open(service_file, 'w') as f:
    f.write(srv)

print("Interfaces updated")
