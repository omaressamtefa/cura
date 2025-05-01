import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth/auth.service';
import { AdminService } from '../../core/services/admin/admin.service';

@Component({
  selector: 'app-allpatients',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './allpatients.component.html',
  styleUrls: ['./allpatients.component.scss'],
})
export class AllpatientsComponent implements OnInit, OnChanges {
  @Input() searchTerm: string = '';
  @Output() filteredPatientsChange = new EventEmitter<any[]>();
  patients: any[] = [];
  filteredPatients: any[] = [];
  isLoadingPatients: boolean = false;
  hasErrorPatients: boolean = false;
  errorMessagePatients: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  totalPages: number = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.fetchPatients();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTerm']) {
      this.currentPage = 1; // Reset to first page on search
      this.onSearchChange();
      this.fetchPatients();
    }
  }

  fetchPatients(): void {
    this.isLoadingPatients = true;
    this.hasErrorPatients = false;

    this.adminService
      .getAllPatients(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: any) => {
          const patients = Array.isArray(response)
            ? response
            : response?.data || [];
          this.totalItems = response?.totalCount || patients.length; // Adjust based on API response
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.patients = patients;
          this.filteredPatients = patients;
          this.isLoadingPatients = false;
          this.filteredPatientsChange.emit(this.filteredPatients); // Emit filtered patients
        },
        error: (error: any) => {
          this.hasErrorPatients = true;
          this.errorMessagePatients =
            'Failed to load patients. Please try again.';
          this.isLoadingPatients = false;
          this.filteredPatientsChange.emit([]); // Emit empty array on error
          console.error('Error fetching patients:', error);
        },
      });
  }

  onSearchChange(): void {
    if (!this.searchTerm) {
      this.filteredPatients = [...this.patients];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredPatients = this.patients.filter(
        (patient) =>
          `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(searchTermLower) ||
          patient.email?.toLowerCase().includes(searchTermLower)
      );
    }
    this.filteredPatientsChange.emit(this.filteredPatients); // Emit filtered patients
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchPatients();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchPatients();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchPatients();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5; // Show up to 5 page numbers at a time
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, this.currentPage + half);

    // Adjust start and end to always show maxVisiblePages if possible
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

  createPatient(): void {
    this.router.navigate(['/patients/create']);
  }

  viewPatient(id: string): void {
    this.router.navigate([`/patients/${id}`]);
  }

  updatePatient(patientId: string): void {
    this.router.navigate([`/patients/update/${patientId}`]);
  }

  deletePatient(id: string): void {
    if (confirm('Are you sure you want to delete this patient?')) {
      this.adminService.deletePatient(id).subscribe({
        next: () => {
          this.fetchPatients();
          alert('Patient deleted successfully.');
        },
        error: (error: any) => {
          console.error('Error deleting patient:', error);
          alert('Failed to delete patient. Please try again.');
        },
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
