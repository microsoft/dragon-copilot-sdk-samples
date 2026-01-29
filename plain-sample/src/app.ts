import * as sampleCommands from "./application-commands";
import type { Auth } from "./auth";
import { customInputInitializer } from "./custom-control";
import { dragon } from "./dragon";
import { environment } from "./environment";
import { session } from "./session";

export class App {
  #auth: Auth;
  #initialized: boolean = false;
  #dragonInitialized: boolean = false;
  #hasMicrophone: boolean = false;
  #appContainer: HTMLElement | null = null;
  #currentView: string = "none";
  #nextField: number = 0;
  #permissionState: PermissionStatus | null = null;
  #toastTimeoutId: number | null = null;

  constructor(auth: Auth) {
    this.#auth = auth;
  }

  async initialize() {
    if (this.#initialized) {
      return;
    }

    this.#appContainer = document.getElementById("app");
    if (!this.#appContainer) {
      console.error("App container not found");
      return;
    }

    // Listen to authentication changes
    this.#auth.onAuthenticationStatusChanged = this.#authStatusChanged.bind(this);

    // Show initial view based on auth status
    this.#authStatusChanged(this.#auth.isAuthenticated);

    this.#initialized = true;
  }

  async #initializeDragon() {
    try {
      // The native Permission API should be used to query the microphone permission state.
      // Microphone permission is also required for HID functionality.
      this.#permissionState = await navigator.permissions.query({ name: "microphone" });
      this.#toggleMicrophonePermissionBanner();
      this.#permissionState.onchange = this.#onMicrophonePermissionChanged;

      this.#attachEventHandlers();

      const customControls = {
        customInput: customInputInitializer,
      } as const satisfies dragon.customControls.CustomControlCollection;

      await dragon.initialize({
        partnerGuid: environment.dragonConfig.partnerGuid,
        environmentId: environment.dragonConfig.environmentId,
        applicationName: environment.dragonConfig.applicationName,
        speechOptions: {
          language: environment.dragonConfig.speechLanguage,
        },
        services: environment.region,
        authentication: {
          acquireAccessToken: this.#auth.acquireAccessToken.bind(this.#auth),
        },
        isAmbientEnabled: true,
        isDictationEnabled: true,
        customControlOptions: {
          webCustomControlTypes: customControls,
        },
      });

      console.log("SDK initialized successfully");

      await this.#configureCustomCommands();

      await dragon.recording.ambient.setSessionData(session.ambientData);

      // Enables the button device (if available and permission is granted)
      dragon.buttonDevice.enableButtons(true);

      this.#dragonInitialized = true;
      this.#updateRecordingButtonsState();
    } catch (error) {
      console.error("SDK initialization failed:", error);
    }
  }

  async #destroy() {
    try {
      if (!this.#dragonInitialized) {
        return;
      }
      await dragon.destroy();
    } finally {
      this.#nextField = 0;
      this.#dragonInitialized = false;
    }
  }

  /**
   * Configure custom commands, command-sets, and placeholders.
   *
   * Commands that are triggered are captured in the #commandRecognizedHandler.
   */
  async #configureCustomCommands() {
    // Add or update all command-sets before adding commands or placeholders
    await dragon.applicationCommands.addOrUpdateCommandSets([sampleCommands.commandSet]);

    // Add all custom placeholders before adding commands that use them
    await dragon.applicationCommands.addOrUpdateCommandPlaceholders([sampleCommands.namedControlPlaceholder]);

    // Add or update all commands with a single call
    await dragon.applicationCommands.addOrUpdateCommands([
      sampleCommands.addControlCommand,
      sampleCommands.setNumberCommand,
      sampleCommands.addNamedControlCommand,
    ]);
  }

  #onMicrophonePermissionChanged = () => {
    console.log(`Browser microphone permission state changed to: ${this.#permissionState?.state}`);
    this.#toggleMicrophonePermissionBanner();
  };

  #toggleMicrophonePermissionBanner() {
    const denied = this.#permissionState?.state === "denied";
    document.getElementById("mic-permission-banner")!.style.display = denied ? "flex" : "none";
    const buttonBar = document.getElementsByClassName("button-bar")[0] as HTMLElement;
    buttonBar.style.top = denied ? "78px" : "42px";
    const content = document.getElementsByClassName("content")[0] as HTMLElement;
    content.style.top = denied ? "126px" : "90px";
  }

  #authStatusChanged(isAuthenticated: boolean) {
    if (isAuthenticated) {
      this.#showMainContentView();
      this.#initializeDragon();
    } else {
      this.#showSignInView();
    }
  }

  #showSignInView() {
    if (!this.#changeView("sign-in-template")) return;

    const signInButton = document.getElementById("sign-in-button");
    if (signInButton) {
      signInButton.addEventListener("click", () => this.#handleSignIn());
    }
  }

  #showMainContentView() {
    if (!this.#changeView("main-content-template")) return;

    const signOutButton = document.getElementById("sign-out-button");
    const toggleDictationButton = document.getElementById("toggle-dictation-button") as HTMLButtonElement;
    const toggleAmbientButton = document.getElementById("toggle-ambient-button") as HTMLButtonElement;
    const accountButton = document.getElementById("account-button");
    const accountMenu = document.querySelector(".account-menu") as HTMLElement;
    const addControlButton = document.getElementById("add-control-button");
    const removeControlButton = document.getElementById("remove-control-button");
    const micButtonPermissionButton = document.getElementById("hid-permission-button");

    toggleDictationButton.disabled = true;
    toggleAmbientButton.disabled = true;

    // Attach event listeners
    signOutButton?.addEventListener("click", () => this.#handleSignOut());
    toggleDictationButton?.addEventListener("click", () => this.#toggleDictation());
    toggleAmbientButton?.addEventListener("click", () => this.#toggleAmbient());
    addControlButton?.addEventListener("click", () => this.#addControl());
    removeControlButton?.addEventListener("click", () => this.#removeLastField());
    micButtonPermissionButton?.addEventListener("click", () => this.enableButtons());

    if (accountButton && accountMenu) {
      accountButton.textContent = this.#auth.accountInfo.initials;
      accountButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const isMenuVisible = accountMenu.style.display === "block";
        accountMenu.style.display = isMenuVisible ? "none" : "block";
        const accountTooltip = document.getElementById("account-tooltip") as HTMLElement;
        accountTooltip.style.display = isMenuVisible ? "block" : "none";
      });

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!accountButton.contains(e.target as Node) && !accountMenu.contains(e.target as Node)) {
          accountMenu.style.display = "none";
          const accountTooltip = document.getElementById("account-tooltip") as HTMLElement;
          accountTooltip.style.display = "block";
        }
      });

      const avatarInitial = document.getElementById("avatar-initial");
      avatarInitial!.textContent = this.#auth.accountInfo.initials;

      const lastAndFirst = document.getElementById("last-and-first");
      lastAndFirst!.textContent = this.#auth.accountInfo.name;

      const userAccount = document.getElementById("user-account");
      userAccount!.textContent = this.#auth.accountInfo.username;
    }

    const initialControlCount = 5;
    for (let i = 0; i < initialControlCount; i++) {
      this.#addControl();
    }
  }

  #addControl() {
    const fieldName = session.fields[this.#nextField];
    const isCustomField = this.#nextField !== 0;
    this.#nextField++;
    this.#addControlWithName(isCustomField, fieldName);
  }

  #addControlWithName(isCustomField: boolean, fieldName: string) {
    const dragonContainer = document.getElementById("dragon-container");
    dragonContainer?.appendChild(this.#createField(fieldName, fieldName, fieldName, isCustomField));
    this.#updateAddRemoveButtonState();
  }

  #removeLastField() {
    const dragonContainer = document.getElementById("dragon-container");
    this.#nextField--;
    dragonContainer?.lastElementChild?.remove();
    this.#updateAddRemoveButtonState();
  }

  #updateAddRemoveButtonState() {
    const dragonContainer = document.getElementById("dragon-container");
    const addControlButton = document.getElementById("add-control-button") as HTMLButtonElement;
    const removeControlButton = document.getElementById("remove-control-button") as HTMLButtonElement;
    addControlButton.disabled = this.#nextField >= session.fields.length;
    removeControlButton.disabled = !dragonContainer?.children.length;
  }

  #createField(id: string, label: string, conceptName: string, isCustomField: boolean) {
    const template = isCustomField
      ? (document.getElementById("custom-field-template") as HTMLTemplateElement)
      : (document.getElementById("field-template") as HTMLTemplateElement);
    const clone = template.content.cloneNode(true) as DocumentFragment;

    const labelEl = clone.querySelector("label");

    if (labelEl) {
      labelEl.textContent = label;
      labelEl.setAttribute("for", id);
    }

    const input = clone.querySelector("input, fluent-text-area");
    if (input) {
      input.id = id;
      input.setAttribute("data-dragon-concept-name", conceptName);
    }

    return clone;
  }

  #changeView(templateId: string): boolean {
    if (!this.#appContainer || this.#currentView === templateId) return false;

    this.#currentView = templateId;
    this.#appContainer.innerHTML = "";
    const template = document.getElementById(templateId) as HTMLTemplateElement;
    this.#appContainer.appendChild(template.content.cloneNode(true));

    return true;
  }

  async #handleSignIn() {
    const signInButton = document.getElementById("sign-in-button") as HTMLButtonElement;
    signInButton.disabled = true;

    try {
      await this.#auth.signIn();
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Sign in failed. Please try again.");
    } finally {
      signInButton.disabled = false;
    }
  }

  async #handleSignOut() {
    if (!this.#dragonInitialized) {
      return;
    }

    try {
      await this.#destroy();
      await this.#auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  async #toggleDictation() {
    await dragon.recording.toggleRecording({ recordingMode: "dictation" });
  }

  async #toggleAmbient() {
    await dragon.recording.toggleRecording({ recordingMode: "ambient" });
  }

  #attachEventHandlers() {
    dragon.error.events.addEventListener("errorOccurred", this.#errorOccurredHandler.bind(this));
    dragon.recording.events.addEventListener("recordingStarted", this.#recordingStartedHandler.bind(this));
    dragon.recording.events.addEventListener("recordingStopped", this.#recordingStoppedHandler.bind(this));
    dragon.recording.dictation.events.addEventListener(
      "dictationProcessingStarted",
      this.#dictationProcessingStartedHandler.bind(this),
    );
    dragon.recording.dictation.events.addEventListener(
      "dictationProcessingFinished",
      this.#dictationProcessingFinishedHandler.bind(this),
    );
    dragon.recording.events.addEventListener("recordingVolumeChanged", this.#recordingVolumeChangedHandler.bind(this));
    dragon.recording.ambient.events.addEventListener(
      "ambientRecordingUploadStatusChanged",
      this.#ambientRecordingUploadStatusChangedHandler.bind(this),
    );
    dragon.microphone.events.addEventListener("microphoneListChanged", this.#microphoneListChangedHandler.bind(this));
    dragon.applicationCommands.events.addEventListener("commandRecognized", this.#commandRecognizedHandler.bind(this));
    dragon.buttonDevice.events.addEventListener(
      "buttonDevicePermissionRequired",
      this.#buttonDevicePermissionRequiredHandler.bind(this),
    );
  }

  /**
   * Sample handler for Dragon SDK error events.
   * @param event The error event containing error details.
   */
  #errorOccurredHandler(event: CustomEvent<dragon.error.ErrorOccurredDetail>) {
    console.error(
      "Dragon SDK Error Occurred",
      `errorCode: ${event.detail.errorCode}, title: ${event.detail.title}, message: ${event.detail.message}`,
    );
    this.#showToast("An error occurred", "error", `${event.detail.message}`);
  }

  #recordingStartedHandler(event: CustomEvent<dragon.recording.RecordingStartedDetail>) {
    const recordingMode = event.detail.recordingMode;
    if (recordingMode === "dictation") {
      const toggleDictationButton = document.getElementById("toggle-dictation-button");
      toggleDictationButton?.classList.add("active");
      const toggleDictationButtonTooltip = document.getElementById("toggle-dictation-button-tooltip");
      if (toggleDictationButtonTooltip) {
        toggleDictationButtonTooltip.innerText = "Stop dictation";
      }
    } else if (recordingMode === "ambient") {
      const toggleAmbientButton = document.getElementById("toggle-ambient-button");
      toggleAmbientButton?.classList.add("active");
      const toggleAmbientButtonTooltip = document.getElementById("toggle-ambient-button-tooltip");
      if (toggleAmbientButtonTooltip) {
        toggleAmbientButtonTooltip.innerText = "Stop ambient recording";
      }
    }
  }

  #recordingStoppedHandler(event: CustomEvent<dragon.recording.RecordingStoppedDetail>) {
    this.#resetActiveRecordingButtonShadow();

    const recordingMode = event.detail.recordingMode;
    if (recordingMode === "dictation") {
      const toggleDictationButton = document.getElementById("toggle-dictation-button");
      toggleDictationButton?.classList.remove("active");
      const toggleDictationButtonTooltip = document.getElementById("toggle-dictation-button-tooltip");
      if (toggleDictationButtonTooltip) {
        toggleDictationButtonTooltip.innerText = "Start dictation";
      }
    } else if (recordingMode === "ambient") {
      const toggleAmbientButton = document.getElementById("toggle-ambient-button");
      toggleAmbientButton?.classList.remove("active");
      const toggleAmbientButtonTooltip = document.getElementById("toggle-ambient-button-tooltip");
      if (toggleAmbientButtonTooltip) {
        toggleAmbientButtonTooltip.innerText = "Start ambient recording";
      }
    }
  }

  #dictationProcessingStartedHandler() {
    const spinner = document.querySelector(".dictation-processing-spinner") as HTMLElement;
    if (spinner) {
      spinner.style.display = "block";
    }
  }

  #dictationProcessingFinishedHandler() {
    const spinner = document.querySelector(".dictation-processing-spinner") as HTMLElement;
    if (spinner) {
      spinner.style.display = "none";
    }
  }

  #recordingVolumeChangedHandler(event: CustomEvent<dragon.recording.RecordingVolumeChangedDetail>) {
    const volumeLevel = event.detail.volume;
    this.#setActiveRecordingButtonShadow(volumeLevel);
  }

  #setActiveRecordingButtonShadow(volumeLevel: number) {
    const activeRecordingButton = document.querySelector(".recording-button.active") as HTMLElement;
    if (activeRecordingButton) {
      const spread = volumeLevel / 10;
      activeRecordingButton.style.boxShadow = `rgba(70, 79, 235, 0.18) 0 0 0 ${spread}px`;
    }
  }

  #resetActiveRecordingButtonShadow() {
    const activeRecordingButton = document.querySelector(".recording-button.active") as HTMLElement;
    if (activeRecordingButton) {
      activeRecordingButton.style.boxShadow = "var(--shadow4Brand)";
    }
  }

  #ambientRecordingUploadStatusChangedHandler(
    event: CustomEvent<dragon.recording.ambient.AmbientRecordingUploadStatusChangedDetail>,
  ) {
    const status = event.detail.status;
    let message: string;

    switch (status) {
      case "uploading":
        message = "Uploading ambient audio...";
        this.#showToast(message, "progress");
        break;
      case "uploadCompleted":
        message = "Ambient audio successfully uploaded";
        this.#showToast(message, "success");
        break;
      case "uploadFailed":
        message = "Ambient audio upload failed";
        this.#showToast(message, "error");
        break;
    }
  }

  #showToast(title: string, type: "success" | "error" | "progress", message?: string) {
    if (this.#toastTimeoutId) {
      clearTimeout(this.#toastTimeoutId);
      this.#toastTimeoutId = null;
    }

    const toast = document.getElementById("toast") as HTMLElement;
    toast.innerHTML = "";

    let toastTypeTemplate = document.getElementById("success-toast-template") as HTMLTemplateElement;

    switch (type) {
      case "progress":
        toastTypeTemplate = document.getElementById("progress-toast-template") as HTMLTemplateElement;
        break;
      case "success":
        toastTypeTemplate = document.getElementById("success-toast-template") as HTMLTemplateElement;
        break;
      case "error":
        toastTypeTemplate = document.getElementById("error-toast-template") as HTMLTemplateElement;
        break;
    }

    toast.appendChild(toastTypeTemplate.content.cloneNode(true));

    const toastTextTemplate = document.getElementById("toast-text-template") as HTMLTemplateElement;
    toast.appendChild(toastTextTemplate.content.cloneNode(true));
    const toastText = toast.querySelector(".toast-text") as HTMLElement;
    const toastTitle = toastText.querySelector(".toast-title") as HTMLElement;
    toastTitle.textContent = title;

    if (message) {
      const toastMessageTemplate = document.getElementById("toast-message-template") as HTMLTemplateElement;
      toastText.appendChild(toastMessageTemplate.content.cloneNode(true));
      const toastMessage = toastText.querySelector(".toast-message") as HTMLElement;
      toastMessage.textContent = message;
    }

    toast.style.display = "grid";

    this.#toastTimeoutId = window.setTimeout(() => {
      toast.style.display = "none";
      this.#toastTimeoutId = null;
    }, 4000);
  }

  #microphoneListChangedHandler(event: CustomEvent<dragon.microphone.MicrophoneListChangedDetail>) {
    console.log("Microphone list changed:", event.detail.microphones);
    this.#hasMicrophone = event.detail.microphones.length !== 0;
    this.#updateRecordingButtonsState();
  }

  #updateRecordingButtonsState() {
    const toggleDictationButton = document.getElementById("toggle-dictation-button") as HTMLButtonElement;
    const toggleAmbientButton = document.getElementById("toggle-ambient-button") as HTMLButtonElement;
    const signOutButton = document.getElementById("sign-out-button") as HTMLButtonElement;
    const enableRecordingButtons = this.#hasMicrophone && this.#dragonInitialized;
    toggleDictationButton.disabled = !enableRecordingButtons;
    toggleAmbientButton.disabled = !enableRecordingButtons;
    signOutButton.disabled = !this.#dragonInitialized;
  }

  #commandRecognizedHandler(event: CustomEvent<dragon.applicationCommands.CommandRecognizedDetail>) {
    console.log(`Application command recognized: ${JSON.stringify(event.detail, null, 2)}`);

    if (event.detail.commandId === sampleCommands.addControlCommand.id) {
      this.#addControl();
    }

    if (event.detail.commandId === sampleCommands.addNamedControlCommand.id) {
      const fieldName = event.detail.placeholders[0].value;
      this.#addControlWithName(true, fieldName);
    }
  }

  #buttonDevicePermissionRequiredHandler(event: CustomEvent<dragon.buttonDevice.ButtonDevicePermissionRequiredDetail>) {
    console.log(`buttonDevicePermissionRequired: isRequired ${event.detail.isRequired}`);
    document.getElementById("hid-permission-banner")!.style.display = event.detail.isRequired ? "flex" : "none";
  }

  async enableButtons() {
    const buttonsEnabled = await dragon.buttonDevice.showMicButtonPermissionDialog();
    if (buttonsEnabled) {
      document.getElementById("hid-permission-banner")!.style.display = "none";
    }
  }
}
