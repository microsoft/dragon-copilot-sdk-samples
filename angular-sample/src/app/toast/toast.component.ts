import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['../app.css', './toast.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Toast {
  @Input() message?: string;
  @Input() type: 'inprogress' | 'success' | 'error' | null = 'inprogress';
}
