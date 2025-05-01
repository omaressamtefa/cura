import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin/admin.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admindashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.scss'],
})
export class AdmindashboardComponent implements OnInit {
  // Separate search terms for doctors and patients
  searchTermDoctors: string = '';
  searchTermPatients: string = '';

  // Doctors
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  isLoadingDoctors: boolean = false;
  hasErrorDoctors: boolean = false;
  errorMessageDoctors: string = '';

  // Patients
  patients: any[] = [];
  filteredPatients: any[] = [];
  isLoadingPatients: boolean = false;
  hasErrorPatients: boolean = false;
  errorMessagePatients: string = '';

  role: string | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    if (this.role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.fetchDoctors();
    this.fetchPatients();
  }

  // ----------------- Doctors -----------------

  fetchDoctors(): void {
    this.isLoadingDoctors = true;
    this.hasErrorDoctors = false;

    this.adminService.getAllDoctors(1, 5, this.searchTermDoctors).subscribe({
      next: (response: any) => {
        const doctors = response?.data || [];
        this.doctors = doctors;
        this.filteredDoctors = doctors;
        this.isLoadingDoctors = false;
        this.onSearchChangeDoctors(); // Apply initial filtering if search term exists
      },
      error: (error: any) => {
        this.hasErrorDoctors = true;
        this.errorMessageDoctors = 'Failed to load doctors. Please try again.';
        this.isLoadingDoctors = false;
        console.error('Error fetching doctors:', error);
      },
    });
  }

  viewDoctor(id: string): void {
    this.router.navigate([`/doctors/${id}`]);
  }

  updateDoctor(doctorId: string): void {
    console.log('Navigating to update doctor with ID:', doctorId);
    if (!doctorId || doctorId === '0') {
      console.error('Invalid doctor ID:', doctorId);
      this.toastr.error('Invalid doctor ID.', 'Error');
      return;
    }
    this.router.navigate([`/doctors/update/${doctorId}`]);
  }

  deleteDoctor(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this doctor? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteDoctor(id).subscribe({
          next: () => {
            this.doctors = this.doctors.filter((d) => d.id !== id);
            this.filteredDoctors = this.filteredDoctors.filter(
              (d) => d.id !== id
            );
            this.fetchDoctors();
            this.toastr.success('Doctor deleted successfully!', 'Success');
          },
          error: (error: any) => {
            console.error('Error deleting doctor:', error);
            this.toastr.error('Failed to delete doctor.', 'Error');
          },
        });
      }
    });
  }

  createDoctor(): void {
    this.router.navigate(['/doctors/create']);
  }

  onSearchChangeDoctors(): void {
    const searchTermLower = this.searchTermDoctors.toLowerCase();
    this.filteredDoctors = this.doctors.filter(
      (doctor) =>
        `${doctor.firstName} ${doctor.lastName}`
          .toLowerCase()
          .includes(searchTermLower) ||
        doctor.email?.toLowerCase().includes(searchTermLower) ||
        doctor.specialty?.toLowerCase().includes(searchTermLower)
    );
  }

  // ----------------- Patients -----------------

  fetchPatients(): void {
    this.isLoadingPatients = true;
    this.hasErrorPatients = false;

    this.adminService.getAllPatients(1, 5, this.searchTermPatients).subscribe({
      next: (response: any) => {
        const patients = response?.data || [];
        this.patients = patients;
        this.filteredPatients = patients;
        console.log('Fetched Patients:', this.patients); // Debug the patients data
        this.isLoadingPatients = false;
        this.onSearchChangePatients(); // Apply initial filtering if search term exists
      },
      error: (error: any) => {
        this.hasErrorPatients = true;
        this.errorMessagePatients =
          'Failed to load patients. Please try again.';
        this.isLoadingPatients = false;
        console.error('Error fetching patients:', error);
      },
    });
  }

  viewPatient(id: string): void {
    this.router.navigate([`/patients/${id}`]);
  }

  updatePatient(patientId: string): void {
    console.log('Navigating to update patient with ID:', patientId);
    if (!patientId || patientId === '0') {
      console.error('Invalid patient ID:', patientId);
      this.toastr.error('Invalid patient ID.', 'Error');
      return;
    }
    this.router.navigate([`/patients/update/${patientId}`]);
  }

  deletePatient(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this patient? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deletePatient(id).subscribe({
          next: () => {
            this.patients = this.patients.filter((p) => p.id !== id);
            this.filteredPatients = this.filteredPatients.filter(
              (p) => p.id !== id
            );
            this.fetchPatients();
            this.toastr.success('Patient deleted successfully!', 'Success');
          },
          error: (error: any) => {
            console.error('Error deleting patient:', error);
            this.toastr.error('Failed to delete patient.', 'Error');
          },
        });
      }
    });
  }

  createPatient(): void {
    this.router.navigate(['/patients/create']);
  }

  onSearchChangePatients(): void {
    const searchTermLower = this.searchTermPatients.toLowerCase();
    this.filteredPatients = this.patients.filter(
      (patient) =>
        `${patient.firstName} ${patient.lastName}`
          .toLowerCase()
          .includes(searchTermLower) ||
        patient.email?.toLowerCase().includes(searchTermLower) ||
        patient.gender?.toLowerCase().includes(searchTermLower)
    );
  }
}
