import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);

  role = this.authService.role;
  userId = this.authService.userId;
  isLoggedIn = this.authService.isLoggedIn;

  dashboardLink = computed(() => {
    const role = this.role() ?? ''; // Null check with fallback
    const uid = this.userId() ?? '';
    if (!role || !uid) return '/home';
    if (role === 'admin') return '/home/admin';
    if (role === 'doctor') return `/home/doctor/${uid}`;
    if (role === 'patient') return `/home/patient/${uid}`;
    return '/home';
  });

  profileLink = computed(() => {
    const role = this.role() ?? '';
    const uid = this.userId() ?? '';
    console.log('NavbarComponent - Profile Link - Role:', role);
    console.log('NavbarComponent - Profile Link - UserId:', uid);
    if (!role || !uid) {
      console.log(
        'NavbarComponent - Profile Link - Role or UserId missing, returning /login'
      );
      return '/login';
    }
    const link = `/profile/${role}/${uid}`;
    console.log('NavbarComponent - Profile Link - Generated Link:', link);
    return link;
  });

  constructor() {
    effect(() => {
      const role = this.role() ?? '';
      const userId = this.userId() ?? '';
      const isLoggedIn = this.isLoggedIn();
      console.log('NavbarComponent - Effect - Role:', role);
      console.log('NavbarComponent - Effect - UserId:', userId);
      console.log('NavbarComponent - Effect - IsLoggedIn:', isLoggedIn);
      // Removed setTimeout to avoid timing issues
      if (!isLoggedIn && (!role || !userId)) {
        console.log('NavbarComponent - Effect - Redirecting to /login');
        this.router.navigate(['/login']);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Ensure redirect after logout
  }
}
