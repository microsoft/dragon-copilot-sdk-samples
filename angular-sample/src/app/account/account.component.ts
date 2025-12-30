import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['../app.css', './account.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Account {
  @Input() username?: string;
  @Input() disabled = false;
  @Output() signOut = new EventEmitter<void>();

  showMenu = false;

  get initials(): string {
    if (!this.username) {
      return '';
    }

    const parts = this.username.split(/[@.\s_-]+/);

    if (parts.length >= 2) {
      return (parts[1][0] + parts[0][0]).toUpperCase();
    }

    return this.username.substring(0, 2).toUpperCase();
  }

  get lastAndFirst(): string {
    if (!this.username) {
      return '';
    }

    const parts = this.username.split(/[@.\s_-]+/);
    if (parts.length >= 2) {
      return `${parts[1][0].toUpperCase() + parts[1].slice(1)}, ${parts[0][0].toUpperCase() + parts[0].slice(1)}`;
    }

    return this.username;
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  triggerSignOut() {
    this.signOut.emit();
    this.showMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showMenu && !target.closest('app-account')) {
      this.showMenu = false;
    }
  }
}
