import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { HierarchyService, CounsellorNode } from '../../../core/services/hierarchy.service';
import { MatDialog } from '@angular/material/dialog';
import { HierarchyAssignDialogComponent } from './hierarchy-assign-dialog/hierarchy-assign-dialog.component';

export interface HierarchyNode {
  id: string;
  initials: string;
  name: string;
  role: string;
  location: string;
  branchId?: number;
  reportsCount: number;
  expanded?: boolean;
  children?: HierarchyNode[];
  color?: string; // CSS color classes for avatar/card
}

@Component({
  selector: 'app-hierarchy',
  templateUrl: './hierarchy.component.html',
  styleUrls: ['./hierarchy.component.scss']
})
export class HierarchyComponent implements OnInit {
  // Summary Stats
  totalTeams = 0;
  totalMembers = 0;
  locations = 0;

  // Selected Location Filter
  selectedLocation = 'All Locations';
  locationsList = ['All Locations'];

  // Search filter for Quick Assignment
  searchTerm = '';

  // Organization Tree Data
  organizationTree: HierarchyNode[] = [];

  // Flat pool of assignable employees
  assignableEmployeesPool: any[] = [];

  // Quick Assignment Form
  assignmentForm: FormGroup;

  isLoading = true;

  constructor(
    private fb: FormBuilder, 
    private notificationService: NotificationService,
    private hierarchyService: HierarchyService,
    private dialog: MatDialog
  ) {
    this.assignmentForm = this.fb.group({
      managerId: ['', Validators.required],
      employeeIds: [[] as string[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
    
    // Listen to manager selection to dynamically fetch unassigned employees
    this.assignmentForm.get('managerId')?.valueChanges.subscribe(managerId => {
      this.assignableEmployeesPool = [];
      this.assignmentForm.get('employeeIds')?.setValue([]);
      
      if (managerId) {
        // Extract numeric ID from 'mgr-11' or 'emp-15'
        const numericIdMatch = managerId.match(/\d+$/);
        if (numericIdMatch) {
          const numericId = parseInt(numericIdMatch[0], 10);
          this.hierarchyService.getUnassignedEmployees(numericId).subscribe({
            next: (res) => {
              const formatRole = (roleStr: string) => {
                if (!roleStr) return 'Unknown';
                return roleStr.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              };

              const getInitials = (name: string) => {
                return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              };

              const unassignedList = res.data || [];
              this.assignableEmployeesPool = unassignedList.map((emp: any) => ({
                id: 'emp-' + emp.id,
                name: emp.name,
                role: formatRole(emp.primaryRole),
                location: emp.branch?.name || 'Unknown',
                initials: getInitials(emp.name)
              }));
            },
            error: (err) => {
              this.notificationService.showErrorToast('Failed to load unassigned employees for selected manager.');
              console.error(err);
            }
          });
        }
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      branches: this.hierarchyService.getBranches(true),
      managers: this.hierarchyService.getManagersHierarchy(),
      counsellors: this.hierarchyService.getCounsellorsHierarchy()
    }).subscribe({
      next: (res) => {
        // Populate branches
        const branches = res.branches.data || [];
        this.locationsList = ['All Locations', ...branches.map(b => b.name)];

        const getInitials = (name: string) => {
          return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        };

        const formatRole = (roleStr: string) => {
          if (!roleStr) return 'Unknown';
          return roleStr.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        };

        const managers = res.managers.data || [];
        const counsellors = res.counsellors.data || [];

        const counsellorMap = new Map<number, CounsellorNode>();
        counsellors.forEach(c => counsellorMap.set(c.id, c));

        const tree: HierarchyNode[] = [];

        managers.forEach(mgr => {
          const mgrNode: HierarchyNode = {
            id: 'mgr-' + mgr.id,
            name: mgr.name,
            initials: getInitials(mgr.name),
            role: 'Manager',
            location: mgr.branch?.name || 'Unknown',
            branchId: mgr.branch?.id,
            reportsCount: 0,
            expanded: false,
            color: this.getRoleColorClass('Manager'),
            children: []
          };

          mgr.employees?.forEach(emp => {
            const childNode: HierarchyNode = {
              id: 'emp-' + emp.id,
              name: emp.name,
              initials: getInitials(emp.name),
              role: formatRole(emp.role),
              location: mgrNode.location,
              branchId: mgrNode.branchId,
              reportsCount: 0,
              expanded: false,
              color: this.getRoleColorClass(emp.role),
              children: []
            };
            
            if (emp.role === 'SENIOR_COUNSELLOR') {
              const scDetails = counsellorMap.get(emp.id);
              if (scDetails && scDetails.juniorCounsellors) {
                scDetails.juniorCounsellors.forEach(jc => {
                  const jcNode: HierarchyNode = {
                    id: 'jc-' + jc.id,
                    name: jc.name,
                    initials: getInitials(jc.name),
                    role: 'Junior Counsellor',
                    location: scDetails.branch?.name || mgrNode.location,
                    reportsCount: 0,
                    expanded: false,
                    color: this.getRoleColorClass('Junior Counsellor')
                  };
                  childNode.children!.push(jcNode);
                });
              }
            }
            
            mgrNode.children!.push(childNode);
          });
          
          tree.push(mgrNode);
        });

        this.organizationTree = tree;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        this.notificationService.showErrorToast('Failed to load hierarchy data');
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Calculate dynamic stats from tree
  calculateStats(): void {
    let teamsCount = 0;
    const uniqueLocations = new Set<string>();
    let membersCount = 0;

    const traverse = (node: HierarchyNode) => {
      membersCount++;
      uniqueLocations.add(node.location);
      
      const roleUpper = node.role.toUpperCase();
      const isManagerOrSC = roleUpper.includes('MANAGER') || roleUpper.includes('SENIOR COUNSELLOR');
      const hasChildren = node.children && node.children.length > 0;
      
      if (isManagerOrSC || hasChildren) {
        teamsCount++;
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    this.organizationTree.forEach(traverse);

    this.totalTeams = teamsCount;
    this.totalMembers = membersCount;
    this.locations = uniqueLocations.size;
  }

  // Get active managers recursively from tree for dropdown
  getEligibleManagers(): { id: string; name: string; role: string }[] {
    const list: { id: string; name: string; role: string }[] = [];
    const traverse = (node: HierarchyNode) => {
      const roleUpper = node.role.toUpperCase();
      if (roleUpper === 'MANAGER' || (roleUpper.includes('MANAGER') && !roleUpper.includes('COUNSELLOR'))) {
        list.push({ id: node.id, name: node.name, role: node.role });
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    this.organizationTree.forEach(traverse);
    return list;
  }

  // Get assignable employees from the dynamically fetched pool
  getAssignableEmployees(): any[] {
    const managerId = this.assignmentForm.get('managerId')?.value;
    if (!managerId) {
      return [];
    }

    const managerNode = this.findNodeById(this.organizationTree, managerId);
    if (!managerNode) {
      return [];
    }

    return this.assignableEmployeesPool.filter(emp => {
      // Exclude manager themselves
      if (emp.id === managerId) return false;

      // Exclude if already direct report of this manager
      if (managerNode.children && managerNode.children.some(c => c.id === emp.id)) return false;

      // Apply search term filter
      if (this.searchTerm.trim() !== '') {
        const query = this.searchTerm.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(query);
        const matchesRole = emp.role.toLowerCase().includes(query);
        return matchesName || matchesRole;
      }

      return true;
    });
  }

  // Filtered tree by location (keeps nodes matching or having descendants matching location)
  getFilteredTree(): HierarchyNode[] {
    if (this.selectedLocation === 'All Locations') {
      return this.organizationTree;
    }
    return this.filterTreeNodes(this.organizationTree, this.selectedLocation);
  }

  private filterTreeNodes(nodes: HierarchyNode[], location: string): HierarchyNode[] {
    const result: HierarchyNode[] = [];
    for (const node of nodes) {
      const filteredChildren = node.children ? this.filterTreeNodes(node.children, location) : [];
      const matchesLocation = node.location.toLowerCase() === location.toLowerCase();
      const hasMatchingChildren = filteredChildren.length > 0;
      
      if (matchesLocation || hasMatchingChildren) {
        result.push({
          ...node,
          children: filteredChildren
        });
      }
    }
    return result;
  }

  // Find node by ID recursively
  findNodeById(nodes: HierarchyNode[], id: string): HierarchyNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // Remove node by ID recursively
  removeNodeFromTree(nodes: HierarchyNode[], id: string): HierarchyNode | null {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        const removed = nodes[i];
        nodes.splice(i, 1);
        return removed;
      }
      if (nodes[i].children) {
        const removed = this.removeNodeFromTree(nodes[i].children!, id);
        if (removed) {
          nodes[i].reportsCount = nodes[i].children!.length;
          return removed;
        }
      }
    }
    return null;
  }

  // Add node to manager by ID recursively
  addNodeToManager(nodes: HierarchyNode[], managerId: string, nodeToAdd: HierarchyNode): boolean {
    for (const node of nodes) {
      if (node.id === managerId) {
        if (!node.children) {
          node.children = [];
        }
        node.children.push(nodeToAdd);
        node.reportsCount = node.children.length;
        node.expanded = true;
        return true;
      }
      if (node.children) {
        const added = this.addNodeToManager(node.children, managerId, nodeToAdd);
        if (added) {
          node.reportsCount = node.children.length;
          return true;
        }
      }
    }
    return false;
  }

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

  // Selection handlers
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

  // Perform Quick Assignment action
  saveAssignment(): void {
    const { managerId, employeeIds } = this.assignmentForm.value;
    if (!managerId || !employeeIds || employeeIds.length === 0) {
      return;
    }

    const managerNode = this.findNodeById(this.organizationTree, managerId);
    if (!managerNode) {
      this.notificationService.showErrorToast('Selected manager not found.');
      return;
    }

    const numericManagerIdMatch = managerId.match(/\d+$/);
    const numericManagerId = numericManagerIdMatch ? parseInt(numericManagerIdMatch[0], 10) : null;
    
    if (!numericManagerId) {
      this.notificationService.showErrorToast('Invalid manager ID.');
      return;
    }

    const numericEmployeeIds = employeeIds.map((id: string) => {
      const match = id.match(/\d+$/);
      return match ? parseInt(match[0], 10) : null;
    }).filter((id: number | null) => id !== null) as number[];

    const payload = {
      managerId: numericManagerId,
      userIds: numericEmployeeIds
    };

    this.hierarchyService.assignEmployee(payload).subscribe({
      next: () => {
        let assignedCount = 0;
        employeeIds.forEach((empId: string) => {
          // 1. Remove from old parent if exists
          const existingNode = this.removeNodeFromTree(this.organizationTree, empId);

          // 2. Reuse node if exists, else construct new
          let nodeToAdd: HierarchyNode;
          if (existingNode) {
            nodeToAdd = existingNode;
          } else {
            const poolItem = this.assignableEmployeesPool.find(e => e.id === empId);
            if (poolItem) {
              nodeToAdd = {
                id: poolItem.id,
                name: poolItem.name,
                initials: poolItem.initials,
                role: poolItem.role,
                location: poolItem.location,
                reportsCount: 0,
                expanded: false,
                children: [],
                color: this.getRoleColorClass(poolItem.role)
              };
              // Remove from unassigned pool since they are now assigned
              this.assignableEmployeesPool = this.assignableEmployeesPool.filter(e => e.id !== empId);
            } else {
              return;
            }
          }

          // 3. Append to selected manager
          this.addNodeToManager(this.organizationTree, managerId, nodeToAdd);
          assignedCount++;
        });

        this.calculateStats();
        this.assignmentForm.get('employeeIds')?.setValue([]);
        
        this.notificationService.showSuccessToast(
          `Successfully assigned ${assignedCount} employee(s) to ${managerNode.name}.`,
          'Assignment Saved'
        );
      },
      error: (err) => {
        this.notificationService.showErrorToast('Failed to assign employees. Please try again.');
        console.error(err);
      }
    });
  }

  cancelAssignment(): void {
    this.assignmentForm.reset();
    this.searchTerm = '';
  }

  unassignNode(node: HierarchyNode): void {
    const numericIdMatch = node.id.match(/\d+$/);
    if (!numericIdMatch) {
      this.notificationService.showErrorToast('Invalid employee ID.');
      return;
    }
    const numericId = parseInt(numericIdMatch[0], 10);

    this.notificationService.showErrorPopup(
      `Are you sure you want to unassign ${node.name} from the hierarchy?`,
      'Confirm Unassign',
      'Unassign'
    ).subscribe((confirmed) => {
      if (confirmed) {
        let request$;
        if (node.role && node.role.toUpperCase().includes('JUNIOR COUNSELLOR')) {
          request$ = this.hierarchyService.unassignJuniorCounsellor(numericId);
        } else {
          request$ = this.hierarchyService.unassignEmployee(numericId);
        }

        request$.subscribe({
          next: () => {
            const removed = this.removeNodeFromTree(this.organizationTree, node.id);
            if (removed) {
              // Add back to unassigned pool
              this.assignableEmployeesPool.push({
                id: removed.id,
                name: removed.name,
                role: removed.role,
                location: removed.location,
                initials: removed.initials
              });

              // If the form had this node selected as manager, clear it
              const currentManagerId = this.assignmentForm.get('managerId')?.value;
              if (currentManagerId === node.id) {
                this.assignmentForm.get('managerId')?.setValue('');
                this.assignmentForm.get('employeeIds')?.setValue([]);
              }
              this.calculateStats();
              this.notificationService.showSuccessToast(
                `${node.name} has been unassigned from the hierarchy.`,
                'Unassigned'
              );
            }
          },
          error: (err) => {
            console.error(err);
            this.notificationService.showErrorToast('Failed to unassign employee.');
          }
        });
      }
    });
  }

  // Shortcut link under card
  addTeamMember(manager: HierarchyNode): void {
    if (!manager.branchId) {
      this.notificationService.showErrorToast('Cannot assign employees: Manager branch information is missing.');
      return;
    }

    const numericIdMatch = manager.id.match(/\d+$/);
    if (!numericIdMatch) {
      this.notificationService.showErrorToast('Invalid manager ID.');
      return;
    }

    const dialogRef = this.dialog.open(HierarchyAssignDialogComponent, {
      width: '450px',
      panelClass: 'h-dialog-container',
      data: {
        managerId: manager.id,
        numericManagerId: parseInt(numericIdMatch[0], 10),
        managerName: manager.name,
        branchId: manager.branchId,
        managerRole: manager.role
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // If assigned successfully, reload the tree to see the new nodes
        this.loadData();
      }
    });
  }

  getRoleColorClass(role: string): string {
    const r = role.toUpperCase();
    if (r.includes('MANAGER')) {
      return 'bg-light-primary text-primary';
    } else if (r.includes('SENIOR COUNSELLOR')) {
      return 'bg-light-success text-success';
    } else if (r.includes('JUNIOR COUNSELLOR')) {
      return 'bg-light-warning text-warning';
    } else if (r.includes('EMPLOYEE')) {
      return 'bg-light-accent text-accent';
    } else if (r.includes('REFERRAL')) {
      return 'bg-light-warning text-warning';
    } else if (r.includes('COMPANY')) {
      return 'bg-light-primary text-primary';
    }
    return 'bg-light-primary text-primary';
  }

  trackByNodeId(_: number, node: HierarchyNode): string {
    return node.id;
  }

  trackByManagerId(_: number, mgr: { id: string }): string {
    return mgr.id;
  }

  trackByEmpId(_: number, emp: { id: string }): string {
    return emp.id;
  }

  trackByString(_: number, val: string): string {
    return val;
  }
}
