import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { FlowbiteService } from './core/services/flowbite/flowbite.service';
import { NavbarComponent } from './layouts/navbar/navbar.component';
import { HomeComponent } from './pages/home/home.component';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  currentRoute: string = '';
  layoutClass: string = '';

  constructor(
    private flowbiteService: FlowbiteService,
    private router: Router
  ) {
    // Subscribe to router events to track the current route
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        // Apply navbar-hidden class for login and reset-password routes
        this.layoutClass =
          this.currentRoute.startsWith('/login') ||
          this.currentRoute.startsWith('/reset-password')
            ? 'navbar-hidden'
            : '';
      });
  }

  ngOnInit(): void {
    this.flowbiteService.loadFlowbite((flowbite) => {});
  }
}
