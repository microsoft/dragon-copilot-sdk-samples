import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from './auth.service';
import { dragon, type RecordingMode } from './dragon';
import { environment } from './environment';
import { session } from './session';
import { Account } from './account/account.component';
import { SignIn } from './sign-in/sign-in.component';
import { Recording } from './recording/recording.component';
import { Toast } from './toast/toast.component';


// Toast type alias kept minimal for sample clarity
export type ToastType = 'inprogress' | 'success' | 'error';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, Account, SignIn, Recording, Toast],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  protected initialized = false;
  protected recordingMode: RecordingMode | null = null;
  protected volumeLevel = 0;
  protected toastMessage: string | null = null;
  protected toastType: ToastType | null = null;
  protected hasMicrophone = false;
  protected processingDictation = false;
  protected isSigningIn = false;

  private readonly fb = inject(NonNullableFormBuilder);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  // Reactive form model: holds dynamic inputs
  form: FormGroup<{ dynamicInputs: FormArray<FormControl<string>> }>;

  // Input element configuration
  protected inputConfig: Array<{
    containerId: string;
    labelFor: string;
    labelText: string;
    conceptName: string;
    controlType: 'input' | 'textarea';
  }> = [];

  /** Creates the root application component and initializes the reactive form model. */
  constructor(protected auth: AuthService) {
    this.form = this.fb.group({ dynamicInputs: this.fb.array<FormControl<string>>([]) });

    this.auth.onInitializationComplete$.subscribe((isComplete) => {
      if (isComplete && this.auth.isAuthenticated) {
        this.initialize();
      }
    });
  }

  /**
   * Initiates an interactive Signin using the authentication service.
   */
  async signIn() {
    try {
      this.isSigningIn = true;
      await this.auth.signinPopup().then(() => {
        this.initialize();
      });
    } catch (error) {
      console.error('Signin error:', error);
    } finally {
      this.isSigningIn = false;
    }
  }

  /**
   * Signs out the current user (popup flow) and resets authentication state.
   */
  async signOut() {
    try {
      await this.destroy();
      await this.auth.signOut();
    } catch (error) {
      console.error('Signout error:', error);
    }
  }

  /**
   * Initializes the Dragon SDK exactly once (idempotent) and sets up event handlers.
   */
  initialize() {
    if (this.initialized) {
      return; // idempotent
    }
    const services = {
      dragonMedicalServer: environment.dragonConfig.dragonMedicalServer,
    };

    this.attachEventHandlers();

    dragon
      .initialize({
        partnerGuid: environment.dragonConfig.partnerGuid,
        environmentId: environment.dragonConfig.environmentId,
        applicationName: environment.dragonConfig.applicationName,
        speechOptions: {
          language: environment.dragonConfig.speechLanguage,
        },
        services: services,
        authentication: {
          acquireAccessToken: this.auth.acquireAccessToken.bind(this.auth),
          scopeBehavior: 'serviceScoped',
        },
        isAmbientEnabled: true,
        isDictationEnabled: true,
      })
      .then(() => {
        console.log('Dragon SDK initialized successfully');
        this.initialized = true;
        dragon.recording.ambient.setSessionData(session.ambientData);
        if (this.inputConfig.length === 0) {
          for (let i = 0; i < 5; i++) {
            this.addControl();
          }
        }
      })
      .catch((error: any) => {
        console.error('Dragon SDK initialization failed:', error);
      });
  }

  async destroy() {
    if (!this.initialized) {
      return;
    }
    await dragon.destroy().finally(() => {
      this.initialized = false;
    });
    console.log('Dragon SDK destroyed');
  }

  /**
   * Registers global Dragon SDK event handlers (errors, etc.).
   */
  attachEventHandlers() {
    dragon.error.events.addEventListener('errorOccurred', (event) => {
      console.error(
        'Dragon SDK Error Occurred',
        `errorCode: ${event.detail.errorCode}, title: ${event.detail.title}, message: ${event.detail.message}`,
      );
    });

    dragon.recording.ambient.events.addEventListener(
      'ambientRecordingUploadStatusChanged',
      (event) => {
        console.log('Ambient recording upload status changed:', event.detail);
        switch (event.detail.status) {
          case 'uploading':
            this.showToast('Uploading ambient audio...', 'inprogress');
            break;
          case 'uploadCompleted':
            console.log('Recording successfully uploaded');
            this.showToast('Ambient audio successfully uploaded', 'success');
            break;
          case 'uploadFailed':
            console.error('Recording upload failed');
            this.showToast('Ambient audio upload failed', 'error');
            break;
        }
      },
    );

    dragon.recording.events.addEventListener('recordingStarted', (event) => {
      if (event.detail.recordingMode === 'ambient') {
        console.log('Ambient recording started');
        this.recordingMode = 'ambient';
      } else if (event.detail.recordingMode === 'dictation') {
        console.log('Dictation recording started');
        this.recordingMode = 'dictation';
      }
    });

    dragon.recording.events.addEventListener('recordingStopped', (event) => {
      if (event.detail.recordingMode === 'ambient') {
        console.log('Ambient recording stopped. Duration:', event.detail.recordingDuration);
      } else if (event.detail.recordingMode === 'dictation') {
        console.log('Dictation recording stopped.');
      }
      this.recordingMode = null;
    });

    dragon.recording.dictation.events.addEventListener('dictationProcessingStarted', () => {
      this.processingDictation = true;
    });

    dragon.recording.dictation.events.addEventListener('dictationProcessingFinished', () => {
      this.processingDictation = false;
    });

    dragon.recording.events.addEventListener('recordingVolumeChanged', (event) => {
      this.volumeLevel = event.detail.volume;
    });

    dragon.microphone.events.addEventListener('microphoneListChanged', (event) => {
      console.log('Microphone list changed:', event.detail.microphones);
      this.hasMicrophone = event.detail.microphones.length !== 0;
    });
  }

  /**
   * Adds a new empty dynamic text input control to the reactive FormArray.
   */
  addControl() {
    const index = this.dynamicInputs().length;
    this.dynamicInputs().push(new FormControl<string>('', { nonNullable: true }));

    let controlType: 'input' | 'textarea' = 'input';
    let conceptName = 'Patient Name';

    if (index > 0) {
      controlType = 'textarea';
      conceptName = session.fields[(index - 1) % session.fields.length];
    }

    this.inputConfig.push({
      containerId: `container-${index}`,
      labelFor: `dynamic-input-${index}`,
      labelText: conceptName,
      conceptName: conceptName,
      controlType: controlType,
    });
  }

  /**
   * Removes the last dynamic text input control if any exist.
   */
  removeControl() {
    const dynamicInputsArray = this.dynamicInputs();
    if (!dynamicInputsArray.length) {
      console.warn('No dynamically added controls found to remove');
      return;
    }
    dynamicInputsArray.removeAt(dynamicInputsArray.length - 1);

    // Remove corresponding input configuration
    this.inputConfig.pop();
  }

  /** Returns the FormArray containing all dynamic input controls. */
  dynamicInputs(): FormArray<FormControl<string>> {
    return this.form.get('dynamicInputs') as FormArray<FormControl<string>>;
  }

  /** True when at least one dynamic input control exists. */
  hasDynamicControls(): boolean {
    return this.dynamicInputs().length > 0;
  }

  toggleDictation() {
    dragon.recording.toggleRecording({ recordingMode: 'dictation' });
  }

  toggleAmbient() {
    dragon.recording.toggleRecording({ recordingMode: 'ambient' });
  }

  /** Displays a temporary toast message (auto-dismiss 3s) */
  private showToast(message: string, type: ToastType) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.toastType = null;
      this.toastTimeout = null;
    }, 3000);
  }
}
