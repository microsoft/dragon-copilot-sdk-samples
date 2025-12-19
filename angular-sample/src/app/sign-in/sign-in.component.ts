import { Component, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['../app.css', './sign-in.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignIn {
  @Output() signIn = new EventEmitter<void>();
  @Input() isSigningIn: boolean = false;

  triggerSignIn() {
    this.signIn.emit();
  }
}
