import re
import sys

service_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/core/services/task.service.ts"

with open(service_file, 'r') as f:
    srv = f.read()

old_func = """  getTaskById(id: number): Observable<Task | undefined> {
    const tasks = this.getTasksFromStore();
    return of(tasks.find((t) => t.id === id)).pipe(delay(300));
  }"""

new_func = """  getTaskById(id: number): Observable<Task | undefined> {
    return this.http.get<any>(`${environment.apiUrl}/tasks/${id}/details`).pipe(
      map(response => {
        if (!response || !response.task) return undefined;
        const apiTask = response.task;
        
        // Helper to format enum values (e.g., IN_PROGRESS -> In Progress)
        const formatEnum = (val: string) => {
          if (!val) return '';
          return val.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        };

        return {
          id: apiTask.id,
          title: apiTask.title || 'Untitled',
          description: apiTask.description || '',
          status: formatEnum(apiTask.status),
          priority: formatEnum(apiTask.priority),
          category: 'Development',
          tags: [],
          assignee: { name: apiTask.assigneeName || 'Unassigned', avatar: '/assets/images/profile/user-1.jpg' },
          reporter: { name: apiTask.assignerName || 'System', avatar: '/assets/images/profile/user-2.jpg' },
          dueDate: apiTask.dueDate || '',
          estimatedTime: '',
          createdBy: apiTask.assignerName || 'System',
          createdDate: apiTask.createdAt || '',
          lastUpdated: apiTask.updatedAt || '',
          comments: (response.comments || []).map((c: any) => ({
            id: c.id,
            author: c.commentedByName || 'User',
            avatar: '/assets/images/profile/user-1.jpg',
            text: c.comment,
            date: c.createdAt
          })),
          attachments: [],
          activities: (response.activities || []).map((a: any) => ({
            id: a.id,
            user: a.doneByName || 'System',
            action: a.message || a.action,
            date: a.createdAt,
            type: a.action === 'COMMENT_ADDED' ? 'comment' : 'activity'
          }))
        } as Task;
      })
    );
  }"""

if old_func in srv:
    srv = srv.replace(old_func, new_func)
    with open(service_file, 'w') as f:
        f.write(srv)
    print("getTaskById updated")
else:
    print("old_func not found!")
