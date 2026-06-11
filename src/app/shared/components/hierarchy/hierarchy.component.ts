import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface HierarchyNode {
  id: string;
  initials: string;
  name: string;
  role: string;
  location: string;
  reportsCount: number;
  expanded?: boolean;
  children?: HierarchyNode[];
  color?: string; // Optional color for the avatar
}

@Component({
  selector: 'app-hierarchy',
  templateUrl: './hierarchy.component.html',
  styleUrls: ['./hierarchy.component.scss']
})
export class HierarchyComponent implements OnInit {
  // Summary Stats
  totalTeams = 6;
  totalMembers = 11;
  locations = 2;

  // Organization Tree Data
  organizationTree: HierarchyNode[] = [
    {
      id: '1',
      initials: 'VP',
      name: 'Vanitha P',
      role: 'MANAGER / PARTNER',
      location: 'Chennai',
      reportsCount: 3,
      expanded: true,
      color: 'bg-light-primary text-primary',
      children: [
        {
          id: '2',
          initials: 'PI',
          name: 'Prodian Infotech',
          role: 'COMPANY',
          location: 'Chennai',
          reportsCount: 0,
          color: 'bg-light-secondary text-secondary'
        },
        {
          id: '3',
          initials: 'AP',
          name: 'Akshaya P',
          role: 'REFERRAL',
          location: 'Chennai',
          reportsCount: 0,
          color: 'bg-light-warning text-warning'
        },
        {
          id: '4',
          initials: 'KP',
          name: 'Kavya P',
          role: 'SENIOR COUNSELLOR',
          location: 'Chennai',
          reportsCount: 2,
          expanded: true,
          color: 'bg-light-success text-success',
          children: [
            {
              id: '5',
              initials: 'SG',
              name: 'Srini G',
              role: 'JUNIOR COUNSELLOR',
              location: 'Chennai',
              reportsCount: 0,
              color: 'bg-light-warning text-warning'
            },
            {
              id: '6',
              initials: 'KV',
              name: 'Kala V',
              role: 'JUNIOR COUNSELLOR',
              location: 'Chennai',
              reportsCount: 0,
              color: 'bg-light-warning text-warning'
            },
            {
              id: '7',
              initials: 'SN',
              name: 'sathish N',
              role: 'JUNIOR COUNSELLOR',
              location: 'Chennai',
              reportsCount: 0,
              color: 'bg-light-warning text-warning'
            }
          ]
        }
      ]
    },
    {
      id: '8',
      initials: 'JG',
      name: 'Jitesh G',
      role: 'MANAGER / PARTNER',
      location: 'Noida',
      reportsCount: 88,
      color: 'bg-light-primary text-primary'
    }
  ];

  // Quick Assignment Data & Form
  assignmentForm: FormGroup;
  managers = [
    { id: '1', name: 'Vanitha P' },
    { id: '8', name: 'Jitesh G' },
    { id: '4', name: 'Kavya P' }
  ];
  employees = [
    { id: '5', name: 'Srini G', role: 'JUNIOR COUNSELLOR', color: 'bg-light-warning text-warning', initials: 'SG', initialColor: 'bg-success text-white' },
    { id: '6', name: 'Kala V', role: 'JUNIOR COUNSELLOR', color: 'bg-light-warning text-warning', initials: 'KV', initialColor: 'bg-primary text-white' },
    { id: '7', name: 'sathish N', role: 'JUNIOR COUNSELLOR', color: 'bg-light-warning text-warning', initials: 'SN', initialColor: 'bg-success text-white' }
  ];

  constructor(private fb: FormBuilder) {
    this.assignmentForm = this.fb.group({
      managerId: ['', Validators.required],
      employeeIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {}

  toggleExpand(node: HierarchyNode): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
    }
  }

  expandAll(): void {
    this.setExpandedForAll(this.organizationTree, true);
  }

  collapseAll(): void {
    this.setExpandedForAll(this.organizationTree, false);
  }

  private setExpandedForAll(nodes: HierarchyNode[], expanded: boolean): void {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        node.expanded = expanded;
        this.setExpandedForAll(node.children, expanded);
      }
    }
  }

  saveAssignment(): void {
    if (this.assignmentForm.valid) {
      console.log('Assignment Saved:', this.assignmentForm.value);
      // In a real application, submit this to the backend API here.
    }
  }

  cancelAssignment(): void {
    this.assignmentForm.reset();
  }

  isEmployeeSelected(id: string): boolean {
    const ids = this.assignmentForm.get('employeeIds')?.value as string[] || [];
    return ids.includes(id);
  }

  toggleEmployeeSelection(id: string, checked: boolean): void {
    const ids = this.assignmentForm.get('employeeIds')?.value as string[] || [];
    if (checked) {
      if (!ids.includes(id)) {
        this.assignmentForm.get('employeeIds')?.setValue([...ids, id]);
      }
    } else {
      this.assignmentForm.get('employeeIds')?.setValue(ids.filter(i => i !== id));
    }
  }
}
