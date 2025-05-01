import { Component, OnInit, computed, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminService } from '../../core/services/admin/admin.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-create-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-patient.component.html',
  styleUrls: ['./create-patient.component.scss'],
})
export class CreatePatientComponent implements OnInit {
  patientForm: FormGroup;
  imageFile: File | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSubmitting = false;
  doctors: Doctor[] = []; // Strongly typed doctor array

  // Inject services
  authService = inject(AuthService);
  router = inject(Router);

  // Compute dashboard link based on role and userId
  dashboardLink = computed(() => {
    const role = this.authService.role() ?? '';
    const uid = this.authService.userId() ?? '';
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('CreatePatientComponent - dashboardLink - Role:', role);
    console.log('CreatePatientComponent - dashboardLink - UserId:', uid);
    console.log(
      'CreatePatientComponent - dashboardLink - IsLoggedIn:',
      isLoggedIn
    );

    if (!isLoggedIn || !role || !uid) {
      console.log(
        'CreatePatientComponent - dashboardLink - Redirecting to /login'
      );
      return '/login';
    }

    if (role === 'admin') return '/home/admin';
    if (role === 'doctor') return `/home/doctor/${uid}`;
    if (role === 'patient') return `/home/patient/${uid}`;
    return '/home';
  });

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      doctorId: ['', Validators.required], // Ensure doctorId is required
      diagnosis: ['', Validators.required],
      treatment: ['', Validators.required],
      image: [null],
    });
  }

  ngOnInit(): void {
    // Check authentication on init
    if (!this.authService.isLoggedIn()) {
      console.log(
        'CreatePatientComponent - ngOnInit - User not logged in, redirecting to /login'
      );
      this.router.navigate(['/login']);
      return;
    }

    // Fetch the list of doctors
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.adminService.getAllDoctors().subscribe({
      next: (response) => {
        this.doctors = response.data || [];
        console.log('Fetched Doctors:', this.doctors); // Debug log
        if (this.doctors.length === 0) {
          this.errorMessage =
            'No doctors available to assign. Please create a doctor first.';
          this.patientForm.get('doctorId')?.disable();
        } else {
          this.patientForm.get('doctorId')?.enable();
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load doctors.';
        console.error('Error fetching doctors:', error);
        this.patientForm.get('doctorId')?.disable();
      },
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        this.errorMessage =
          'Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.';
        this.patientForm.get('image')?.setValue(null);
        return;
      }

      if (file.size > maxSize) {
        this.errorMessage = 'File size exceeds the maximum limit of 5MB.';
        this.patientForm.get('image')?.setValue(null);
        return;
      }

      this.imageFile = file;
      this.errorMessage = null;
    }
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.patientForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formData = new FormData();
    formData.append('FirstName', this.patientForm.get('firstName')?.value);
    formData.append('LastName', this.patientForm.get('lastName')?.value);
    formData.append('Gender', this.patientForm.get('gender')?.value);
    formData.append(
      'BirthDate',
      new Date(this.patientForm.get('birthDate')?.value).toISOString()
    );
    formData.append('Email', this.patientForm.get('email')?.value);
    formData.append('Password', this.patientForm.get('password')?.value);
    formData.append('DoctorId', this.patientForm.get('doctorId')?.value);
    formData.append('Diagnosis', this.patientForm.get('diagnosis')?.value);
    formData.append('Treatment', this.patientForm.get('treatment')?.value);
    if (this.imageFile) {
      formData.append('Image', this.imageFile);
    }

    this.adminService
      .createPatient(formData)
      .pipe(
        catchError((error) => {
          this.isSubmitting = false;
          this.errorMessage =
            error.message || 'An error occurred while creating the patient.';
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.successMessage =
            response.message || 'Patient registered successfully';
          this.patientForm.reset();
          this.imageFile = null;
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
  }

  cancel(): void {
    console.log(
      'CreatePatientComponent - cancel - Navigating to:',
      this.dashboardLink()
    );
    this.patientForm.reset();
    this.imageFile = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.router.navigate([this.dashboardLink()]).then((success) => {
      console.log(
        'CreatePatientComponent - cancel - Navigation success:',
        success
      );
      if (!success) {
        console.log(
          'CreatePatientComponent - cancel - Navigation failed, redirecting to /login'
        );
        this.router.navigate(['/login']);
      }
    });
  }

  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}
