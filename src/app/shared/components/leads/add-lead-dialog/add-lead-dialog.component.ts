import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MasterDataService, MobileCountryCode, Branch } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { DocumentViewDialogComponent } from '../document-view-dialog/document-view-dialog.component';
import { LEAD_PRIORITY_TIERS, LEAD_BACKGROUND_OPTIONS, getSubCategoriesForTier, LeadPrioritySubCategoryOption } from '../../../constants/lead-classification.constants';

@Component({
  selector: 'app-add-lead-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    TablerIconsModule,
    DocumentViewDialogComponent
  ],
  template: `
    <div class="onboarding-container d-flex">
      <!-- Left Sidebar -->
      <div class="stepper-sidebar p-32 d-flex flex-column border-right">
        <!-- Header -->
        <div class="d-flex align-items-center m-b-48">
          <div class="icon-box bg-primary-light text-primary rounded m-r-16 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
            <i-tabler name="school" class="icon-24"></i-tabler>
          </div>
          <div>
            <h5 class="mat-subtitle-1 f-w-700 m-b-0 f-s-16 text-dark">Student Onboarding</h5>
            <span class="f-s-12 text-muted">Admissions pipeline</span>
          </div>
        </div>
        
        <!-- Steps -->
        <div class="step-list position-relative">
          <div class="step-line-bg"></div>
          
          <div *ngFor="let step of steps; let i = index" class="step-item d-flex align-items-center m-b-32 position-relative z-1" [class.active]="currentStep === i + 1" [class.completed]="currentStep > i + 1">
            <div class="step-circle m-r-16 d-flex align-items-center justify-content-center" 
                 [class.completed]="currentStep > i + 1" 
                 [class.active]="currentStep === i + 1" 
                 [class.pending]="currentStep < i + 1">
              <i-tabler *ngIf="currentStep > i + 1" name="check" class="icon-16"></i-tabler>
              <i-tabler *ngIf="currentStep <= i + 1" [name]="step.icon" class="icon-16"></i-tabler>
            </div>
            <div class="step-text">
              <h6 class="f-w-700 m-b-4" [ngClass]="currentStep >= i + 1 ? 'text-dark' : 'text-muted'">{{ step.title }}</h6>
              <span class="f-s-12 text-muted">{{ step.subtitle }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Content Area -->
      <div class="step-content-area flex-1-auto d-flex flex-column bg-white">
        <!-- Header -->
        <div class="dialog-header d-flex justify-content-between align-items-center p-x-32 p-y-24 border-bottom position-relative">
          <div class="d-flex flex-column">
            <div class="d-flex align-items-center gap-8 m-b-4">
              <h2 class="mat-headline-6 f-w-700 m-b-0 text-dark">{{ dialogTitle }}</h2>
            </div>
            <span class="f-s-12 text-muted">Step {{ currentStep }} of 4 · {{ steps[currentStep - 1].title }}</span>
          </div>
          <button mat-icon-button mat-dialog-close class="text-muted border-0 bg-transparent cursor-pointer">
            <i-tabler name="x" class="icon-20"></i-tabler>
          </button>
          
          <!-- Progress bar indicator -->
          <div class="progress-bar-container">
            <div class="progress-bar-fill" [style.width.%]="currentStep * 25"></div>
          </div>
        </div>

        <!-- Body -->
        <div class="dialog-body p-32 flex-1-auto overflow-y-auto" [formGroup]="onboardingForm">
          
          <!-- STEP 1: Personal Information -->
          <ng-container *ngIf="currentStep === 1">
          <div formGroupName="personalInfo">
            <div class="row">
              <div class="col-sm-6 m-b-20">
                <mat-label class="field-label d-block">FIRST NAME <span class="text-danger">*</span></mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="user" class="icon-18"></i-tabler></mat-icon>
                  <input matInput formControlName="firstName" placeholder="e.g. John">
                  <mat-error *ngIf="onboardingForm.get('personalInfo.firstName')?.hasError('required')">First name is required</mat-error>
                </mat-form-field>
              </div>
              <div class="col-sm-6 m-b-20">
                <mat-label class="field-label d-block">LAST NAME <span class="text-danger">*</span></mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="user" class="icon-18"></i-tabler></mat-icon>
                  <input matInput formControlName="lastName" placeholder="e.g. Doe">
                  <mat-error *ngIf="onboardingForm.get('personalInfo.lastName')?.hasError('required')">Last name is required</mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="m-b-20">
              <mat-label class="field-label d-block">PHONE NUMBER <span class="text-danger">*</span></mat-label>
              <div class="d-flex gap-12 align-items-start phone-row">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="code-select-field">
                  <mat-select formControlName="countryCode" (selectionChange)="onCountryCodeChange($event.value)">
                    <mat-select-trigger>
                      <span class="d-flex align-items-center gap-6">
                        <img *ngIf="selectedMcc?.flagUrl" [src]="selectedMcc!.flagUrl" width="20" height="14" class="flag-img" onerror="this.style.display='none'">
                        <span class="f-s-14 f-w-500">{{ selectedMcc?.mobileCode || onboardingForm.get('personalInfo.countryCode')?.value }}</span>
                      </span>
                    </mat-select-trigger>
                    <mat-option *ngIf="mccLoading">Loading...</mat-option>
                    <mat-option *ngFor="let mcc of mccList" [value]="mcc.mobileCode">
                      <span class="d-flex align-items-center gap-8">
                        <img [src]="mcc.flagUrl" width="20" height="14" class="flag-img" onerror="this.style.display='none'">
                        <span class="f-s-14">{{ mcc.mobileCode }} {{ mcc.countryName }}</span>
                      </span>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1 custom-field" subscriptSizing="dynamic">
                  <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="phone" class="icon-18"></i-tabler></mat-icon>
                  <input matInput formControlName="phone" [placeholder]="phonePlaceholder" inputmode="numeric"
                    [maxlength]="selectedMcc?.mobileNumberLength || 15"
                    (keypress)="onPhoneKeypress($event)">
                  <mat-error *ngIf="onboardingForm.get('personalInfo.phone')?.hasError('required')">Phone is required</mat-error>
                  <mat-error *ngIf="onboardingForm.get('personalInfo.phone')?.hasError('phoneLength')">Must be exactly {{ selectedMcc?.mobileNumberLength }} digits</mat-error>
                  <mat-error *ngIf="onboardingForm.get('personalInfo.phone')?.hasError('pattern')">Digits only</mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="m-b-20">
              <mat-label class="field-label d-block">EMAIL ADDRESS</mat-label>
              <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="mail" class="icon-18"></i-tabler></mat-icon>
                <input matInput formControlName="email" type="email" placeholder="student@example.com">
              </mat-form-field>
            </div>

            <div class="row">
              <div class="col-sm-6 m-b-20">
                <mat-label class="field-label d-block">ASSIGN TO BRANCH <span class="text-danger">*</span></mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="branchId" placeholder="Select Branch" (selectionChange)="onBranchChange($event.value)">
                    <mat-option *ngIf="branchLoading">Loading...</mat-option>
                    <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.name }}</mat-option>
                  </mat-select>
                  <mat-error *ngIf="onboardingForm.get('personalInfo.branchId')?.hasError('required')">Branch selection is required</mat-error>
                </mat-form-field>
              </div>

              <div class="col-sm-6 m-b-20">
                <mat-label class="field-label d-block">ASSIGN TO COUNSELLOR</mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="counsellor" [placeholder]="counsellorLoading ? 'Loading...' : 'Unassigned'" [disabled]="counsellorLoading">
                    <mat-option *ngIf="counsellorLoading">Loading...</mat-option>
                    <mat-option *ngIf="!counsellorLoading && counsellors.length === 0">No counsellors found</mat-option>
                    <mat-option *ngFor="let c of counsellors" [value]="c.id">
                      <span style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                        <span>{{ c.name }}</span>
                        <span [style]="c.roleLabel === 'Senior'
                          ? 'font-size:11px;font-weight:600;margin-left:8px;background:rgba(45,46,50,0.12);color:#2D2E32;padding:2px 10px;border-radius:10px;'
                          : 'font-size:11px;font-weight:600;margin-left:8px;background:rgba(19,222,185,0.12);color:#13deb9;padding:2px 10px;border-radius:10px;'">
                          {{ c.roleLabel }}
                        </span>
                      </span>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="m-b-20">
              <mat-label class="field-label d-block">LEAD SOURCE</mat-label>
              <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                <mat-select formControlName="leadSourceSelect" placeholder="Select lead source" (selectionChange)="onLeadSourceChange($event.value)">
                  <mat-option *ngFor="let source of leadSources" [value]="source.enum">{{ source.displayName }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="m-b-20" *ngIf="onboardingForm.get('personalInfo.leadSourceSelect')?.value === 'PERSON' || onboardingForm.get('personalInfo.leadSourceSelect')?.value === 'OTHER'">
              <mat-label class="field-label d-block">
                {{ onboardingForm.get('personalInfo.leadSourceSelect')?.value === 'PERSON' ? 'Person Referral Name' : 'Specify Other Source' }} <span class="text-danger">*</span>
              </mat-label>
              <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                <input matInput formControlName="sourceCustomText" [placeholder]="onboardingForm.get('personalInfo.leadSourceSelect')?.value === 'PERSON' ? 'Enter referrer name' : 'Enter source details'">
                <mat-error *ngIf="onboardingForm.get('personalInfo.sourceCustomText')?.invalid">This field is required</mat-error>
              </mat-form-field>
            </div>
          </div>

          <!-- Priority / Background classification -->
          <div formGroupName="leadClassification">
            <div class="row">
              <div class="col-sm-6 m-b-20">
                <mat-label class="field-label d-block">LEAD CLASSIFICATION</mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="priority" placeholder="Select priority" (selectionChange)="onPriorityChange($event.value)">
                    <mat-option value="">Not set</mat-option>
                    <mat-option *ngFor="let tier of priorityTiers" [value]="tier.value">{{ tier.label }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-sm-6 m-b-20">
                <mat-label class="field-label d-block">PRIORITY SUBCATEGORY</mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="prioritySubCategory"
                    [placeholder]="onboardingForm.get('leadClassification.priority')?.value ? 'Select subcategory' : 'Select a priority first'"
                    [disabled]="!onboardingForm.get('leadClassification.priority')?.value">
                    <mat-option *ngFor="let sub of currentSubCategories" [value]="sub.value">{{ sub.label }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="m-b-20">
              <mat-label class="field-label d-block">BACKGROUND</mat-label>
              <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                <mat-select formControlName="background" placeholder="Select background">
                  <mat-option value="">Not set</mat-option>
                  <mat-option *ngFor="let bg of backgroundOptions" [value]="bg.value">{{ bg.label }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
          </ng-container>

          <!-- STEP 2: Destination Details -->
          <ng-container *ngIf="currentStep === 2" formGroupName="destinationDetails">
            <div class="row">
              <div class="col-sm-6 m-b-24">
                <mat-label class="field-label d-block">DESTINATION COUNTRY</mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="countryId" placeholder="Select country" (selectionChange)="onCountryChange($event.value)">
                    <mat-option [value]="null">Not set</mat-option>
                    <mat-option *ngIf="countriesLoading">Loading...</mat-option>
                    <mat-option *ngFor="let c of countries" [value]="c.id">{{ c.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-sm-6 m-b-24">
                <mat-label class="field-label d-block">TARGET UNIVERSITY</mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="universityId"
                    [placeholder]="universitiesLoading ? 'Loading...' : (onboardingForm.get('destinationDetails.countryId')?.value ? 'Select a university' : 'Select a country first')"
                    [disabled]="universitiesLoading || !onboardingForm.get('destinationDetails.countryId')?.value">
                    <mat-option [value]="null">Not set</mat-option>
                    <mat-option *ngIf="universitiesLoading">Loading...</mat-option>
                    <mat-option *ngIf="!universitiesLoading && universities.length === 0 && onboardingForm.get('destinationDetails.countryId')?.value">No universities found</mat-option>
                    <mat-option *ngFor="let u of universities" [value]="u.id">{{ u.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="row">
              <div class="col-sm-6 m-b-24">
                <mat-label class="field-label d-block">COURSE NAME</mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="course" placeholder="Select course">
                    <mat-option value="">Not set</mat-option>
                    <mat-option value="MBBS">MBBS</mat-option>
                    <mat-option value="MD">MD</mat-option>
                    <mat-option value="BDS">BDS</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-sm-6 m-b-24">
                <mat-label class="field-label d-block">INTAKE PERIOD</mat-label>
                <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                  <mat-select formControlName="intake" placeholder="Select intake year">
                    <mat-option value="2026">2026</mat-option>
                    <mat-option value="2027">2027</mat-option>
                    <mat-option value="2028">2028</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <!-- Styled summary info alert box -->
            <div class="info-alert-box p-20 rounded m-t-16 d-flex align-items-start">
              <div class="icon-box text-primary rounded-circle m-r-12 d-flex align-items-center justify-content-center bg-primary-light" style="width: 32px; height: 32px; flex-shrink: 0;">
                <i-tabler name="info-circle" class="icon-18"></i-tabler>
              </div>
              <div class="d-flex flex-column">
                <span class="f-s-14 f-w-700 text-dark">Application summary</span>
                <span class="f-s-12 text-muted m-t-4 leading-relaxed">Destination and course drive eligibility checks and the document checklist in step 4. You can revise these later from the student record.</span>
              </div>
            </div>
          </ng-container>

          <!-- STEP 3: Academic History -->
          <ng-container *ngIf="currentStep === 3" formGroupName="academicHistory">
            <div class="row card-grid">
              <!-- 10th Standard Card -->
              <div class="col-md-6 m-b-24">
                <div class="academic-card border rounded p-24 h-100 position-relative">
                  <div class="d-flex justify-content-between align-items-center m-b-20">
                    <span class="card-title-text f-w-700 text-dark">10th Standard</span>
                    <span class="required-badge text-muted f-s-10 f-w-700 border rounded p-x-8 p-y-4">Required</span>
                  </div>
                  <div class="row" formGroupName="tenth">
                    <div class="col-12 m-b-16">
                      <mat-label class="field-label d-block">INSTITUTION NAME</mat-label>
                      <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                        <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="school" class="icon-18"></i-tabler></mat-icon>
                        <input matInput formControlName="institution" placeholder="School / board name">
                      </mat-form-field>
                    </div>
                    <div class="col-6">
                      <mat-label class="field-label d-block">PASSING YEAR</mat-label>
                      <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                        <mat-select formControlName="year" placeholder="Year">
                          <mat-option *ngFor="let y of passingYears" [value]="y">{{ y }}</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="col-6">
                      <mat-label class="field-label d-block">SCORE / CGPA</mat-label>
                      <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                        <input matInput formControlName="score" type="number" min="0" max="100" placeholder="e.g. 89.4%">
                        <mat-error *ngIf="onboardingForm.get('academicHistory.tenth.score')?.hasError('min')">Cannot be negative</mat-error>
                        <mat-error *ngIf="onboardingForm.get('academicHistory.tenth.score')?.hasError('max')">Cannot exceed 100</mat-error>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 12th Standard Card -->
              <div class="col-md-6 m-b-24">
                <div class="academic-card border rounded p-24 h-100 position-relative">
                  <div class="d-flex justify-content-between align-items-center m-b-20">
                    <span class="card-title-text f-w-700 text-dark">12th Standard</span>
                    <span class="required-badge text-muted f-s-10 f-w-700 border rounded p-x-8 p-y-4">Required</span>
                  </div>
                  <div class="row" formGroupName="twelfth">
                    <div class="col-12 m-b-16">
                      <mat-label class="field-label d-block">INSTITUTION NAME</mat-label>
                      <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                        <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="school" class="icon-18"></i-tabler></mat-icon>
                        <input matInput formControlName="institution" placeholder="School / board name">
                      </mat-form-field>
                    </div>
                    <div class="col-6">
                      <mat-label class="field-label d-block">PASSING YEAR</mat-label>
                      <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                        <mat-select formControlName="year" placeholder="Year">
                          <mat-option *ngFor="let y of passingYears" [value]="y">{{ y }}</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="col-6">
                      <mat-label class="field-label d-block">SCORE / CGPA</mat-label>
                      <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                        <input matInput formControlName="score" type="number" min="0" max="100" placeholder="e.g. 89.4%">
                        <mat-error *ngIf="onboardingForm.get('academicHistory.twelfth.score')?.hasError('min')">Cannot be negative</mat-error>
                        <mat-error *ngIf="onboardingForm.get('academicHistory.twelfth.score')?.hasError('max')">Cannot exceed 100</mat-error>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dynamic Graduation Entries -->
            <div *ngFor="let g of graduations; let gi = index" class="academic-card border rounded p-24 m-b-24 position-relative">
              <div class="d-flex justify-content-between align-items-center m-b-20">
                <span class="card-title-text f-w-700 text-dark">Graduation {{ gi + 1 }}</span>
                <button class="remove-btn bg-transparent border-0 d-flex align-items-center gap-4 text-muted cursor-pointer f-w-600 f-s-12" (click)="removeGraduation(gi)" type="button">
                  <i-tabler name="trash" class="icon-14 text-danger"></i-tabler> Remove
                </button>
              </div>
              <div class="row">
                <div class="col-md-6 m-b-16">
                  <mat-label class="field-label d-block">INSTITUTION / UNIVERSITY NAME</mat-label>
                  <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="school" class="icon-18"></i-tabler></mat-icon>
                    <input matInput [(ngModel)]="g.institution" [ngModelOptions]="{standalone: true}" placeholder="University / college name">
                  </mat-form-field>
                </div>
                <div class="col-md-6 m-b-16">
                  <mat-label class="field-label d-block">DEGREE / COURSE</mat-label>
                  <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="certificate" class="icon-18"></i-tabler></mat-icon>
                    <input matInput [(ngModel)]="g.degree" [ngModelOptions]="{standalone: true}" placeholder="e.g. B.Sc, B.Com, B.Tech">
                  </mat-form-field>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 m-b-16">
                  <mat-label class="field-label d-block">BOARD / UNIVERSITY</mat-label>
                  <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="school" class="icon-18"></i-tabler></mat-icon>
                    <input matInput [(ngModel)]="g.boardUniversity" [ngModelOptions]="{standalone: true}" placeholder="Board or University name">
                  </mat-form-field>
                </div>
                <div class="col-md-6 m-b-16">
                  <mat-label class="field-label d-block">STREAM</mat-label>
                  <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="subtask" class="icon-18"></i-tabler></mat-icon>
                    <input matInput [(ngModel)]="g.stream" [ngModelOptions]="{standalone: true}" placeholder="e.g. Biology, Computer Science">
                  </mat-form-field>
                </div>
              </div>
              <div class="row">
                <div class="col-6">
                  <mat-label class="field-label d-block">PASSING YEAR</mat-label>
                  <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                    <mat-select [(ngModel)]="g.year" [ngModelOptions]="{standalone: true}" placeholder="Year">
                      <mat-option *ngFor="let y of passingYears" [value]="y">{{ y }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="col-6">
                  <mat-label class="field-label d-block">SCORE / CGPA</mat-label>
                  <mat-form-field appearance="outline" class="w-100 custom-field" subscriptSizing="dynamic">
                    <input matInput [(ngModel)]="g.score" [ngModelOptions]="{standalone: true}" placeholder="e.g. 8.2 CGPA">
                  </mat-form-field>
                </div>
              </div>
            </div>

            <!-- Add Graduation Button -->
            <button mat-button class="btn-add-graduation w-100 m-b-24 d-flex align-items-center justify-content-center gap-8 cursor-pointer" (click)="addGraduation()" type="button">
              <i-tabler name="plus" class="icon-18"></i-tabler> Add graduation
            </button>
          </ng-container>

          <!-- STEP 4: Documents -->
          <ng-container *ngIf="currentStep === 4" formGroupName="documents">
            <!-- Summary Card -->
            <div class="docs-header-card border rounded p-24 m-b-24">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex flex-column">
                  <h6 class="docs-title-text f-w-700 m-b-4 text-dark">Required documents</h6>
                  <span class="f-s-12 text-muted">Upload each document individually - PDF, JPG or PNG</span>
                </div>
                <span class="uploaded-count-badge f-s-11 f-w-700 border rounded p-x-8 p-y-4">
                  {{ countUploadedDocs() }} / {{ requiredDocs.length }} uploaded
                </span>
              </div>
            </div>

            <!-- Required Docs Grid -->
            <div class="row doc-grid">
              <div class="col-xl-6 col-12 m-b-16" *ngFor="let doc of requiredDocs; let i = index">
                <!-- Pending State -->
                <div *ngIf="!doc.file && !doc.uploadedUrl" class="d-flex align-items-center justify-content-between p-16 border rounded bg-white doc-item-card">
                  <div class="d-flex align-items-center overflow-hidden flex-1" style="min-width: 0;">
                    <div class="doc-icon-wrapper pending m-r-12">
                      <i-tabler name="file-text" class="icon-18 text-muted"></i-tabler>
                    </div>
                    <div class="d-flex flex-column overflow-hidden flex-1" style="min-width: 0;">
                      <span class="f-s-14 f-w-700 text-dark text-truncate d-block w-100" [title]="doc.name">{{ doc.name }}</span>
                      <span class="f-s-11 text-muted text-truncate d-block w-100">PDF, JPG or PNG · up to 10 MB</span>
                    </div>
                  </div>
                  <input type="file" #singleFileInput style="display: none;" (change)="onSingleFileSelected($event, i)">
                  <button mat-button class="btn-doc-upload flex-shrink-0 d-flex align-items-center gap-6" (click)="singleFileInput.click()" type="button">
                    <i-tabler name="paperclip" class="icon-14"></i-tabler> Upload
                  </button>
                </div>
                
                <!-- Server-uploaded State (pre-existing doc from API) -->
                <div *ngIf="!doc.file && doc.uploadedUrl" class="d-flex align-items-center justify-content-between p-16 border rounded doc-item-card uploaded-state">
                  <div class="d-flex align-items-center overflow-hidden flex-1" style="min-width: 0;">
                    <div class="doc-icon-wrapper uploaded m-r-12">
                      <i-tabler name="check" class="icon-18 green-check-icon"></i-tabler>
                    </div>
                    <div class="d-flex flex-column overflow-hidden flex-1" style="min-width: 0;">
                      <span class="f-s-14 f-w-700 text-dark text-truncate d-block w-100" [title]="doc.name">{{ doc.name }}</span>
                      <span class="f-s-11 text-muted text-truncate d-block w-100">Already uploaded</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-8 flex-shrink-0">
                    <!-- Three-dots action menu -->
                    <button mat-icon-button [matMenuTriggerFor]="docMenu" class="icon-btn-action text-muted flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; border-radius: 50%; min-width: 32px; padding: 0;" type="button">
                      <i-tabler name="dots-vertical" class="icon-16"></i-tabler>
                    </button>
                    <mat-menu #docMenu="matMenu" class="duplicate-menu-panel" xPosition="before">
                      <button mat-menu-item (click)="viewServerDocument(doc.serverDoc)" [disabled]="!doc.serverDoc?.id" type="button">
                        <i-tabler name="eye" class="icon-16 m-r-8"></i-tabler>
                        <span>View</span>
                      </button>
                      <button mat-menu-item (click)="downloadServerDocument(doc.serverDoc)" [disabled]="!doc.serverDoc?.id" type="button">
                        <i-tabler name="download" class="icon-16 m-r-8"></i-tabler>
                        <span>Download</span>
                      </button>
                    </mat-menu>

                    <input type="file" #replaceFileInput style="display: none;" (change)="onSingleFileSelected($event, i)">
                    <button mat-button class="btn-doc-replace flex-shrink-0 d-flex align-items-center gap-6" (click)="replaceFileInput.click()" type="button">
                      <i-tabler name="paperclip" class="icon-14"></i-tabler> Replace
                    </button>
                  </div>
                </div>
                
                <!-- New File Uploaded State -->
                <div *ngIf="doc.file" class="d-flex align-items-center justify-content-between p-16 border rounded doc-item-card uploaded-state">
                  <div class="d-flex align-items-center overflow-hidden flex-1" style="min-width: 0;">
                    <div class="doc-icon-wrapper uploaded m-r-12">
                      <i-tabler name="check" class="icon-18 green-check-icon"></i-tabler>
                    </div>
                    <div class="d-flex flex-column overflow-hidden flex-1" style="min-width: 0;">
                      <span class="f-s-14 f-w-700 text-dark text-truncate d-block w-100" [title]="doc.name">{{ doc.name }}</span>
                      <span class="f-s-11 text-muted text-truncate d-block w-100" [title]="doc.file.name">{{ doc.file.name }} ({{ formatBytes(doc.file.size) }})</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-8 flex-shrink-0">
                    <input type="file" #replaceFileInputNew style="display: none;" (change)="onSingleFileSelected($event, i)">
                    <button mat-button class="btn-doc-replace flex-shrink-0 d-flex align-items-center gap-6" (click)="replaceFileInputNew.click()" type="button">
                      <i-tabler name="paperclip" class="icon-14"></i-tabler> Replace
                    </button>
                    <button mat-icon-button class="icon-btn-action text-danger flex-shrink-0" (click)="removeUploadedFile(i)" type="button">
                      <i-tabler name="trash" class="icon-16"></i-tabler>
                    </button>
                  </div>
                </div>
              </div>
            </div>

           </ng-container>

        </div>

        <!-- Footer -->
        <div class="dialog-footer p-x-32 p-y-24 border-top d-flex justify-content-between align-items-center bg-white">
          <button mat-stroked-button (click)="previousStep()" [disabled]="currentStep === 1">
            <i-tabler name="arrow-left" class="icon-18 m-r-8"></i-tabler> Previous
          </button>
          
          <button *ngIf="currentStep < 4" mat-flat-button color="primary" (click)="nextStep()">
            Next <i-tabler name="arrow-right" class="icon-18 m-l-8"></i-tabler>
          </button>

          <button *ngIf="currentStep === 4" mat-flat-button color="primary" (click)="submit()">
            {{ isEditMode ? 'Save Changes' : 'Create Student' }} <i-tabler name="check" class="icon-18 m-l-8"></i-tabler>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      height: 100%;
      width: 100%;
      overflow: hidden;
      overflow-x: hidden !important;
      background-color: var(--mat-dialog-container-color, #ffffff);
      font-family: 'Outfit', 'Inter', sans-serif;
    }

    .step-content-area {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .dialog-header {
      border-bottom: 1px solid #e2e8f0;
      position: relative;
    }

    .progress-bar-container {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: #f1f5f9;
      z-index: 5;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: #2563eb;
      transition: width 0.3s ease;
    }

    .badge-draft {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0 !important;
      color: #64748b !important;
      font-size: 10px;
    }

    .dialog-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden !important;
      background-color: #ffffff;
    }

    .field-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    /* Custom outline fields to look clean & premium */
    .custom-field {
      width: 100%;
      display: block;
      
      ::ng-deep {
        .mdc-text-field--outlined {
          --mdc-outlined-text-field-container-shape: 8px;
          background-color: #ffffff;
          
          &:not(.mdc-text-field--disabled) .mdc-outlined-text-field__outline {
            border-color: #e2e8f0 !important;
          }
          
          &:not(.mdc-text-field--disabled):hover .mdc-outlined-text-field__outline {
            border-color: #cbd5e1 !important;
          }
          
          &.mdc-text-field--focused .mdc-outlined-text-field__outline {
            border-color: #2563eb !important;
            border-width: 1.5px !important;
          }
        }
        
        .mat-mdc-form-field-focus-indicator {
          display: none;
        }
        
        /* Error state outline color */
        &.ng-invalid.ng-touched {
          .mdc-outlined-text-field__outline {
            border-color: #f43f5e !important;
          }
        }
        
        .mat-mdc-form-field-flex {
          height: 44px !important;
          align-items: center !important;
        }
        
        .mat-mdc-text-field-wrapper {
          padding: 0 14px !important;
          height: 44px !important;
        }
        
        .mat-mdc-form-field-infix {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
        }

        .mat-mdc-form-field-icon-prefix, .mat-mdc-form-field-prefix {
          padding: 0 !important;
          margin: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        input.mat-mdc-input-element {
          margin: 0 !important;
          padding: 0 !important;
          vertical-align: middle !important;
        }

        .mat-icon {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 18px !important;
          height: 18px !important;
          margin: 0 !important;
        }

        .mat-mdc-select-trigger {
          font-size: 14px;
        }
      }
    }

    /* Custom select style overrides */
    .code-select-field {
      width: 120px;
      flex-shrink: 0;
      display: block;

      ::ng-deep {
        .mdc-text-field--outlined {
          --mdc-outlined-text-field-container-shape: 8px;
          background-color: #ffffff;
          &:not(.mdc-text-field--disabled) .mdc-outlined-text-field__outline {
            border-color: #e2e8f0 !important;
          }
          &.mdc-text-field--focused .mdc-outlined-text-field__outline {
            border-color: #2563eb !important;
          }
        }
        .mat-mdc-form-field-flex {
          height: 44px !important;
          align-items: center;
        }
        .mat-mdc-text-field-wrapper {
          padding: 0 12px !important;
          height: 44px !important;
        }
      }
    }

    .flag-img {
      object-fit: cover;
      border-radius: 2px;
      vertical-align: middle;
    }
    
    .stepper-sidebar {
      width: 300px;
      background-color: #f8fafc;
      flex-shrink: 0;
    }
    
    .bg-primary-light {
      background-color: rgba(37, 99, 235, 0.05);
    }
    
    .text-primary { color: #2563eb !important; }
    .text-success { color: #13deb9 !important; }
    .text-dark { color: #0f172a; }
    .border-right { border-right: 1px solid #e2e8f0; }
    .border-bottom { border-bottom: 1px solid #e2e8f0; }
    .border-top { border-top: 1px solid #e2e8f0; }
    
    /* Stepper UI */
    .step-line-bg {
      position: absolute;
      top: 16px;
      bottom: 44px;
      left: 15px;
      width: 2px;
      background-color: #e2e8f0;
      z-index: 0;
    }
    
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      background-color: #ffffff;
      z-index: 2;
      transition: all 0.3s ease;
      color: #94a3b8;
    }
    
    .step-circle.completed {
      background-color: #2563eb !important;
      border-color: #2563eb !important;
      color: #ffffff !important;
    }
    
    .step-circle.active {
      background-color: #ffffff !important;
      border-color: #2563eb !important;
      color: #2563eb !important;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    }
    
    .step-circle.pending {
      background-color: #ffffff !important;
      border-color: #e2e8f0 !important;
      color: #cbd5e1 !important;
    }

    .icon-btn-action {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      &:hover {
        background-color: #f8fafc;
        color: #0f172a;
        border-color: #cbd5e1;
      }

      &.text-danger:hover {
        background-color: #fef2f2;
        color: #dc2626;
        border-color: #fca5a5;
      }
    }

    /* Destination summary details */
    .info-alert-box {
      background-color: rgba(37, 99, 235, 0.04);
      border: 1px solid rgba(37, 99, 235, 0.1);
      border-radius: 12px;
    }

    /* Academic Cards styling */
    .academic-card {
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      
      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
      }
    }

    .required-badge {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0 !important;
      color: #64748b;
      font-size: 10px;
    }

    .btn-add-graduation {
      border: 1px dashed #cbd5e1 !important;
      background-color: #f8fafc !important;
      border-radius: 10px;
      color: #475569 !important;
      font-weight: 600;
      padding: 12px !important;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #2563eb !important;
        background-color: rgba(37, 99, 235, 0.02) !important;
        color: #2563eb !important;
      }
    }

    .remove-btn {
      transition: color 0.15s ease;
      &:hover {
        color: #ef4444 !important;
      }
    }

    /* Document tab styling */
    .docs-header-card {
      border: 1px solid #e2e8f0;
      background-color: #f8fafc;
      border-radius: 12px;
    }

    .uploaded-count-badge {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0 !important;
      color: #475569;
      font-size: 11px;
    }

    .doc-item-card {
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      border-radius: 12px;
      transition: all 0.2s ease;

      &.uploaded-state {
        border-color: rgba(19, 222, 185, 0.3) !important;
        background-color: rgba(19, 222, 185, 0.03) !important;
      }

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.01);
      }

      &.uploaded-state:hover {
        border-color: #13deb9 !important;
      }
    }

    .doc-icon-wrapper {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.pending {
        background-color: #f1f5f9;
        color: #64748b;
      }
      
      &.uploaded {
        background-color: #e6fcf5;
        color: #0ca678;
      }
    }

    .green-check-icon {
      color: #13deb9 !important;
    }

    .btn-doc-upload, .btn-doc-replace, .btn-other-add {
      background-color: #f1f5f9 !important;
      color: #475569 !important;
      font-weight: 600;
      border-radius: 8px;
      font-size: 12px;
      padding: 6px 14px !important;
      border: 0;
      cursor: pointer;
      transition: background-color 0.15s ease;
      
      &:hover {
        background-color: #e2e8f0 !important;
      }
    }

    .btn-doc-replace {
      background-color: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      
      &:hover {
        background-color: #f8fafc !important;
      }
    }

    .other-docs-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    /* Footer buttons */
    .dialog-footer {
      button[mat-stroked-button] {
        border-radius: 8px;
        border-color: #cbd5e1;
        color: #475569;
        font-weight: 600;
        padding: 8px 18px !important;
        height: 42px;
        
        &:hover {
          background-color: #f8fafc;
        }
      }
      
      button[mat-flat-button] {
        border-radius: 8px;
        font-weight: 600;
        padding: 8px 20px !important;
        height: 42px;
        background-color: #2563eb !important;
        color: #ffffff !important;
        border: 0;
        cursor: pointer;
        
        &:hover {
          background-color: #1d4ed8 !important;
        }

        &[disabled] {
          background-color: #e2e8f0 !important;
          color: #94a3b8 !important;
          cursor: not-allowed;
        }
      }
    }

    /* ==========================================================================
       Responsive & Mobile Optimization
       ========================================================================== */
    @media (max-width: 850px) {
      .onboarding-container {
        flex-direction: column !important;
        height: 100vh !important;
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }

      .stepper-sidebar {
        display: none !important;
      }

      .step-content-area {
        height: 100% !important;
        width: 100% !important;
        max-width: 100% !important;
        display: flex;
        flex-direction: column;
        overflow-x: hidden !important;
      }

      .dialog-header {
        padding: 16px 20px !important;
      }

      .dialog-body {
        padding: 20px !important;
      }

      .dialog-footer {
        padding: 16px 20px !important;
      }

      .row {
        margin-left: 0;
        margin-right: 0;
      }

      .row > [class*="col-"] {
        padding-left: 0;
        padding-right: 0;
        margin-bottom: 16px;
      }

      .phone-row {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 8px !important;
        
        .code-select-field {
          width: 100% !important;
        }
      }
      
      .academic-card {
        padding: 16px !important;
      }
    }

    /* Dark theme support */
    :host-context(.dark-theme) {
      .onboarding-container, .step-content-area, .dialog-footer, .dialog-body {
        background-color: var(--dark-sidebarbg, #1e293b) !important;
      }
      .stepper-sidebar {
        background-color: var(--dark-bodybg, #0c0c0e) !important;
      }
      .border-right, .border-bottom, .border-top, .border, .step-line-bg {
        border-color: var(--dark-formborderColor, #334155) !important;
      }
      .step-circle {
        border-color: var(--dark-formborderColor, #334155);
        background-color: var(--dark-sidebarbg, #1e293b) !important;
      }
      .bg-white { background-color: var(--dark-sidebarbg, #1e293b) !important; }
      .bg-light { background-color: var(--dark-hoverbgcolor, #1e293b) !important; }
      .text-dark { color: #f8fafc !important; }
      mat-label.text-dark { color: #f8fafc !important; }
      .mat-headline-6 { color: #f8fafc; }
      
      .academic-card, .docs-header-card, .doc-item-card, .other-docs-card {
        border-color: var(--dark-formborderColor, #334155) !important;
        background-color: var(--dark-bodybg, #0c0c0e) !important;
      }

      .btn-add-graduation {
        border-color: var(--dark-formborderColor, #334155) !important;
        background-color: var(--dark-bodybg, #0c0c0e) !important;
        color: #cbd5e1 !important;
      }

      .btn-doc-upload, .btn-doc-replace, .btn-other-add {
        background-color: var(--dark-formborderColor, #334155) !important;
        color: #cbd5e1 !important;
      }

      .icon-btn-action {
        border-color: var(--dark-formborderColor, #334155) !important;
        background-color: var(--dark-bodybg, #0c0c0e) !important;
        color: #cbd5e1;
      }

      .custom-field, .code-select-field {
        ::ng-deep .mdc-text-field--outlined {
          background-color: var(--dark-bodybg, #0c0c0e) !important;
          &:not(.mdc-text-field--disabled) .mdc-outlined-text-field__outline {
            border-color: var(--dark-formborderColor, #334155) !important;
          }
        }
      }
    }
  `]
})
export class AddLeadDialogComponent implements OnInit {
  currentStep = 1;

  // MCC
  mccList: MobileCountryCode[] = [];
  mccLoading = true;
  selectedMcc: MobileCountryCode | null = null;
  phonePlaceholder = 'Phone number';

  // Branches
  branches: Branch[] = [];
  branchLoading = true;

  // Countries & Universities
  countries: any[] = [];
  countriesLoading = true;
  universities: any[] = [];
  universitiesLoading = false;

  // Counsellors
  counsellors: { id: number; name: string; roleLabel: string }[] = [];
  counsellorLoading = false;

  // Priority / Background classification (hardcoded, mirrors backend LeadPriority /
  // LeadPrioritySubCategory / LeadBackground enums exactly — see lead-classification.constants.ts)
  priorityTiers = LEAD_PRIORITY_TIERS;
  backgroundOptions = LEAD_BACKGROUND_OPTIONS;

  get currentSubCategories(): LeadPrioritySubCategoryOption[] {
    return getSubCategoriesForTier(this.onboardingForm?.get('leadClassification.priority')?.value);
  }

  /** Subcategory only makes sense for the tier it was chosen under, so switching tiers
   * clears whatever was previously selected rather than leaving a now-invalid value in place. */
  onPriorityChange(_value: string): void {
    this.onboardingForm.get('leadClassification.prioritySubCategory')?.setValue('');
  }

  // Passing years: current year down to 100 years ago
  passingYears: number[] = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Dynamic graduation entries
  graduations: {
    id?: number;
    institution: string;
    degree: string;
    boardUniversity: string;
    year: number | null;
    score: string;
    stream: string;
  }[] = [];

  addGraduation(): void {
    this.graduations.push({
      institution: '',
      degree: '',
      boardUniversity: '',
      year: null,
      score: '',
      stream: ''
    });
  }

  removeGraduation(index: number): void {
    this.graduations.splice(index, 1);
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  getDocumentKey(name: string): string {
    return name.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  base64ToBlob(content: string, fileType: string): Blob {
    const byteArray = Uint8Array.from(atob(content), c => c.charCodeAt(0));
    return new Blob([byteArray], { type: fileType });
  }

  viewServerDocument(serverDoc: any): void {
    if (!serverDoc || !serverDoc.id) return;
    this.http.get<any>(`${environment.apiUrl}/students/documents/${serverDoc.id}/download`)
      .subscribe({
        next: (res) => {
          const docData = res.data || res;
          if (docData && docData.content) {
            const blob = this.base64ToBlob(docData.content, docData.fileType || 'application/pdf');
            const fileURL = URL.createObjectURL(blob);
            
            const dialogRef = this.dialog.open(DocumentViewDialogComponent, {
              width: '900px',
              maxWidth: '95vw',
              data: {
                title: serverDoc.documentType ? serverDoc.documentType.replace(/_/g, ' ') : 'View Document',
                url: fileURL,
                fileType: docData.fileType || 'application/pdf'
              }
            });
            dialogRef.afterClosed().subscribe(() => {
              URL.revokeObjectURL(fileURL);
            });
          }
        },
        error: (err) => {
          console.error('Failed to view document:', err);
        }
      });
  }

  downloadServerDocument(serverDoc: any): void {
    if (!serverDoc || !serverDoc.id) return;
    this.http.get<any>(`${environment.apiUrl}/students/documents/${serverDoc.id}/download`)
      .subscribe({
        next: (res) => {
          const docData = res.data || res;
          if (docData && docData.content) {
            const blob = this.base64ToBlob(docData.content, docData.fileType || 'application/octet-stream');
            const fileURL = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = docData.fileName || serverDoc.documentName || serverDoc.documentType || 'document';
            link.click();
            URL.revokeObjectURL(fileURL);
          }
        },
        error: (err) => {
          console.error('Failed to download document:', err);
        }
      });
  }

  clampScore(g: any): void {
    if (g.score === null || g.score === '') return;
    const v = Number(g.score);
    if (v < 0) g.score = 0;
    if (v > 100) g.score = 100;
  }

  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      let fileIndex = 0;
      for (let i = 0; i < this.requiredDocs.length; i++) {
        if (!this.requiredDocs[i].file && fileIndex < files.length) {
          this.requiredDocs[i].file = files[fileIndex];
          fileIndex++;
        }
      }
    }
    // Clear the input so the same file can be selected again if removed
    event.target.value = '';
  }

  onSingleFileSelected(event: any, index: number): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.requiredDocs[index].file = files[0];
      // clear pre-existing uploaded url since we replaced it with a new local file
      this.requiredDocs[index].uploadedUrl = undefined;
    }
    event.target.value = '';
  }

  countUploadedDocs(): number {
    return this.requiredDocs.filter(d => d.file || d.uploadedUrl).length;
  }

  otherDocs: File[] = [];

  onOtherFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.otherDocs.push(files[i]);
      }
    }
    event.target.value = '';
  }

  removeUploadedFile(index: number): void {
    this.requiredDocs[index].file = null;
    this.requiredDocs[index].uploadedUrl = undefined;
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  steps = [
    { title: 'Personal Information', subtitle: 'Basic details & contact', icon: 'user' },
    { title: 'Destination Details', subtitle: 'Country & University', icon: 'map-pin' },
    { title: 'Academic History', subtitle: 'Previous education', icon: 'school' },
    { title: 'Documents', subtitle: 'Upload certificates', icon: 'file-text' }
  ];

  onboardingForm: FormGroup;
  isEditMode = false;
  dialogTitle = 'Add New Student';

  requiredDocs: { name: string; file?: File | null; uploadedUrl?: string; serverDoc?: any }[] = [
    { name: 'Passport' },
    { name: '10th Marksheet' },
    { name: '12th Marksheet' },
    { name: 'Birth Certificate' },
    { name: 'Police Clearance' },
    { name: 'Bank Statement' },
    { name: 'Insurance Document' },
    { name: 'Neet Scorecard' },
    { name: 'Graduation Certificate' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddLeadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private masterData: MasterDataService,
    private authService: AuthService,
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    this.onboardingForm = this.fb.group({
      personalInfo: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        countryCode: ['+91', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
        email: ['', [Validators.email]],
        branchId: ['', Validators.required],
        counsellor: [''],
        leadSourceSelect: [''],
        sourceCustomText: ['']
      }),
      leadClassification: this.fb.group({
        priority: [''],
        prioritySubCategory: [''],
        background: ['']
      }),
      destinationDetails: this.fb.group({
        countryId: [''],
        universityId: [''],
        course: [''],
        intake: ['']
      }),
      academicHistory: this.fb.group({
        tenth: this.fb.group({
          institution: [''],
          year: [''],
          score: ['', [Validators.min(0), Validators.max(100)]]
        }),
        twelfth: this.fb.group({
          institution: [''],
          year: [''],
          score: ['', [Validators.min(0), Validators.max(100)]]
        })
      }),
      documents: this.fb.group({})
    });
  }

  ngOnInit(): void {
    this.loadMCC();
    this.loadBranches();
    this.loadCountries();
    this.loadLeadSources();

    if (this.data) {
      this.isEditMode = true;
      this.dialogTitle = 'Edit Student';

      // Parse name from user object or direct fields
      const u = this.data.user || this.data;
      const firstName = u.firstName || this.data.firstName || '';
      const lastName = u.lastName || this.data.lastName || '';

      // Personal info
      const phone = u.phone || this.data.phone || '';
      const email = u.email || this.data.email || '';
      const branchId = this.data.branch?.id || this.data.branchId || u.branchId || null;
      const counsellorId = this.data.assignedById || this.data.assignedTo?.id || this.data.assignedEmployee?.id || this.data.counsellor?.id || this.data.assignedBy?.id || this.data.counsellorId || null;
      const countryCode = this.data.mobileCountryCode?.mobileCode || u.mobileCountryCode?.mobileCode || '+91';

      // Destination details
      const countryId = this.data.country?.id || this.data.countryId || null;
      const universityId = this.data.university?.id || this.data.universityId || null;
      const course = this.data.courseName || this.data.course || '';
      const intake = this.data.intakePeriod || this.data.intake || '';

      // Lead classification (priority/subcategory/background codes, e.g. "P1" / "HOT_LEADS" / "EDUCATED")
      const priority = this.data.priority || '';
      const prioritySubCategory = this.data.prioritySubCategory || '';
      const background = this.data.background || '';

      // Academic history
      let tenth = this.data.tenthStandard || this.data.tenth || {};
      let twelfth = this.data.twelfthStandard || this.data.twelfth || {};
      this.graduations = [];

      if (Array.isArray(this.data.academicHistory)) {
        const t = this.data.academicHistory.find((a: any) => a.qualification === '10th');
        if (t) tenth = t;
        const tw = this.data.academicHistory.find((a: any) => a.qualification === '12th');
        if (tw) twelfth = tw;

        const grads = this.data.academicHistory.filter((a: any) =>
          a.qualification !== '10th' && a.qualification !== '12th'
        );
        grads.forEach((g: any) => {
          this.graduations.push({
            id: g.id,
            institution: g.institutionName || g.schoolName || g.institution || '',
            degree: g.qualification || g.degree || 'Graduation',
            boardUniversity: g.boardUniversity || '',
            year: g.passingYear || g.year || null,
            score: g.score || '',
            stream: g.stream || ''
          });
        });
      }

      this.onboardingForm.patchValue({
        personalInfo: {
          firstName,
          lastName,
          email,
          phone,
          branchId,
          countryCode
        },
        leadClassification: {
          priority,
          prioritySubCategory,
          background
        },
        destinationDetails: {
          countryId: countryId || '',
          course: course ? course.toUpperCase() : '',
          intake: intake || ''
        },
        academicHistory: {
          tenth: {
            institution: tenth.institutionName || tenth.schoolName || tenth.institution || '',
            year: tenth.passingYear || tenth.year || '',
            score: tenth.percentage || tenth.score || ''
          },
          twelfth: {
            institution: twelfth.institutionName || twelfth.schoolName || twelfth.institution || '',
            year: twelfth.passingYear || twelfth.year || '',
            score: twelfth.percentage || twelfth.score || ''
          }
        }
      });

      // counsellor and universityId are set inside the async callbacks to avoid race conditions
      if (branchId) this.onBranchChange(branchId, true, counsellorId);
      if (countryId) this.onCountryChange(countryId, true, universityId);

      // Pre-populate MCC after the list loads (handled in loadMCC with isEditMode)
      if (countryCode) {
        this.onboardingForm.get('personalInfo.countryCode')?.setValue(countryCode);
      }

      // Pre-populate uploaded documents (if API returns them)
      let docs: any[] = [];
      const dataDocs = this.data.documents || this.data.uploadedDocuments;
      if (Array.isArray(dataDocs)) {
        docs = dataDocs;
      } else if (dataDocs && typeof dataDocs === 'object') {
        docs = Object.keys(dataDocs).map(key => ({
          documentType: key,
          fileUrl: dataDocs[key]
        }));
      }

      if (docs.length > 0) {
        docs.forEach((doc: any) => {
          const docName = doc.documentType || doc.name || doc.type || '';
          const match = this.requiredDocs.find(d =>
            d.name.toLowerCase().replace(/\s+/g, '_').includes(docName.toLowerCase()) ||
            docName.toLowerCase().includes(d.name.toLowerCase().replace(/\s+/g, '_'))
          );
          if (match) {
            (match as any).uploadedUrl = doc.url || doc.fileUrl || doc.path || (doc.id ? `${environment.apiUrl}/students/documents/${doc.id}/download` : '');
            (match as any).serverDoc = doc;
          }
        });
      }
    }

    // Pre-fill and disable branch/counsellor for JUNIOR_COUNSELLOR and SENIOR_COUNSELLOR
    const user = this.authService.currentUserValue;
    if (user && user.token) {
      const role = user.role?.toUpperCase() || '';
      const isCounsellor = (role === 'JUNIOR_COUNSELLOR' || role === 'SENIOR_COUNSELLOR');
      
      if (isCounsellor) {
        const tokenPayload = this.decodeJwt(user.token);
        if (tokenPayload) {
          const branchId = tokenPayload.branchId;
          const employeeId = tokenPayload.userId;
          
          if (!this.isEditMode) {
            if (branchId) {
              const branchControl = this.onboardingForm.get('personalInfo.branchId');
              branchControl?.setValue(branchId);
              branchControl?.disable();
              
              // Directly populate counsellor option list with the current user only
              this.counsellors = [{
                id: employeeId,
                name: user.name,
                roleLabel: role === 'SENIOR_COUNSELLOR' ? 'Senior' : 'Junior'
              }];
              
              const counsellorControl = this.onboardingForm.get('personalInfo.counsellor');
              if (employeeId) {
                counsellorControl?.setValue(employeeId);
                counsellorControl?.disable();
              }
            }
          } else {
            this.onboardingForm.get('personalInfo.branchId')?.disable();
          }
        }
      }
    }
  }


  loadMCC(): void {
    this.masterData.getMobileCountryCodes().subscribe({
      next: (res) => {
        this.mccList = res.data || [];
        this.mccLoading = false;
        // Set default to India (+91) unless in edit mode with a country code
        const targetCode = this.isEditMode && this.data.countryCode ? this.data.countryCode : '+91';
        const targetMcc = this.mccList.find(m => m.mobileCode === targetCode) || this.mccList.find(m => m.mobileCode === '+91');
        
        if (targetMcc) {
          this.selectedMcc = targetMcc;
          this.updatePhoneValidator(targetMcc);
          this.onboardingForm.get('personalInfo.countryCode')?.setValue(targetMcc.mobileCode);
        }
      },
      error: () => { this.mccLoading = false; }
    });
  }

  loadBranches(): void {
    this.masterData.getBranches(true).subscribe({
      next: (res) => {
        this.branches = res.data || [];
        this.branchLoading = false;
      },
      error: () => { this.branchLoading = false; }
    });
  }

  loadCountries(): void {
    this.masterData.getCountries().subscribe({
      next: (res) => {
        this.countries = res.data || [];
        this.countriesLoading = false;
      },
      error: () => { this.countriesLoading = false; }
    });
  }

  onCountryChange(countryId: number, isInitialLoad = false, preselectUniversityId?: number | null): void {
    this.universities = [];
    if (!isInitialLoad) {
      this.onboardingForm.get('destinationDetails.universityId')?.setValue('');
    }
    if (!countryId) return;
    this.universitiesLoading = true;
    this.masterData.getUniversitiesByCountry(countryId).subscribe({
      next: (res) => {
        this.universities = res.data || [];
        this.universitiesLoading = false;
        if (preselectUniversityId) {
          this.onboardingForm.get('destinationDetails.universityId')?.setValue(preselectUniversityId);
        }
      },
      error: () => { this.universitiesLoading = false; }
    });
  }

  onCountryCodeChange(mobileCode: string): void {
    const mcc = this.mccList.find(m => m.mobileCode === mobileCode) || null;
    this.selectedMcc = mcc;
    this.updatePhoneValidator(mcc);
  }

  updatePhoneValidator(mcc: MobileCountryCode | null): void {
    const phoneCtrl = this.onboardingForm.get('personalInfo.phone');
    if (!phoneCtrl) return;
    const validators: any[] = [Validators.required, Validators.pattern(/^\d+$/)];
    if (mcc?.mobileNumberLength) {
      this.phonePlaceholder = '0'.repeat(mcc.mobileNumberLength);
      validators.push(this.phoneLengthValidator(mcc.mobileNumberLength));
    } else {
      this.phonePlaceholder = 'Phone number';
    }
    phoneCtrl.setValidators(validators);
    phoneCtrl.updateValueAndValidity();
  }

  phoneLengthValidator(length: number): ValidatorFn {
    return (control: AbstractControl) => {
      const val = control.value?.replace(/\s/g, '') || '';
      return val.length === length ? null : { phoneLength: { required: length, actual: val.length } };
    };
  }

  onBranchChange(branchId: number, isInitialLoad = false, preselectCounsellorId?: number | null): void {
    this.counsellors = [];
    if (!isInitialLoad) {
      this.onboardingForm.get('personalInfo.counsellor')?.setValue('');
    }
    if (!branchId) return;
    this.counsellorLoading = true;
    this.masterData.getCounsellorsByBranch(branchId).subscribe({
      next: (res) => {
        this.counsellors = (res.data || []).map((c: any) => ({
          id: c.id,
          name: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
          roleLabel: this.formatCounsellorRole(c.role)
        }));
        this.counsellorLoading = false;
        
        const ctrl = this.onboardingForm.get('personalInfo.counsellor');
        if (preselectCounsellorId) {
          ctrl?.setValue(Number(preselectCounsellorId));
        }
        
        // Defer disabling to here to allow Angular Material select to match the option correctly
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          const role = (currentUser.role || '').toUpperCase();
          const roleName = (currentUser.roleName || '').toUpperCase();
          const isCounsellor = role.includes('COUNSELLOR') || roleName.includes('COUNSELLOR');
          if (isCounsellor) {
            ctrl?.disable();
            this.onboardingForm.get('personalInfo.branchId')?.disable();
          }
        }
      },
      error: () => { this.counsellorLoading = false; }
    });
  }

  formatCounsellorRole(role: string): string {
    if (!role) return '';
    if (role.toLowerCase().includes('senior')) return 'Senior';
    if (role.toLowerCase().includes('junior')) return 'Junior';
    return role;
  }

  onPhoneKeypress(event: KeyboardEvent): boolean {
    return /^\d$/.test(event.key);
  }

  nextStep(): void {
    if (this.currentStep < 4) {
      if (this.currentStep === 1) {
        const fg = this.onboardingForm.get('personalInfo');
        if (fg?.invalid) {
          fg.markAllAsTouched();
          return;
        }
      } else if (this.currentStep === 2) {
        const fg = this.onboardingForm.get('destinationDetails');
        if (fg?.invalid) {
          fg.markAllAsTouched();
          return;
        }
      } else if (this.currentStep === 3) {
        const fg = this.onboardingForm.get('academicHistory');
        if (fg?.invalid) {
          fg.markAllAsTouched();
          return;
        }
      }
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  leadSources: any[] = [];

  loadLeadSources(): void {
    this.masterData.getLeadSources().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.leadSources = res.data || [];
          
          // If in edit mode, auto-populate source now that list is loaded
          if (this.isEditMode && this.data && this.data.source) {
            const sourceVal = this.data.source.trim();
            const matchedSource = this.leadSources.find(s => 
              s.displayName.toLowerCase() === sourceVal.toLowerCase() ||
              s.enum.toLowerCase() === sourceVal.toLowerCase()
            );
            
            if (matchedSource && !['PERSON', 'OTHER'].includes(matchedSource.enum)) {
              this.onboardingForm.patchValue({
                personalInfo: {
                  leadSourceSelect: matchedSource.enum,
                  sourceCustomText: ''
                }
              });
              this.onLeadSourceChange(matchedSource.enum);
            } else {
              this.onboardingForm.patchValue({
                personalInfo: {
                  leadSourceSelect: 'OTHER',
                  sourceCustomText: sourceVal
                }
              });
              this.onLeadSourceChange('OTHER');
            }
          }
        }
      },
      error: (err) => {
        console.error('Failed to load lead sources:', err);
      }
    });
  }

  onLeadSourceChange(value: string): void {
    const customCtrl = this.onboardingForm.get('personalInfo.sourceCustomText');
    if (value === 'PERSON' || value === 'OTHER') {
      customCtrl?.setValidators([Validators.required]);
    } else {
      customCtrl?.clearValidators();
      customCtrl?.setValue('');
    }
    customCtrl?.updateValueAndValidity();
  }

  async submit(): Promise<void> {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      if (this.onboardingForm.get('personalInfo')?.invalid) {
        this.currentStep = 1;
      } else if (this.onboardingForm.get('destinationDetails')?.invalid) {
        this.currentStep = 2;
      } else if (this.onboardingForm.get('academicHistory')?.invalid) {
        this.currentStep = 3;
      }
      return;
    }

    const raw = this.onboardingForm.getRawValue();
    const sourceSelect = raw.personalInfo.leadSourceSelect;
    const customText = raw.personalInfo.sourceCustomText;
    let finalSource = '';
    
    if (sourceSelect === 'PERSON' || sourceSelect === 'OTHER') {
      finalSource = customText;
    } else if (sourceSelect) {
      const matched = this.leadSources.find(s => s.enum === sourceSelect);
      finalSource = matched ? matched.displayName : sourceSelect;
    }
    
    // Inject source into both personalInfo and root levels for safety
    raw.personalInfo.source = finalSource;
    raw.source = finalSource;
    
    delete raw.personalInfo.leadSourceSelect;
    delete raw.personalInfo.sourceCustomText;

    // Priority/subcategory/background are enum fields on the backend — an empty string
    // fails deserialization (unlike a plain string field), so unset selections must go as
    // null, not "".
    if (raw.leadClassification) {
      raw.leadClassification = {
        priority: raw.leadClassification.priority || null,
        prioritySubCategory: raw.leadClassification.prioritySubCategory || null,
        background: raw.leadClassification.background || null
      };
    }

    if (raw.destinationDetails) {
      raw.destinationDetails = {
        countryId: raw.destinationDetails.countryId || null,
        universityId: raw.destinationDetails.universityId || null,
        course: raw.destinationDetails.course || null,
        intake: raw.destinationDetails.intake || null
      };
    }

    // Convert new files to base64 mapping
    const docPayload: any = {};
    for (let i = 0; i < this.requiredDocs.length; i++) {
      const doc = this.requiredDocs[i];
      const key = this.getDocumentKey(doc.name);
      if (doc.file) {
        try {
          docPayload[key] = await this.fileToBase64(doc.file);
        } catch (err) {
          console.error(`Failed to convert ${doc.name} to base64:`, err);
        }
      }
    }
    raw.documents = docPayload;

    // Format academicHistory back to array of qualifications for the API
    if (raw.academicHistory) {
      const historyArr = [];
      const origHistory = Array.isArray(this.data?.academicHistory) ? this.data.academicHistory : [];
      const origTenth = origHistory.find((a: any) => a.qualification === '10th') || {};
      const origTwelfth = origHistory.find((a: any) => a.qualification === '12th') || {};

      if (raw.academicHistory.tenth) {
        const tenthObj: any = {
          qualification: '10th',
          institutionName: raw.academicHistory.tenth.institution || '',
          passingYear: raw.academicHistory.tenth.year ? Number(raw.academicHistory.tenth.year) : null,
          score: raw.academicHistory.tenth.score ? String(raw.academicHistory.tenth.score) : ''
        };
        if (origTenth.id) {
          tenthObj.id = origTenth.id;
        }
        historyArr.push(tenthObj);
      }
      
      if (raw.academicHistory.twelfth) {
        const twelfthObj: any = {
          qualification: '12th',
          institutionName: raw.academicHistory.twelfth.institution || '',
          passingYear: raw.academicHistory.twelfth.year ? Number(raw.academicHistory.twelfth.year) : null,
          score: raw.academicHistory.twelfth.score ? String(raw.academicHistory.twelfth.score) : ''
        };
        if (origTwelfth.id) {
          twelfthObj.id = origTwelfth.id;
        }
        historyArr.push(twelfthObj);
      }

      // Add Graduation entries
      if (Array.isArray(this.graduations)) {
        this.graduations.forEach((g) => {
          if (g.institution || g.degree || g.year || g.score) {
            const gradObj: any = {
              qualification: g.degree || 'Graduation',
              institutionName: g.institution || '',
              boardUniversity: g.boardUniversity || '',
              passingYear: g.year ? Number(g.year) : null,
              score: g.score ? String(g.score) : '',
              stream: g.stream || ''
            };
            if (g.id) {
              gradObj.id = g.id;
            }
            historyArr.push(gradObj);
          }
        });
      }
      
      raw.academicHistory = historyArr;
    }
    
    this.dialogRef.close(raw);
  }

  decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
