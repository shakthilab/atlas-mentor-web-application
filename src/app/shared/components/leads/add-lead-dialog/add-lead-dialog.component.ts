import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MasterDataService, MobileCountryCode, Branch } from '../../../../core/services/master-data.service';

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
    TablerIconsModule
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
            <h5 class="mat-subtitle-1 f-w-600 m-b-0 f-s-16 text-dark">Student Onboarding</h5>
          </div>
        </div>
        
        <!-- Steps -->
        <div class="step-list position-relative">
          <div class="step-line-bg"></div>
          
          <div *ngFor="let step of steps; let i = index" class="step-item d-flex align-items-center m-b-32 position-relative z-1" [class.active]="currentStep === i + 1" [class.completed]="currentStep > i + 1">
            <div class="step-circle m-r-16 d-flex align-items-center justify-content-center" [ngClass]="{'bg-primary text-white border-primary': currentStep >= i + 1, 'bg-white text-muted': currentStep < i + 1}">
              <i-tabler *ngIf="currentStep > i + 1" name="check" class="icon-16"></i-tabler>
              <i-tabler *ngIf="currentStep <= i + 1" [name]="step.icon" class="icon-16"></i-tabler>
            </div>
            <div class="step-text">
              <h6 class="f-w-600 m-b-4" [ngClass]="currentStep >= i + 1 ? 'text-primary' : 'text-dark'">{{ step.title }}</h6>
              <span class="f-s-12 text-muted">{{ step.subtitle }}</span>
            </div>
          </div>
        </div>

        <div class="mt-auto">
          <div class="help-box d-flex align-items-center p-16 rounded border">
            <i-tabler name="info-circle" class="icon-20 text-dark m-r-12"></i-tabler>
            <span class="f-s-12 text-dark">Need help? Contact support team.</span>
          </div>
        </div>
      </div>

      <!-- Right Content Area -->
      <div class="step-content-area flex-1-auto d-flex flex-column bg-white">
        <!-- Header -->
        <div class="dialog-header d-flex justify-content-between align-items-center p-x-32 p-y-24 border-bottom">
          <div>
            <h2 class="mat-headline-6 f-w-600 m-b-4 text-dark">{{ dialogTitle }}</h2>
            <span class="f-s-13 text-muted">Step {{ currentStep }} of 4: {{ steps[currentStep - 1].title }}</span>
          </div>
          <button mat-icon-button mat-dialog-close class="text-muted">
            <i-tabler name="x"></i-tabler>
          </button>
        </div>

        <!-- Body -->
        <div class="dialog-body p-32 flex-1-auto overflow-y-auto" [formGroup]="onboardingForm">
          
          <!-- STEP 1: Personal Information -->
          <ng-container *ngIf="currentStep === 1" formGroupName="personalInfo">
            <div class="row">
              <div class="col-sm-6 m-b-16">
                <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">First Name <span class="text-danger">*</span></mat-label>
                <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                  <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="user"></i-tabler></mat-icon>
                  <input matInput formControlName="firstName" placeholder="First name">
                </mat-form-field>
              </div>
              <div class="col-sm-6 m-b-16">
                <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Last Name <span class="text-danger">*</span></mat-label>
                <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                  <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="user"></i-tabler></mat-icon>
                  <input matInput formControlName="lastName" placeholder="Last name">
                </mat-form-field>
              </div>
            </div>

            <div class="m-b-16">
              <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Phone Number <span class="text-danger">*</span></mat-label>
              <div class="d-flex gap-12 align-items-start">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width: 150px; flex-shrink: 0;">
                  <mat-select formControlName="countryCode" (selectionChange)="onCountryCodeChange($event.value)">
                    <mat-select-trigger>
                      <span style="display:flex;align-items:center;gap:6px;">
                        <img *ngIf="selectedMcc?.flagUrl" [src]="selectedMcc!.flagUrl" width="20" height="14" style="object-fit:cover;border-radius:2px;vertical-align:middle;" onerror="this.style.display='none'">
                        <span>{{ selectedMcc?.mobileCode || onboardingForm.get('personalInfo.countryCode')?.value }}</span>
                      </span>
                    </mat-select-trigger>
                    <mat-option *ngIf="mccLoading">Loading...</mat-option>
                    <mat-option *ngFor="let mcc of mccList" [value]="mcc.mobileCode">
                      <span style="display:flex;align-items:center;gap:8px;">
                        <img [src]="mcc.flagUrl" width="20" height="14" style="object-fit:cover;border-radius:2px;vertical-align:middle;" onerror="this.style.display='none'">
                        {{ mcc.mobileCode }} {{ mcc.countryName }}
                      </span>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1-auto" subscriptSizing="dynamic">
                  <input matInput formControlName="phone" [placeholder]="phonePlaceholder" inputmode="numeric"
                    [maxlength]="selectedMcc?.mobileNumberLength || 15"
                    (keypress)="onPhoneKeypress($event)">
                  <mat-error *ngIf="onboardingForm.get('personalInfo.phone')?.hasError('required')">Phone is required</mat-error>
                  <mat-error *ngIf="onboardingForm.get('personalInfo.phone')?.hasError('phoneLength')">Must be exactly {{ selectedMcc?.mobileNumberLength }} digits</mat-error>
                  <mat-error *ngIf="onboardingForm.get('personalInfo.phone')?.hasError('pattern')">Digits only</mat-error>
                </mat-form-field>
              </div>
            </div>

            <div class="m-b-24">
              <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Email Address</mat-label>
              <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="mail"></i-tabler></mat-icon>
                <input matInput formControlName="email" type="email" placeholder="example@mail.com">
              </mat-form-field>
            </div>

            <div class="m-b-16">
              <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Assign to Branch <span class="text-danger">*</span></mat-label>
              <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                <mat-select formControlName="branchId" placeholder="Select Branch" (selectionChange)="onBranchChange($event.value)">
                  <mat-option *ngIf="branchLoading">Loading...</mat-option>
                  <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.name }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="m-b-16" *ngIf="onboardingForm.get('personalInfo.branchId')?.value">
              <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Assign To (Counsellor)</mat-label>
              <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                <mat-select formControlName="counsellor" [placeholder]="counsellorLoading ? 'Loading...' : 'Select Counsellor'" [disabled]="counsellorLoading">
                  <mat-option *ngIf="counsellorLoading">Loading...</mat-option>
                  <mat-option *ngIf="!counsellorLoading && counsellors.length === 0">No counsellors found</mat-option>
                  <mat-option *ngFor="let c of counsellors" [value]="c.id">
                    <span style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                      <span>{{ c.name }}</span>
                      <span [style]="c.roleLabel === 'Senior'
                        ? 'font-size:11px;font-weight:600;margin-left:8px;background:rgba(97,93,255,0.12);color:#615dff;padding:2px 10px;border-radius:10px;'
                        : 'font-size:11px;font-weight:600;margin-left:8px;background:rgba(19,222,185,0.12);color:#13deb9;padding:2px 10px;border-radius:10px;'">
                        {{ c.roleLabel }}
                      </span>
                    </span>
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </ng-container>

          <!-- STEP 2: Destination Details -->
          <ng-container *ngIf="currentStep === 2" formGroupName="destinationDetails">
            <div class="row">
              <div class="col-sm-6 m-b-24">
                <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Destination Country</mat-label>
                <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                  <mat-select formControlName="countryId" placeholder="Select Country" (selectionChange)="onCountryChange($event.value)">
                    <mat-option *ngIf="countriesLoading">Loading...</mat-option>
                    <mat-option *ngFor="let c of countries" [value]="c.id">{{ c.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-sm-6 m-b-24">
                <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Target University</mat-label>
                <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                  <mat-select formControlName="universityId"
                    [placeholder]="universitiesLoading ? 'Loading...' : (onboardingForm.get('destinationDetails.countryId')?.value ? 'Select University' : 'Select a country first')"
                    [disabled]="universitiesLoading || !onboardingForm.get('destinationDetails.countryId')?.value">
                    <mat-option *ngIf="universitiesLoading">Loading...</mat-option>
                    <mat-option *ngIf="!universitiesLoading && universities.length === 0 && onboardingForm.get('destinationDetails.countryId')?.value">No universities found</mat-option>
                    <mat-option *ngFor="let u of universities" [value]="u.id">{{ u.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="row">
              <div class="col-sm-6 m-b-24">
                <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Course Name</mat-label>
                <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                  <mat-select formControlName="course" placeholder="Select course">
                    <mat-option value="MBBS">MBBS</mat-option>
                    <mat-option value="MD">MD</mat-option>
                    <mat-option value="BDS">BDS</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-sm-6 m-b-24">
                <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Intake Period</mat-label>
                <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                  <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="calendar"></i-tabler></mat-icon>
                  <input matInput formControlName="intake" placeholder="e.g. Fall 2026">
                </mat-form-field>
              </div>
            </div>
          </ng-container>

          <!-- STEP 3: Academic History -->
          <ng-container *ngIf="currentStep === 3" formGroupName="academicHistory">

            <div class="row">
              <!-- 10th Standard -->
              <div class="col-md-6 m-b-24">
                <div class="border rounded p-24 position-relative h-100">
                  <div class="bg-white px-2 position-absolute" style="top: -10px; left: 16px;">
                    <span class="f-s-11 f-w-600 text-muted border rounded p-x-8 p-y-4">10TH STANDARD</span>
                  </div>
                  <div class="row m-t-8" formGroupName="tenth">
                    <div class="col-12 m-b-16">
                      <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Institution Name</mat-label>
                      <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                        <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="school"></i-tabler></mat-icon>
                        <input matInput formControlName="institution" placeholder="Institution name">
                      </mat-form-field>
                    </div>
                    <div class="col-6 m-b-16">
                      <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Passing Year</mat-label>
                      <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                        <mat-select formControlName="year" placeholder="Year">
                          <mat-option *ngFor="let y of passingYears" [value]="y">{{ y }}</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="col-6 m-b-16">
                      <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Score/CGPA</mat-label>
                      <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                        <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="star"></i-tabler></mat-icon>
                        <input matInput formControlName="score" type="number" min="0" max="100" placeholder="e.g. 80">
                        <mat-error *ngIf="onboardingForm.get('academicHistory.tenth.score')?.hasError('min')">Cannot be negative</mat-error>
                        <mat-error *ngIf="onboardingForm.get('academicHistory.tenth.score')?.hasError('max')">Cannot exceed 100</mat-error>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 12th Standard -->
              <div class="col-md-6 m-b-24">
                <div class="border rounded p-24 position-relative h-100">
                  <div class="bg-white px-2 position-absolute" style="top: -10px; left: 16px;">
                    <span class="f-s-11 f-w-600 text-muted border rounded p-x-8 p-y-4">12TH STANDARD</span>
                  </div>
                  <div class="row m-t-8" formGroupName="twelfth">
                    <div class="col-12 m-b-16">
                      <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Institution Name</mat-label>
                      <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                        <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="school"></i-tabler></mat-icon>
                        <input matInput formControlName="institution" placeholder="Institution name">
                      </mat-form-field>
                    </div>
                    <div class="col-6 m-b-16">
                      <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Passing Year</mat-label>
                      <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                        <mat-select formControlName="year" placeholder="Year">
                          <mat-option *ngFor="let y of passingYears" [value]="y">{{ y }}</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="col-6 m-b-16">
                      <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Score/CGPA</mat-label>
                      <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                        <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="star"></i-tabler></mat-icon>
                        <input matInput formControlName="score" type="number" min="0" max="100" placeholder="e.g. 80">
                        <mat-error *ngIf="onboardingForm.get('academicHistory.twelfth.score')?.hasError('min')">Cannot be negative</mat-error>
                        <mat-error *ngIf="onboardingForm.get('academicHistory.twelfth.score')?.hasError('max')">Cannot exceed 100</mat-error>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dynamic Graduation Entries -->
            <div *ngFor="let g of graduations; let gi = index" class="border rounded p-24 m-b-24 position-relative">
              <div class="bg-white px-2 position-absolute" style="top: -10px; left: 16px;">
                <span class="f-s-11 f-w-600 text-muted border rounded p-x-8 p-y-4">GRADUATION {{ gi + 1 }}</span>
              </div>
              <button mat-icon-button class="position-absolute text-muted" style="top:4px;right:8px;" (click)="removeGraduation(gi)" type="button">
                <i-tabler name="x" class="icon-16"></i-tabler>
              </button>
              <div class="row m-t-8">
                <div class="col-12 m-b-16">
                  <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Institution / University Name</mat-label>
                  <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="school"></i-tabler></mat-icon>
                    <input matInput [(ngModel)]="g.institution" [ngModelOptions]="{standalone: true}" placeholder="University / College name">
                  </mat-form-field>
                </div>
                <div class="col-12 m-b-16">
                  <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Degree / Course</mat-label>
                  <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="certificate"></i-tabler></mat-icon>
                    <input matInput [(ngModel)]="g.degree" [ngModelOptions]="{standalone: true}" placeholder="e.g. B.Sc, B.Com, B.Tech">
                  </mat-form-field>
                </div>
                <div class="col-6 m-b-16">
                  <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Passing Year</mat-label>
                  <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                    <mat-select [(ngModel)]="g.year" [ngModelOptions]="{standalone: true}" placeholder="Year">
                      <mat-option *ngFor="let y of passingYears" [value]="y">{{ y }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="col-6 m-b-16">
                  <mat-label class="mat-subtitle-2 f-w-600 m-b-8 d-block">Score/CGPA</mat-label>
                  <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="text-muted m-r-8"><i-tabler name="star"></i-tabler></mat-icon>
                    <input matInput [(ngModel)]="g.score" [ngModelOptions]="{standalone: true}" type="number" min="0" max="100" placeholder="e.g. 7.5"
                      (input)="clampScore(g)">
                  </mat-form-field>
                </div>
              </div>
            </div>

            <!-- Add Graduation Button -->
            <button mat-stroked-button color="primary" class="w-100 m-b-16" (click)="addGraduation()" type="button">
              <i-tabler name="plus" class="icon-16 m-r-4"></i-tabler> Add Graduation
            </button>

          </ng-container>


          <!-- STEP 4: Documents -->
          <ng-container *ngIf="currentStep === 4" formGroupName="documents">
            <div class="upload-zone border-dashed rounded p-32 d-flex flex-column align-items-center justify-content-center m-b-24 bg-primary-light">
              <i-tabler name="cloud-upload" class="icon-32 text-primary m-b-8"></i-tabler>
              <h6 class="f-w-600 m-b-4">Upload Documents</h6>
              <span class="f-s-12 text-muted m-b-16">Select required files to proceed with the application.</span>
              <input type="file" #fileInput multiple style="display: none;" (change)="onFilesSelected($event)">
              <button mat-flat-button color="primary" (click)="fileInput.click()" type="button">
                <i-tabler name="plus" class="icon-18 m-r-4"></i-tabler> Attach file or media
              </button>
            </div>

            <!-- Required Docs Grid -->
            <div class="row">
               <div class="col-md-6 m-b-16" *ngFor="let doc of requiredDocs; let i = index">
                 <!-- Pending State -->
                 <div *ngIf="!doc.file && !doc.uploadedUrl" class="d-flex align-items-center justify-content-between p-16 border rounded bg-white">
                   <div class="d-flex align-items-center">
                     <i-tabler name="file-text" class="icon-20 text-muted m-r-12"></i-tabler>
                     <span class="f-s-14 f-w-600 text-dark">{{ doc.name }}</span>
                   </div>
                   <span class="f-s-12 text-muted">Pending upload</span>
                 </div>
                 <!-- Server-uploaded State (pre-existing doc from API) -->
                 <div *ngIf="!doc.file && doc.uploadedUrl" class="d-flex align-items-center justify-content-between p-16 border rounded bg-white" style="border-color: #13deb9 !important; background-color: rgba(19, 222, 185, 0.05) !important;">
                   <div class="d-flex align-items-center overflow-hidden flex-1-auto">
                     <i-tabler name="circle-check" class="icon-20 m-r-12" style="color: #13deb9;"></i-tabler>
                     <div class="d-flex flex-column overflow-hidden flex-1-auto m-r-12">
                       <span class="f-s-14 f-w-600 text-dark text-truncate">{{ doc.name }}</span>
                       <span class="f-s-11 text-muted">Already uploaded</span>
                     </div>
                   </div>
                   <a [href]="doc.uploadedUrl" target="_blank" mat-icon-button class="icon-btn text-primary flex-shrink-0" title="View document">
                     <i-tabler name="external-link" class="icon-16"></i-tabler>
                   </a>
                 </div>
                 <!-- New File Uploaded State -->
                 <div *ngIf="doc.file" class="d-flex align-items-center justify-content-between p-16 border rounded bg-white" style="border-color: #13deb9 !important; background-color: rgba(19, 222, 185, 0.05) !important;">
                   <div class="d-flex align-items-center overflow-hidden flex-1-auto">
                     <i-tabler name="circle-check" class="icon-20 m-r-12" style="color: #13deb9;"></i-tabler>
                     <div class="d-flex flex-column overflow-hidden flex-1-auto m-r-12">
                       <span class="f-s-14 f-w-600 text-dark text-truncate" [title]="doc.name">{{ doc.name }}</span>
                       <span class="f-s-11 text-muted text-truncate" [title]="doc.file.name">{{ doc.file.name }} ({{ formatBytes(doc.file.size) }})</span>
                     </div>
                   </div>
                   <button mat-icon-button class="icon-btn text-danger flex-shrink-0" (click)="removeUploadedFile(i)">
                     <i-tabler name="trash" class="icon-16"></i-tabler>
                   </button>
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

          <button *ngIf="currentStep === 4" mat-flat-button color="success" class="bg-success text-white" (click)="submit()">
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
      background-color: var(--mat-dialog-container-color, #ffffff);
    }

    .step-content-area {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .dialog-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    
    @media (max-width: 768px) {
      .onboarding-container {
        height: 90vh;
        min-height: auto;
      }
    }
    
    .stepper-sidebar {
      width: 300px;
      background-color: #f8fafc;
      flex-shrink: 0;
      
      @media (max-width: 768px) {
        display: none !important;
      }
    }
    
    .bg-primary-light {
      background-color: rgba(97, 93, 255, 0.1);
    }
    
    .text-primary { color: #615dff !important; }
    .text-success { color: #13deb9 !important; }
    .bg-success { background-color: #13deb9 !important; }
    .border-success { border-color: #13deb9 !important; }
    .text-dark { color: #1e293b; }
    .border-right { border-right: 1px solid #e2e8f0; }
    .border-bottom { border-bottom: 1px solid #e2e8f0; }
    .border-top { border-top: 1px solid #e2e8f0; }
    .border-dashed { border: 2px dashed #cbd5e1; }
    
    /* Stepper UI */
    .step-line-bg {
      position: absolute;
      top: 14px;
      bottom: 40px;
      left: 13px;
      width: 2px;
      background-color: #e2e8f0;
      z-index: 0;
    }
    
    .step-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #e2e8f0;
      background-color: #fff;
      z-index: 2;
    }
    
    .step-item.active .step-circle {
      border-color: #615dff !important;
      background-color: #615dff !important;
      color: #ffffff !important;
    }
    
    .bg-primary.step-circle {
      background-color: #615dff !important;
      border-color: #615dff !important;
    }

    .icon-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :host-context(.dark-theme) {
      .onboarding-container, .step-content-area, .dialog-footer {
        background-color: var(--dark-sidebarbg, #1e293b) !important;
      }
      .stepper-sidebar {
        background-color: var(--dark-bodybg, #0c0c0e);
      }
      .border-right, .border-bottom, .border-top, .border, .step-line-bg {
        border-color: var(--dark-formborderColor) !important;
        background-color: var(--dark-formborderColor);
      }
      .border {
        border-color: var(--dark-formborderColor) !important;
        background-color: transparent;
      }
      .step-circle {
        border-color: var(--dark-formborderColor);
        background-color: var(--dark-sidebarbg) !important;
      }
      .bg-white { background-color: var(--dark-sidebarbg) !important; }
      .bg-light { background-color: var(--dark-hoverbgcolor) !important; }
      .text-dark { color: #f8fafc !important; }
      mat-label.text-dark { color: #f8fafc !important; }
      .mat-headline-6 { color: #f8fafc; }
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

  // Passing years: current year down to 100 years ago
  passingYears: number[] = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Dynamic graduation entries
  graduations: { institution: string; degree: string; year: number | null; score: string }[] = [];

  addGraduation(): void {
    this.graduations.push({ institution: '', degree: '', year: null, score: '' });
  }

  removeGraduation(index: number): void {
    this.graduations.splice(index, 1);
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

  removeUploadedFile(index: number): void {
    this.requiredDocs[index].file = null;
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

  requiredDocs: { name: string; file?: File | null; uploadedUrl?: string }[] = [
    { name: 'Passport' },
    { name: '10th Marksheet' },
    { name: '12th Marksheet' },
    { name: 'Birth Certificate' },
    { name: 'Police Clearance' },
    { name: 'Bank Statement' },
    { name: 'Insurance Document' },
    { name: 'Neet Scorecard' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddLeadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private masterData: MasterDataService
  ) {
    this.onboardingForm = this.fb.group({
      personalInfo: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        countryCode: ['+91', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
        email: ['', [Validators.email]],
        branchId: ['', Validators.required],
        counsellor: ['']
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
      const counsellorId = this.data.assignedTo?.id || this.data.assignedBy?.id || this.data.counsellorId || null;
      const countryCode = this.data.mobileCountryCode?.mobileCode || u.mobileCountryCode?.mobileCode || '+91';

      // Destination details
      const countryId = this.data.country?.id || this.data.countryId || null;
      const universityId = this.data.university?.id || this.data.universityId || null;
      const course = this.data.courseName || this.data.course || '';
      const intake = this.data.intakePeriod || this.data.intake || '';

      // Academic history
      const tenth = this.data.tenthStandard || this.data.tenth || {};
      const twelfth = this.data.twelfthStandard || this.data.twelfth || {};

      this.onboardingForm.patchValue({
        personalInfo: {
          firstName,
          lastName,
          email,
          phone,
          branchId,
          countryCode
        },
        destinationDetails: {
          countryId: countryId || '',
          course: course ? course.toUpperCase() : '',
          intake: intake || ''
        },
        academicHistory: {
          tenth: {
            institution: tenth.schoolName || tenth.institution || '',
            year: tenth.passingYear || tenth.year || '',
            score: tenth.percentage || tenth.score || ''
          },
          twelfth: {
            institution: twelfth.schoolName || twelfth.institution || '',
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
      const docs: any[] = this.data.documents || this.data.uploadedDocuments || [];
      if (docs.length > 0) {
        docs.forEach((doc: any) => {
          const docName = doc.documentType || doc.name || doc.type || '';
          const match = this.requiredDocs.find(d =>
            d.name.toLowerCase().includes(docName.toLowerCase()) ||
            docName.toLowerCase().includes(d.name.toLowerCase())
          );
          if (match) {
            (match as any).uploadedUrl = doc.url || doc.fileUrl || doc.path || '';
            (match as any).serverDoc = doc;
          }
        });
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
        if (preselectCounsellorId) {
          this.onboardingForm.get('personalInfo.counsellor')?.setValue(preselectCounsellorId);
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
      if (this.currentStep === 1 && this.onboardingForm.get('personalInfo')?.invalid) {
        this.onboardingForm.get('personalInfo')?.markAllAsTouched();
        return;
      }
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  submit(): void {
    if (this.onboardingForm.valid) {
      this.dialogRef.close(this.onboardingForm.value);
    }
  }
}
