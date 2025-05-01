import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../core/services/admin/admin.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctordashboard.component.html',
  styleUrls: ['./doctordashboard.component.scss'],
})
export class DoctorDashboardComponent implements OnInit {
  role: string | null = null;
  doctorfirstName: string | null = null;
  doctorlastName: string | null = null;
  totalPatients: number = 0;
  totalPatientsChange: number = 0;
  searchTerm = signal<string>('');
  filteredPatients = signal<any[]>([]);
  allPatients = signal<any[]>([]);
  isLoadingPatients = signal<boolean>(false);
  hasErrorPatients = signal<boolean>(false);
  errorMessagePatients = signal<string | null>(null);
  doctorId: string | null = null;

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  totalPages: number = 0;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.doctorId = this.route.snapshot.paramMap.get('id');

    if (this.role !== 'doctor') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserDetails();
    this.loadPatients();
  }

  loadUserDetails(): void {
    this.adminService.getUserDetails().subscribe({
      next: (response) => {
        this.doctorfirstName = response.user.firstName;
        this.doctorlastName = response.user.lastName;
      },
      error: (err) => {
        console.error('Error fetching user details:', err);
      },
    });
  }

  loadPatients(): void {
    this.isLoadingPatients.set(true);
    this.hasErrorPatients.set(false);
    this.errorMessagePatients.set(null);

    if (this.doctorId) {
      this.adminService
        .getPatientsByDoctor(
          Number(this.doctorId),
          this.currentPage,
          this.pageSize
        )
        .subscribe({
          next: (response) => {
            console.log('Patients API Response:', response);
            const patients = response.data || [];
            const totalItems = response.totalItems ?? patients.length;
            console.log('Total Items:', totalItems, 'Patients Data:', patients);

            this.allPatients.set(patients);
            this.filteredPatients.set(patients);
            this.totalItems = totalItems;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            this.totalPatients = totalItems;
            this.totalPatientsChange = 3;
            this.isLoadingPatients.set(false);
          },
          error: (err) => {
            this.hasErrorPatients.set(true);
            this.errorMessagePatients.set(err.message);
            this.isLoadingPatients.set(false);
          },
        });
    } else {
      this.isLoadingPatients.set(false);
      this.hasErrorPatients.set(true);
      this.errorMessagePatients.set('Doctor ID is missing.');
    }
  }

  onSearchChange(): void {
    this.currentPage = 1; // Reset to page 1 on search
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      this.filteredPatients.set([...this.allPatients()]);
      return;
    }

    const filtered = this.allPatients().filter((patient) => {
      const firstName = (patient.firstName || '').toLowerCase();
      const lastName = (patient.lastName || '').toLowerCase();
      const email = (patient.email || '').toLowerCase();
      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term)
      );
    });

    this.filteredPatients.set(filtered);
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPatients();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPatients();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPatients();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, this.currentPage + half);

    if (end - start + 1 < maxVisiblePages) {
      if (start === 1) {
        end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      } else {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewPatient(patientId: string): void {
    this.router.navigate([`/patients/${patientId}`]);
  }

  updatePatient(patientId: string): void {
    this.router.navigate([
      `/home/doctor/${this.doctorId}/patient/update/${patientId}`,
    ]);
  }

  async deletePatient(patientId: string): Promise<void> {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this patient? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      this.adminService.deletePatientByDoctor(patientId).subscribe({
        next: () => {
          this.toastr.success('Patient deleted successfully!', 'Success');
          this.loadPatients();
        },
        error: (err) => {
          this.hasErrorPatients.set(true);
          this.errorMessagePatients.set(
            'Failed to delete patient: ' + err.message
          );
          this.toastr.error('Failed to delete patient.', 'Error');
        },
      });
    }
  }
}
