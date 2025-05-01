import { Injectable, Inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('AuthGuard - isLoggedIn:', isLoggedIn);
    if (isLoggedIn) return true;

    console.log('AuthGuard - User not authenticated, redirecting to /login');
    this.router.navigate(['/login']);
    return false;
  }
}
