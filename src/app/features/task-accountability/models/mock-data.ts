import { BranchNode, TaskItem } from '../interfaces/accountability.interface';

export const MOCK_TASKS_DAY_2: TaskItem[] = [
  {
    id: 'T-101',
    name: 'Call New Leads',
    type: 'NUMERIC',
    priority: 'High',
    status: 'Manager Review',
    actualValue: '150/150 calls',
    comment: 'Reached daily lead calling quota from CRM pipeline.',
    description: 'Predefined operational task from the Senior Counsellor Daily Bundle. Employee must complete, log KPI value, and submit for counsellor approval before the manager review stage.',
    targetValue: '150 calls',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '6:00 PM',
    comments: [
      {
        id: 'c1',
        authorName: 'Sandhya Ramesh',
        authorRole: 'Senior Counsellor',
        text: 'Reached daily lead calling quota from CRM pipeline.',
        timestamp: '2:14 PM'
      },
      {
        id: 'c2',
        authorName: 'Priya Nair',
        authorRole: 'Branch Manager',
        text: 'Numbers look strong. Please attach the call recording sheet before EOD.',
        timestamp: '3:02 PM'
      }
    ],
    attachments: [
      {
        id: 'a1',
        name: 'Daily_Report.pdf',
        size: '2.1 MB'
      }
    ],
    activities: [
      {
        id: 'act1',
        text: 'Sandhya submitted task',
        timestamp: '4:12 PM'
      },
      {
        id: 'act2',
        text: 'Counsellor lead approved',
        timestamp: '4:31 PM'
      },
      {
        id: 'act3',
        text: 'Sent to Manager Review',
        timestamp: '4:32 PM'
      }
    ],
    rating: 'Excellent'
  },
  {
    id: 'T-102',
    name: 'Follow-up Calls (Warm Leads)',
    type: 'NUMERIC',
    priority: 'Medium',
    status: 'Verified',
    actualValue: '25/25 follow-ups',
    comment: 'All warm leads from last week contacted.',
    description: 'Follow up with warm leads who showed interest in MBBS abroad programmes during the weekend webinar.',
    targetValue: '25 follow-ups',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '5:30 PM',
    comments: [],
    attachments: [],
    activities: [
      { id: 'act4', text: 'Task completed', timestamp: '5:15 PM' }
    ]
  },
  {
    id: 'T-103',
    name: 'Student Counselling Sessions',
    type: 'NUMERIC',
    priority: 'High',
    status: 'Completed',
    actualValue: '8/8 sessions',
    comment: 'MBBS Georgia + Russia queries handled.',
    description: 'Conduct one-on-one video counselling sessions for students seeking admission in Europe or Russia.',
    targetValue: '8 sessions',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '4:00 PM',
    comments: [],
    attachments: [],
    activities: []
  },
  {
    id: 'T-104',
    name: 'Visa Document Verification',
    type: 'CHECKLIST',
    priority: 'Low',
    status: 'Verified',
    actualValue: '—',
    comment: 'All docs verified and uploaded.',
    description: 'Verify visa files and check for mandatory financial affidavits.',
    targetValue: 'Checklist completed',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '3:00 PM',
    comments: [],
    attachments: [],
    activities: []
  },
  {
    id: 'T-105',
    name: 'Upload Daily Report (PDF)',
    type: 'FILE',
    priority: 'High',
    status: 'Verified',
    actualValue: '1 File',
    comment: '—',
    description: 'Generate PDF progress report and upload it for management review.',
    targetValue: '1 File',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '7:00 PM',
    comments: [],
    attachments: [
      { id: 'a2', name: 'EOD_Summary.pdf', size: '1.2 MB' }
    ],
    activities: []
  },
  {
    id: 'T-106',
    name: 'Manager Feedback Response',
    type: 'COMMENT',
    priority: 'Medium',
    status: 'Completed',
    actualValue: '—',
    comment: 'Acknowledged feedback on lead follow-up cadence.',
    description: 'Read and reply to comments on yesterday\'s lead sheets.',
    targetValue: 'Acknowledged',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '1:00 PM',
    comments: [],
    attachments: [],
    activities: []
  },
  {
    id: 'T-107',
    name: 'Students Converted (Enrolments)',
    type: 'NUMERIC',
    priority: 'Urgent',
    status: 'Verified',
    actualValue: '3/3 students',
    comment: 'Awaiting one payment confirmation.',
    description: 'Record student enrolment details in CRM and trigger invoice generation.',
    targetValue: '3 students',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '6:30 PM',
    comments: [],
    attachments: [],
    activities: []
  },
  {
    id: 'T-108',
    name: 'CRM Data Hygiene',
    type: 'CHECKLIST',
    priority: 'Low',
    status: 'Verified',
    actualValue: '—',
    comment: 'Duplicate leads merged.',
    description: 'Clean up duplicates and merge customer dossiers.',
    targetValue: 'Checklist completed',
    achievementRate: 100,
    assignedTo: 'Rohith Krishnan',
    assignedBy: 'Priya Nair',
    dueTime: '2:00 PM',
    comments: [],
    attachments: [],
    activities: []
  }
];

export const MOCK_BRANCHES: BranchNode[] = [
  {
    id: 'b-chennai',
    name: 'Chennai',
    count: 5,
    expanded: false,
    roles: [
      {
        id: 'r-chennai-sr-counsellors',
        name: 'Senior Counsellors',
        count: 2,
        expanded: false,
        employees: [
          {
            id: 'emp-sandhya',
            name: 'Sandhya Ramesh',
            role: 'Senior Counsellor',
            completionRate: 90,
            initials: 'SR',
            streak: 5,
            years: [
              {
                id: 'y-sandhya-2026',
                yearNumber: 2026,
                months: [
                  {
                    id: 'm-sandhya-2026-april',
                    name: 'April',
                    isLive: true,
                    days: [
                      { id: 'd-sandhya-1', name: 'Day 1', dateLabel: 'Apr 01, 2026', completionRate: 90, progressRate: 90, status: 'Verified' },
                      { id: 'd-sandhya-2', name: 'Day 2', dateLabel: 'Apr 02, 2026', completionRate: 85, progressRate: 85, status: 'Completed' }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'emp-rohith',
            name: 'Rohith Krishnan',
            role: 'Senior Counsellor',
            completionRate: 85,
            initials: 'RK',
            streak: 8,
            expanded: false,
            years: [
              {
                id: 'y-rohith-2026',
                yearNumber: 2026,
                expanded: false,
                months: [
                  {
                    id: 'm-rohith-2026-april',
                    name: 'April',
                    isLive: true,
                    expanded: false,
                    days: [
                      { id: 'd-rohith-1', name: 'Day 1', dateLabel: 'Apr 01, 2026', completionRate: 88, progressRate: 88, status: 'Verified' },
                      { id: 'd-rohith-2', name: 'Day 2', dateLabel: 'Apr 02, 2026', completionRate: 91, progressRate: 91, status: 'Manager Review', tasks: [] },
                      { id: 'd-rohith-3', name: 'Day 3', dateLabel: 'Apr 03, 2026', completionRate: 94, progressRate: 94, status: 'Counsellor Approved' },
                      { id: 'd-rohith-4', name: 'Day 4', dateLabel: 'Apr 04, 2026', completionRate: 87, progressRate: 87, status: 'Completed' },
                      { id: 'd-rohith-5', name: 'Day 5', dateLabel: 'Apr 05, 2026', completionRate: 90, progressRate: 90, status: 'Employee' },
                      { id: 'd-rohith-6', name: 'Day 6', dateLabel: 'Apr 06, 2026', completionRate: 93, progressRate: 93, status: 'Completed' },
                      { id: 'd-rohith-7', name: 'Day 7', dateLabel: 'Apr 07, 2026', completionRate: 86, progressRate: 86, status: 'Verified' },
                      { id: 'd-rohith-w1', name: 'Weekly Accountability', dateLabel: 'Weekly Summary', completionRate: 90, progressRate: 90, status: 'Completed', isWeekly: true },
                      { id: 'd-rohith-8', name: 'Day 8', dateLabel: 'Apr 08, 2026', completionRate: 78, progressRate: 78, status: 'Verified' },
                      { id: 'd-rohith-9', name: 'Day 9', dateLabel: 'Apr 09, 2026', completionRate: 0, progressRate: 0, status: 'Employee' },
                      { id: 'd-rohith-10', name: 'Day 10', dateLabel: 'Apr 10, 2026', completionRate: 0, progressRate: 0, status: 'Employee' },
                      { id: 'd-rohith-11', name: 'Day 11', dateLabel: 'Apr 11, 2026', completionRate: 0, progressRate: 0, status: 'Employee' },
                      { id: 'd-rohith-12', name: 'Day 12', dateLabel: 'Apr 12, 2026', completionRate: 0, progressRate: 0, status: 'Employee' },
                      { id: 'd-rohith-13', name: 'Day 13', dateLabel: 'Apr 13, 2026', completionRate: 0, progressRate: 0, status: 'Employee' },
                      { id: 'd-rohith-14', name: 'Day 14', dateLabel: 'Apr 14, 2026', completionRate: 0, progressRate: 0, status: 'Employee' },
                      { id: 'd-rohith-w2', name: 'Weekly Accountability', dateLabel: 'Weekly Summary', completionRate: 0, progressRate: 0, status: 'Employee', isWeekly: true },
                      { id: 'd-rohith-15', name: 'Day 15', dateLabel: 'Apr 15, 2026', completionRate: 0, progressRate: 0, status: 'Employee' }
                    ]
                  },
                  {
                    id: 'm-rohith-2026-may',
                    name: 'May',
                    days: []
                  },
                  {
                    id: 'm-rohith-2026-june',
                    name: 'June',
                    days: []
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'r-chennai-jr-counsellors',
        name: 'Junior Counsellors',
        count: 2,
        employees: [
          {
            id: 'emp-ajay',
            name: 'Ajay Kumar',
            role: 'Junior Counsellor',
            completionRate: 75,
            initials: 'AK',
            streak: 3,
            years: []
          },
          {
            id: 'emp-kavya',
            name: 'Kavya Priya',
            role: 'Junior Counsellor',
            completionRate: 80,
            initials: 'KP',
            streak: 4,
            years: []
          }
        ]
      },
      {
        id: 'r-chennai-video-editors',
        name: 'Video Editors',
        count: 1,
        employees: [
          {
            id: 'emp-hari',
            name: 'Hari Prasad',
            role: 'Video Editor',
            completionRate: 60,
            initials: 'HP',
            streak: 1,
            years: []
          }
        ]
      }
    ]
  },
  {
    id: 'b-hyderabad',
    name: 'Hyderabad',
    count: 4,
    roles: [
      {
        id: 'r-hyd-branch-managers',
        name: 'Branch Managers',
        count: 1,
        employees: [
          {
            id: 'emp-priya',
            name: 'Priya Nair',
            role: 'Branch Manager',
            completionRate: 95,
            initials: 'PN',
            streak: 12,
            years: []
          }
        ]
      },
      {
        id: 'r-hyd-sr-counsellors',
        name: 'Senior Counsellors',
        count: 2,
        employees: [
          {
            id: 'emp-vivek',
            name: 'Vivek Reddy',
            role: 'Senior Counsellor',
            completionRate: 82,
            initials: 'VR',
            streak: 6,
            years: []
          },
          {
            id: 'emp-srinivas',
            name: 'Srinivas Rao',
            role: 'Senior Counsellor',
            completionRate: 88,
            initials: 'SR',
            streak: 9,
            years: []
          }
        ]
      },
      {
        id: 'r-hyd-web-devs',
        name: 'Web Developers',
        count: 1,
        employees: [
          {
            id: 'emp-venkat',
            name: 'Venkat Ram',
            role: 'Web Developer',
            completionRate: 90,
            initials: 'VR',
            streak: 10,
            years: []
          }
        ]
      }
    ]
  },
  {
    id: 'b-bangalore',
    name: 'Bangalore',
    count: 2,
    roles: [
      {
        id: 'r-blr-sr-counsellors',
        name: 'Senior Counsellors',
        count: 2,
        employees: [
          {
            id: 'emp-ananya',
            name: 'Ananya Hegde',
            role: 'Senior Counsellor',
            completionRate: 89,
            initials: 'AH',
            streak: 7,
            years: []
          },
          {
            id: 'emp-arjun',
            name: 'Arjun Gowda',
            role: 'Senior Counsellor',
            completionRate: 78,
            initials: 'AG',
            streak: 2,
            years: []
          }
        ]
      }
    ]
  }
];
