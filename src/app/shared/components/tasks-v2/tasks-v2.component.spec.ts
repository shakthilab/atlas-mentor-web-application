import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksV2Component } from './tasks-v2.component';

describe('TasksV2Component', () => {
  let component: TasksV2Component;
  let fixture: ComponentFixture<TasksV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksV2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TasksV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
