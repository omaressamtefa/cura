import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin/admin.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patientdashboard.component.html',
  styleUrls: ['./patientdashboard.component.scss'],
})
export class PatientDashboardComponent implements OnInit {
  userDetails: any = null;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.fetchUserDetails();
  }

  fetchUserDetails(): void {
    this.isLoading = true;
    this.hasError = false;

    this.adminService.getUserDetails().subscribe({
      next: (response: any) => {
        this.userDetails = response?.user || null;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.hasError = true;
        this.errorMessage = 'Failed to load your profile. Please try again.';
        this.isLoading = false;
        console.error('Error fetching user details:', error);
      },
    });
  }
}
