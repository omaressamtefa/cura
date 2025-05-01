import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin/admin.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { LoaderService } from '../../core/services/loader/loader.service';

interface Patient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  imageUrl: string | null; // Changed from 'image' to 'imageUrl' to match backend
  department: Array<{
    doctorFirstName?: string;
    doctorLastName?: string;
    diagnosis?: string;
    treatment?: string;
    doctorId?: number;
  }>;
}

@Component({
  selector: 'app-patient-details',
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.scss'],
})
export class PatientDetailsComponent implements OnInit {
  patient: Patient | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  departmentError: string | null = null;
  role: string | null = null;
  safeImageUrl: SafeUrl | null = null;
  imageLoadFailed: boolean = false;
  private readonly baseApiUrl = 'https://cura.runasp.net'; // Update this to your deployed backend host if different
  private readonly fallbackImageUrl = '/assets/images/default-patient.jpg';

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.checkAuthorization();
    this.loadPatient();
  }

  checkAuthorization(): void {
    if (!this.role || (this.role !== 'admin' && this.role !== 'doctor')) {
      this.errorMessage = 'Unauthorized access: Admins or doctors only.';
      this.toastr.error(
        this.errorMessage ?? 'An unknown error occurred.',
        'Error'
      );
      this.router.navigate(['/']);
    }
  }

  loadPatient(): void {
    this.isLoading = true;
    this.loaderService.show();
    this.errorMessage = null;
    this.departmentError = null;
    const patientId = this.route.snapshot.paramMap.get('id');
    if (!patientId) {
      this.errorMessage = 'Patient ID not provided.';
      this.toastr.error(this.errorMessage, 'Error');
      this.isLoading = false;
      this.loaderService.hide();
      this.router.navigate(['/']);
      return;
    }

    this.adminService.getPatientById(patientId).subscribe({
      next: (response) => {
        this.patient = response.data || null;
        console.log('Fetched Patient Data:', this.patient);

        if (!this.patient) {
          this.errorMessage = `Patient with ID ${patientId} not found.`;
          this.toastr.error(this.errorMessage, 'Error');
          this.isLoading = false;
          this.loaderService.hide();
          return;
        }

        // Handle image URL
        if (this.patient.imageUrl) {
          const imageUrl = this.patient.imageUrl.startsWith('http')
            ? this.patient.imageUrl
            : `${this.baseApiUrl}${
                this.patient.imageUrl.startsWith('/') ? '' : '/'
              }${this.patient.imageUrl}`;
          console.log('Constructed Image URL:', imageUrl);
          this.setSafeImageUrl(imageUrl);
          this.testImageUrl(imageUrl);
        } else {
          console.log('No image URL provided, using fallback image.');
          this.setSafeImageUrl(this.fallbackImageUrl);
          this.imageLoadFailed = true;
        }

        // Check department data
        if (!this.patient.department || this.patient.department.length === 0) {
          this.departmentError =
            'No treatment history available for this patient.';
          this.patient.department = [];
        } else {
          console.log('Treatment History Data:', this.patient.department);
        }

        this.isLoading = false;
        this.loaderService.hide();
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.toastr.error(
          this.errorMessage ?? 'An unknown error occurred.',
          'Error'
        );
        this.isLoading = false;
        this.loaderService.hide();
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
      console.log('Image loaded successfully:', url);
      this.imageLoadFailed = false;
    };
    img.onerror = (error) => {
      console.warn('Failed to load image:', url, error);
      this.imageLoadFailed = true;
      this.setSafeImageUrl(this.fallbackImageUrl);
    };
  }

  handleImageError(): void {
    console.warn(
      'Patient image failed to load, falling back to default image.'
    );
    this.imageLoadFailed = true;
    this.setSafeImageUrl(this.fallbackImageUrl);
  }

  editPatient(id: string): void {
    if (!id || id === '0') {
      this.toastr.error('Invalid patient ID.', 'Error');
      return;
    }
    this.router.navigate([`/patients/update/${id}`]);
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
        const deleteObservable =
          this.role === 'doctor'
            ? this.adminService.deletePatientByDoctor(id)
            : this.adminService.deletePatient(id);

        deleteObservable.subscribe({
          next: () => {
            this.toastr.success('Patient deleted successfully!', 'Success');
            const userId = this.authService.getUserId();
            if (this.role === 'admin') {
              this.router.navigate(['/home/admin']);
            } else if (this.role === 'doctor' && userId) {
              this.router.navigate([`/home/doctor/${userId}`]);
            } else {
              this.router.navigate(['/home']);
            }
          },
          error: (error) => {
            this.errorMessage = error.message;
            this.toastr.error('Failed to delete patient.', 'Error');
          },
        });
      }
    });
  }
}
