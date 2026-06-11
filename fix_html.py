import re
import sys

html_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/shared/components/tasks/tasks.component.html"

with open(html_file, 'r') as f:
    html = f.read()

html = html.replace('onStatusChangeInline(element, s)', 'onStatusChangeInline(element, s.label)')
html = html.replace('onPriorityChangeInline(element, p)', 'onPriorityChangeInline(element, p.label)')
html = html.replace('bulkUpdateStatus(s)', 'bulkUpdateStatus(s.label)')
html = html.replace('bulkUpdatePriority(p)', 'bulkUpdatePriority(p.label)')

with open(html_file, 'w') as f:
    f.write(html)
print("HTML fixed")
