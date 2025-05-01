import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin/admin.service';
import { AuthService } from '../../core/services/auth/auth.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastrModule],
  templateUrl: './update-patient.component.html',
  styleUrls: ['./update-patient.component.scss'],
})
export class UpdatePatientComponent implements OnInit {
  updatePatientForm: FormGroup;
  patientId: string | null = null;
  errorMessage: string | null = null;
  doctorId: string | null = null;
  patientFirstName: string | null = null;
  patientLastName: string | null = null;
  role: string | null = null;
  isPatientNotFound: boolean = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.updatePatientForm = this.fb.group({
      FirstName: [{ value: '', disabled: true }, Validators.required],
      LastName: [{ value: '', disabled: true }, Validators.required],
      Email: [
        { value: '', disabled: true },
        [Validators.required, Validators.email],
      ],
      BirthDate: ['', [Validators.required, this.dateValidator()]],
      Gender: ['', Validators.required],
      DoctorId: [{ value: '', disabled: true }, Validators.required],
      Diagnosis: ['', Validators.required],
      Treatment: ['', Validators.required],
    });
  }

  dateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const date = new Date(value);
      const today = new Date();
      const minDate = new Date('1900-01-01');

      if (isNaN(date.getTime()) || date > today || date < minDate) {
        return { invalidDate: true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.patientId = this.route.snapshot.paramMap.get('patientId');
    this.doctorId = this.route.snapshot.paramMap.get('id');

    console.log(
      'Route Parameters - patientId:',
      this.patientId,
      'doctorId:',
      this.doctorId
    );

    if (!this.role || (this.role !== 'admin' && this.role !== 'doctor')) {
      console.warn('Unauthorized role:', this.role);
      this.router.navigate(['/login']);
      return;
    }

    if (this.role === 'doctor' && this.doctorId) {
      this.updatePatientForm.patchValue({ DoctorId: this.doctorId });
    }

    if (
      this.patientId &&
      this.patientId !== '0' &&
      !isNaN(Number(this.patientId))
    ) {
      this.fetchPatientDetails(this.patientId);
    } else {
      this.errorMessage = 'Invalid patient ID provided.';
      console.error('Invalid patientId:', this.patientId);
      this.patientFirstName = 'N/A';
      this.patientLastName = 'N/A';
      this.isPatientNotFound = true;
      this.updatePatientForm.get('FirstName')?.enable();
      this.updatePatientForm.get('LastName')?.enable();
      this.updatePatientForm.get('Email')?.enable();
      this.updatePatientForm.get('DoctorId')?.enable();
    }
  }

  fetchPatientDetails(patientId: string): void {
    console.log('Fetching patient details for ID:', patientId);

    if (this.role === 'doctor' && this.doctorId) {
      this.adminService.getPatientsByDoctor(Number(this.doctorId)).subscribe({
        next: (response) => {
          console.log('Patients Response:', response);
          const patient = response.data.find(
            (p: any) => String(p.id) === String(patientId)
          );
          console.log('Found Patient:', patient);
          if (patient) {
            this.patientFirstName =
              patient.firstName || patient.first_name || 'N/A';
            this.patientLastName =
              patient.lastName || patient.last_name || 'N/A';
            this.updatePatientForm.patchValue({
              FirstName: patient.firstName || patient.first_name || '',
              LastName: patient.lastName || patient.last_name || '',
              Email: patient.email || '',
              BirthDate:
                patient.birthDate || patient.dateOfBirth
                  ? new Date(patient.birthDate || patient.dateOfBirth)
                      .toISOString()
                      .split('T')[0]
                  : '',
              Gender: patient.gender || '',
              Diagnosis: patient.diagnosis || '',
              Treatment: patient.treatment || '',
              DoctorId: this.doctorId,
            });
          } else {
            this.errorMessage = `Patient with ID ${patientId} not found in doctor's patient list.`;
            this.patientFirstName = 'N/A';
            this.patientLastName = 'N/A';
            this.isPatientNotFound = true;
            this.updatePatientForm.get('FirstName')?.enable();
            this.updatePatientForm.get('LastName')?.enable();
            this.updatePatientForm.get('Email')?.enable();
            this.updatePatientForm.get('DoctorId')?.enable();
          }
        },
        error: (err) => {
          console.error('Error fetching patient details:', err);
          this.errorMessage = 'Failed to load patient details: ' + err.message;
          this.patientFirstName = 'N/A';
          this.patientLastName = 'N/A';
          this.isPatientNotFound = true;
          this.updatePatientForm.get('FirstName')?.enable();
          this.updatePatientForm.get('LastName')?.enable();
          this.updatePatientForm.get('Email')?.enable();
          this.updatePatientForm.get('DoctorId')?.enable();
        },
      });
    } else if (this.role === 'admin') {
      this.adminService.getPatientById(patientId).subscribe({
        next: (response) => {
          console.log('Patient Response (Admin):', response);
          const patient = response.data;
          if (patient) {
            this.patientFirstName =
              patient.firstName || patient.first_name || 'N/A';
            this.patientLastName =
              patient.lastName || patient.last_name || 'N/A';
            this.updatePatientForm.patchValue({
              FirstName: patient.firstName || patient.first_name || '',
              LastName: patient.lastName || patient.last_name || '',
              Email: patient.email || '',
              BirthDate:
                patient.birthDate || patient.dateOfBirth
                  ? new Date(patient.birthDate || patient.dateOfBirth)
                      .toISOString()
                      .split('T')[0]
                  : '',
              Gender: patient.gender || '',
              Diagnosis: patient.diagnosis || '',
              Treatment: patient.treatment || '',
              DoctorId: patient.doctorId || '',
            });
          } else {
            this.errorMessage = `Patient with ID ${patientId} not found.`;
            this.patientFirstName = 'N/A';
            this.patientLastName = 'N/A';
            this.isPatientNotFound = true;
            this.updatePatientForm.get('FirstName')?.enable();
            this.updatePatientForm.get('LastName')?.enable();
            this.updatePatientForm.get('Email')?.enable();
            this.updatePatientForm.get('DoctorId')?.enable();
          }
        },
        error: (err) => {
          console.error('Error fetching patient details (Admin):', err);
          this.errorMessage = `Failed to load patient details: ${err.message}`;
          this.patientFirstName = 'N/A';
          this.patientLastName = 'N/A';
          this.isPatientNotFound = true;
          this.updatePatientForm.get('FirstName')?.enable();
          this.updatePatientForm.get('LastName')?.enable();
          this.updatePatientForm.get('Email')?.enable();
          this.updatePatientForm.get('DoctorId')?.enable();
        },
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.updatePatientForm.invalid) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please fill out all required fields: Date of Birth, Gender, Diagnosis, and Treatment.',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal2-custom-popup',
          title: 'swal2-custom-title',
          confirmButton: 'swal2-custom-confirm',
        },
      });
      this.errorMessage = 'Please fill out all required fields correctly.';
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to update the details for ${this.patientFirstName} ${this.patientLastName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal2-custom-popup',
        title: 'swal2-custom-title',
        confirmButton: 'swal2-custom-confirm',
        cancelButton: 'swal2-custom-cancel',
        icon: 'swal2-custom-icon',
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    const formValue = this.updatePatientForm.getRawValue();
    const payload = {
      firstName: formValue.FirstName,
      lastName: formValue.LastName,
      email: formValue.Email,
      birthDate: formValue.BirthDate,
      gender: formValue.Gender,
      doctorId: Number(formValue.DoctorId),
      diagnosis: formValue.Diagnosis,
      treatment: formValue.Treatment,
    };

    console.log('Payload being sent to API:', payload);

    if (this.patientId) {
      let updateObservable;
      if (this.role === 'doctor') {
        console.log('Updating patient as doctor using updatePatientByDoctor');
        updateObservable = this.adminService.updatePatientByDoctor(
          this.patientId,
          payload
        );
      } else {
        console.log('Updating patient as admin using updatePatient');
        updateObservable = this.adminService.updatePatient(
          this.patientId,
          payload
        );
      }

      updateObservable.subscribe({
        next: (response) => {
          console.log('Update Response:', response);
          this.toastr.success('Patient updated successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toastr',
          });
          this.errorMessage = null;
          setTimeout(() => {
            if (this.role === 'doctor' && this.doctorId) {
              this.router.navigate([`/home/doctor/${this.doctorId}`]);
            } else {
              this.router.navigate(['/home/admin']);
            }
          }, 2000);
        },
        error: (err) => {
          console.error('Update Error:', err);
          const errorMsg =
            err.error?.message || err.message || 'An unknown error occurred.';
          this.errorMessage = `Failed to update patient: ${errorMsg}`;
          this.toastr.error(this.errorMessage, 'Error', {
            toastClass: 'ngx-toastr custom-toastr',
          });
        },
      });
    }
  }

  goBack(): void {
    if (this.role === 'doctor' && this.doctorId) {
      this.router.navigate([`/home/doctor/${this.doctorId}`]);
    } else {
      this.router.navigate(['/home/admin']);
    }
  }
}
