import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin/admin.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-alldoctors',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './alldoctors.component.html',
  styleUrls: ['./alldoctors.component.scss'],
})
export class AlldoctorsComponent implements OnInit {
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  searchTerm: string = '';
  isLoadingDoctors: boolean = false;
  hasErrorDoctors: boolean = false;
  errorMessageDoctors: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;
  totalPages: number = 0;

  constructor(
    private adminService: AdminService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.fetchDoctors();
  }

  fetchDoctors(): void {
    this.isLoadingDoctors = true;
    this.hasErrorDoctors = false;
    this.errorMessageDoctors = '';

    this.adminService
      .getAllDoctors(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          const doctors = Array.isArray(response)
            ? response
            : response?.data || [];
          this.totalItems = response?.totalCount || doctors.length; // Adjust based on API response
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.doctors = doctors;
          this.filteredDoctors = [...this.doctors];
          this.isLoadingDoctors = false;
        },
        error: (error) => {
          this.isLoadingDoctors = false;
          this.hasErrorDoctors = true;
          this.errorMessageDoctors =
            error.message || 'An error occurred while loading doctors.';
        },
      });
  }

  onSearchChange(): void {
    if (!this.searchTerm) {
      this.filteredDoctors = [...this.doctors];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredDoctors = this.doctors.filter(
        (doctor) =>
          `${doctor.firstName} ${doctor.lastName}`
            .toLowerCase()
            .includes(searchTermLower) ||
          doctor.email?.toLowerCase().includes(searchTermLower) ||
          doctor.specialty?.toLowerCase().includes(searchTermLower)
      );
    }
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchDoctors();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchDoctors();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchDoctors();
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

  createDoctor(): void {
    this.router.navigate(['/doctors/create']);
  }

  viewDoctor(id: string): void {
    this.router.navigate([`/doctors/${id}`]);
  }

  updateDoctor(doctorId: string): void {
    this.router.navigate([`/doctors/update/${doctorId}`]);
  }

  deleteDoctor(id: string): void {
    if (confirm('Are you sure you want to delete this doctor?')) {
      this.adminService.deleteDoctor(id).subscribe({
        next: () => {
          this.fetchDoctors();
        },
        error: (error) => {
          console.error('Error deleting doctor:', error);
          this.hasErrorDoctors = true;
          this.errorMessageDoctors = 'Failed to delete doctor.';
        },
      });
    }
  }
}
