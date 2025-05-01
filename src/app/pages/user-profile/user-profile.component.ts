import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin/admin.service';
import { AuthService } from '../../core/services/auth/auth.service'; // Import AuthService
import { TitleCasePipe } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  imports: [TitleCasePipe],
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService); // Inject AuthService
  route = inject(ActivatedRoute);
  router = inject(Router);
  sanitizer = inject(DomSanitizer);

  user: any = null;
  role: string | null = null;
  userId: string | null = null;
  loggedInUserId: string | null = null; // Store logged-in user's ID
  loggedInRole: string | null = null; // Store logged-in user's role
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  numberOfPatients: number = 0;
  safeImageUrl: SafeUrl | null = null;
  imageLoadFailed: boolean = false;
  private readonly baseApiUrl = 'https://cura.runasp.net';
  private readonly fallbackImageUrl = '/assets/images/default-user.jpg';

  ngOnInit() {
    // Get logged-in user's role and ID
    this.loggedInRole = this.authService.getRole();
    this.loggedInUserId = localStorage.getItem('userId');

    this.route.paramMap.subscribe((params) => {
      this.role = params.get('role');
      this.userId = params.get('id');
      this.loadUserDetails();
    });
  }

  loadUserDetails() {
    if (!this.userId || !this.role) {
      this.hasError = true;
      this.errorMessage = 'Invalid user ID or role.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    let requests: any[] = [];

    if (this.role === 'patient') {
      // Check if the logged-in user is a patient trying to access their own profile
      if (
        this.loggedInRole === 'patient' &&
        this.loggedInUserId !== this.userId
      ) {
        this.hasError = true;
        this.errorMessage = 'Unauthorized: You can only view your own profile.';
        this.isLoading = false;
        return;
      }

      // Fetch patient data
      requests.push(this.adminService.getPatientById(this.userId));
    } else {
      // Handle admin or doctor roles
      const userDetails$ = this.adminService.getUserDetails();
      requests.push(userDetails$);

      if (this.role === 'doctor') {
        requests.push(this.adminService.getDoctorPatients(this.userId));
      }
    }

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        if (this.role === 'patient') {
          this.user = responses[0].data;
        } else {
          this.user = responses[0].user;
          if (this.role === 'doctor') {
            this.numberOfPatients = responses[1]?.length || 0;
          }
        }

        // Handle image URL
        if (this.user.imageUrl) {
          const imageUrl = this.user.imageUrl.startsWith('http')
            ? this.user.imageUrl
            : `${this.baseApiUrl}${
                this.user.imageUrl.startsWith('/') ? '' : '/'
              }${this.user.imageUrl}`;
          this.setSafeImageUrl(imageUrl);
          this.testImageUrl(imageUrl);
        } else {
          this.setSafeImageUrl(this.fallbackImageUrl);
          this.imageLoadFailed = true;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load user details: ' + error.message;
        this.isLoading = false;
      },
    });
  }

  setSafeImageUrl(url: string | null): void {
    if (url) {
      this.safeImageUrl = this.sanitizer.bypassSecurityTrustUrl(url);
    } else {
      this.safeImageUrl = null;
    }
  }

  private testImageUrl(url: string): void {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.imageLoadFailed = false;
    };
    img.onerror = () => {
      this.imageLoadFailed = true;
      this.setSafeImageUrl(this.fallbackImageUrl);
    };
  }

  handleImageError(): void {
    this.imageLoadFailed = true;
    this.setSafeImageUrl(this.fallbackImageUrl);
  }

  getDetailIcon(field: string): string {
    const icons: { [key: string]: string } = {
      email: 'fas fa-envelope',
      specialty: 'fas fa-stethoscope',
      numberOfPatients: 'fas fa-users',
      id: 'fas fa-id-card',
      gender: 'fas fa-venus-mars',
      birthDate: 'fas fa-birthday-cake',
      createdAt: 'fas fa-calendar-plus',
    };
    return icons[field] || 'fas fa-info-circle';
  }

  getDisplayName(): string {
    if (!this.user) return '';
    if (this.role === 'admin') {
      return 'Admin';
    }
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  getProfileTitle(): string {
    if (this.role === 'admin') {
      return 'Admin Profile';
    } else if (this.role === 'doctor') {
      return 'Doctor Profile';
    } else {
      return 'Patient Profile';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}
