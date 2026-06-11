import re

html_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/shared/components/tasks/tasks.component.html"

with open(html_file, 'r') as f:
    html = f.read()

old_code = """        <div class="timeline-stream p-y-8 m-b-24" style="position: relative; margin-left: 12px; padding-left: 20px; border-left: 1px solid #e2e8f0;">
          <div class="timeline-event activity m-b-24" *ngFor="let act of timelineStream | slice:0:10" style="position: relative;">
            <div class="activity-marker" [ngStyle]="{'background-color': act.rawAction === 'STATUS_CHANGED' ? '#f59e0b' : '#cbd5e1'}" style="position: absolute; left: -25px; top: 6px; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px #e2e8f0; box-sizing: content-box;"></div>"""

new_code = """        <div class="timeline-stream p-y-8 m-b-24" style="position: relative; margin-left: 12px; padding-left: 24px;">
          <div style="position: absolute; left: 0; top: 16px; bottom: 0; width: 2px; background-color: #f1f5f9; z-index: 1;"></div>
          <div class="timeline-event activity m-b-24" *ngFor="let act of timelineStream | slice:0:10" style="position: relative; z-index: 2;">
            <div class="activity-marker" [ngStyle]="{'background-color': act.rawAction === 'STATUS_CHANGED' ? '#f59e0b' : '#cbd5e1'}" style="position: absolute; left: -30px; top: 4px; width: 8px; height: 8px; border-radius: 50%; border: 3px solid white; box-sizing: content-box; z-index: 3;"></div>"""

if old_code in html:
    html = html.replace(old_code, new_code)
    with open(html_file, 'w') as f:
        f.write(html)
    print("Timeline CSS updated")
else:
    print("Old code not found")
