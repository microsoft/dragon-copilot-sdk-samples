import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-recording',
  templateUrl: './recording.component.html',
  styleUrls: ['../app.css', './recording.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Recording {
  @Input() hasMicrophone = false;
  @Input() hasDynamicControls = false;
  @Input() recordingMode?: 'dictation' | 'ambient' | null;
  @Input() volumeLevel = 0;
  @Input() processingDictation = false;

  @Output() toggleDictation = new EventEmitter<void>();
  @Output() toggleAmbient = new EventEmitter<void>();

  getShadowForRecordingMode(recordingMode: string): string {
    if (this.recordingMode === recordingMode) {
      const spread = this.volumeLevel / 10;
      return `rgba(70, 79, 235, 0.18) 0 0 0 ${spread}px`;
    }
    return `var(--shadow4Brand)`;
  }

  get dictationRecordingButtonShadow(): string {
    return this.getShadowForRecordingMode('dictation');
  }

  get ambientRecordingButtonShadow(): string {
    return this.getShadowForRecordingMode('ambient');
  }

  triggerToggleDictation() {
    this.toggleDictation.emit();
  }

  triggerToggleAmbient() {
    this.toggleAmbient.emit();
  }
}
