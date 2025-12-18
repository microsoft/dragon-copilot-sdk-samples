import type * as Dragon from "@microsoft/dragon-copilot-sdk-types";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "../environment";
import { AuthService } from "../services/auth-service";
import { session } from "../session";

// Bind the runtime global from the CDN and cast to the typed namespace
export const dragon = (globalThis as any).DragonCopilotSDK?.dragon as typeof Dragon;

export type RecordingMode = "ambient" | "dictation" | null;
export type AmbientUploadStatus = "uploading" | "uploadCompleted" | "uploadFailed";

/**
 * Service to manage intialization and events with the Dragon Speech SDK.
 */
export class DragonService {
  #auth: AuthService;

  // RxJS observables to expose Dragon Copilot SDK events to external components.

  private recordingMode$ = new BehaviorSubject<RecordingMode>(null);
  public onRecordingModeChanged$: Observable<RecordingMode> = this.recordingMode$.asObservable();

  private volume$ = new BehaviorSubject<number>(0);
  public onVolumeChanged$: Observable<number> = this.volume$.asObservable();

  private processingDictation$ = new BehaviorSubject<boolean>(false);
  public onProcessingDictationChanged$: Observable<boolean> = this.processingDictation$.asObservable();

  private hasMicrophone$ = new BehaviorSubject<boolean>(false);
  public onHasMicrophoneChanged$: Observable<boolean> = this.hasMicrophone$.asObservable();

  private initialized$ = new BehaviorSubject<boolean>(false);
  public onInitializedChanged$: Observable<boolean> = this.initialized$.asObservable();

  private ambientUploadStatus$ = new BehaviorSubject<AmbientUploadStatus | null>(null);
  public onAmbientUploadStatusChanged$: Observable<AmbientUploadStatus | null> = this.ambientUploadStatus$.asObservable();

  constructor(authService: AuthService) {
    this.#auth = authService;
  }

  async initialize(): Promise<void> {
    if (this.#auth.isAuthenticated === false) {
      console.log("Unauthenticated - skipping SDK initialization");
      return;
    }

    if (this.initialized$.value) {
      console.log("SDK already initialized");
      return;
    }

    console.log("SDK initializing...");

    // Attach event handlers before initialization as events may be emitted during the initialization process.
    this.#attachEventHandlers();
    
    try {
      await dragon.initialize({
        partnerGuid: environment.dragonConfig.partnerGuid,
        applicationName: environment.dragonConfig.applicationName,
        speechOptions: {
          language: environment.dragonConfig.speechLanguage,
        },
        services: {
          dragonMedicalServer: environment.dragonConfig.dragonMedicalServer,
        },
        authentication: {
          acquireAccessToken: this.#auth.acquireAccessToken.bind(this.#auth),
        },
        isAmbientEnabled: true,
        isDictationEnabled: true,
      });

      // If ambient mode is enabled, set any session data.
      // This should be called after initialization.
      await dragon.recording.ambient.setSessionData(session.ambientData);

      console.log("SDK initialized successfully");

      this.initialized$.next(true);
    } catch (error) {
      console.error("SDK initialization failed:", error);
      throw error;
    }
  }

  /**
   * Attach event handlers to the Dragon SDK events.
   *
   * This method should be called before SDK initialization to ensure all events are captured.
   */
  #attachEventHandlers() {
    dragon.error.events.addEventListener("errorOccurred", (event) => {
      console.error(
        "SDK Error Occurred",
        `errorCode: ${event.detail.errorCode}, title: ${event.detail.title}, message: ${event.detail.message}`,
      );
    });

    dragon.recording.events.addEventListener("recordingStarted", (event) => {
      if (event.detail.recordingMode === "ambient") {
        this.recordingMode$.next("ambient");
      } else if (event.detail.recordingMode === "dictation") {
        this.recordingMode$.next("dictation");
      }
    });

    dragon.recording.events.addEventListener("recordingStopped", () => {
      this.recordingMode$.next(null);
    });

    dragon.recording.events.addEventListener("recordingVolumeChanged", (event) => {
      this.volume$.next(event.detail.volume);
    });

    dragon.recording.dictation.events.addEventListener(
      "dictationProcessingStartedForElement",
      () => {
        this.processingDictation$.next(true);
      },
    );

    dragon.recording.dictation.events.addEventListener(
      "dictationProcessingFinished",
      () => {
        this.processingDictation$.next(false);
      },
    );

    dragon.microphone.events.addEventListener("microphoneListChanged", (event) => {
      this.hasMicrophone$.next(event.detail.microphones.length > 0);
    });

    dragon.recording.ambient.events.addEventListener("ambientRecordingUploadStatusChanged", (event) => {
      this.ambientUploadStatus$.next(event.detail.status as AmbientUploadStatus);
    });
  }
}

let dragonServiceInstance: DragonService | null = null;

/**
 * Gets the singleton instance of the DragonService.
 */
export function getDragonService(authService?: AuthService): DragonService {
  if (!dragonServiceInstance) {
    if (!authService) {
      throw new Error("AuthService is required to create DragonService instance");
    }
    dragonServiceInstance = new DragonService(authService);
    dragonServiceInstance.initialize();
  }
  return dragonServiceInstance;
}
