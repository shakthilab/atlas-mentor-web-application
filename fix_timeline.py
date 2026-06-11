import sys

service_file = "/home/shakthi/Downloads/modernize-angular-free-main/src/app/core/services/task.service.ts"

with open(service_file, 'r') as f:
    srv = f.read()

# I want to fix the mapping:
# user = a.doneByName || 'System'
# action_text = a.message || a.action
# if action_text.startswith(user):
#     action_text = action_text.substring(user.length).trim()

new_mapping = """          activities: (response.activities || []).map((a: any) => {
            const user = a.doneByName || 'System';
            let actionText = a.message || a.action;
            if (actionText && actionText.startsWith(user)) {
               actionText = actionText.substring(user.length).trim();
            }
            return {
              id: a.id,
              user: user,
              action: actionText,
              date: a.createdAt,
              type: a.action === 'COMMENT_ADDED' ? 'comment' : 'activity',
              rawAction: a.action
            };
          })"""

old_mapping = """          activities: (response.activities || []).map((a: any) => ({
            id: a.id,
            user: a.doneByName || 'System',
            action: a.message || a.action,
            date: a.createdAt,
            type: a.action === 'COMMENT_ADDED' ? 'comment' : 'activity'
          }))"""

if old_mapping in srv:
    srv = srv.replace(old_mapping, new_mapping)
    with open(service_file, 'w') as f:
        f.write(srv)
    print("Service updated")
else:
    print("Mapping not found in service")
