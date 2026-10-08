import type {
  KeyboardCommand,
  KeyboardEventMessage,
  KeyboardTransport,
} from "./keyboard-bridge.js";

export interface DragonServiceConfig {
  url: string;
  scope: string;
}

export interface DragonInitializeOptions {
  applicationName: string;
  partnerGuid: string;
  services: {
    dragonMedicalServer: DragonServiceConfig;
    configService?: DragonServiceConfig;
    ehrIntegrationService?: DragonServiceConfig;
  };
  environmentId?: string;
  authentication: {
    acquireAccessToken: () => Promise<string>;
    scopeBehavior: "ehrScoped";
  };
  enableAll: false;
  isDictationEnabled: true;
  containerSelector: string;
}

export interface DragonKeyboardConfiguration {
  applicationName: string;
  partnerGuid: string;
  services: DragonInitializeOptions["services"];
  environmentId?: string;
  acquireAccessToken: () => Promise<string>;
}

export interface DragonRuntime {
  initialize(options: DragonInitializeOptions): Promise<void>;
  recording: {
    toggleRecording(options: {
      recordingMode: "dictation";
    }): Promise<void>;
    events: EventTarget;
    dictation: {
      events: EventTarget;
    };
  };
}

export interface DragonSdkGlobal {
  initSpeechBroker(): void;
  dragon: DragonRuntime;
}

export interface DragonKeyboardControllerOptions {
  runtime: DragonSdkGlobal;
  target: HTMLTextAreaElement;
  transport: KeyboardTransport;
  configuration: DragonKeyboardConfiguration;
}

/**
 * Connects one Dragon-enabled textarea to a native composing-text sink.
 *
 * The target must be inside a container marked with data-dragon-container.
 * Native hosts should keep the textarea visually hidden but focusable.
 */
export class DragonKeyboardController {
  #runtime: DragonSdkGlobal;
  #target: HTMLTextAreaElement;
  #transport: KeyboardTransport;
  #configuration: DragonKeyboardConfiguration;
  #unsubscribeCommand: (() => void) | undefined;
  #initialized = false;
  #recording = false;
  #lastText = "";

  constructor(options: DragonKeyboardControllerOptions) {
    this.#runtime = options.runtime;
    this.#target = options.target;
    this.#transport = options.transport;
    this.#configuration = options.configuration;
  }

  async initialize(): Promise<void> {
    if (this.#initialized) {
      return;
    }

    this.#target.addEventListener("input", this.#handleTargetInput);
    this.#unsubscribeCommand = this.#transport.onCommand(this.#handleCommand);
    this.#runtime.dragon.recording.events.addEventListener(
      "recordingStopped",
      this.#handleRecordingStopped,
    );

    try {
      this.#runtime.initSpeechBroker();
      await this.#runtime.dragon.initialize({
        applicationName: this.#configuration.applicationName,
        partnerGuid: this.#configuration.partnerGuid,
        services: this.#configuration.services,
        environmentId: this.#configuration.environmentId,
        authentication: {
          acquireAccessToken: this.#configuration.acquireAccessToken,
          scopeBehavior: "ehrScoped",
        },
        enableAll: false,
        isDictationEnabled: true,
        containerSelector: "[data-dragon-container]",
      });
      this.#initialized = true;
      this.#send({ type: "ready" });
      this.#send({ type: "state", state: "idle" });
    } catch (error) {
      this.#send({
        type: "error",
        message: error instanceof Error ? error.message : "Dragon initialization failed",
      });
      throw error;
    }
  }

  dispose(): void {
    this.#target.removeEventListener("input", this.#handleTargetInput);
    this.#runtime.dragon.recording.events.removeEventListener(
      "recordingStopped",
      this.#handleRecordingStopped,
    );
    this.#unsubscribeCommand?.();
    this.#unsubscribeCommand = undefined;
  }

  #handleCommand = (command: KeyboardCommand): void => {
    void this.#runCommand(command).catch((error: unknown) => {
      this.#send({
        type: "error",
        message: error instanceof Error ? error.message : "Dictation command failed",
      });
      this.#send({ type: "state", state: "idle" });
    });
  };

  async #runCommand(command: KeyboardCommand): Promise<void> {
    if (!this.#initialized) {
      this.#send({ type: "error", message: "Dragon is not initialized" });
      return;
    }

    if (command.type === "clear-marked-text") {
      this.#lastText = "";
      this.#target.value = "";
      this.#send({ type: "marked-text", text: "" });
      return;
    }

    if (command.type === "stop-dictation") {
      if (this.#recording) {
        await this.#toggleDictation();
      }
      return;
    }

    if (command.type === "start-dictation" && !this.#recording) {
      await this.#toggleDictation();
      return;
    }

    if (command.type === "toggle-dictation") {
      await this.#toggleDictation();
    }
  }

  async #toggleDictation(): Promise<void> {
    this.#target.focus();
    this.#send({
      type: "state",
      state: this.#recording ? "processing" : "recording",
    });
    await this.#runtime.dragon.recording.toggleRecording({
      recordingMode: "dictation",
    });
    this.#recording = !this.#recording;
    if (!this.#recording) {
      this.#send({ type: "commit-text", text: this.#target.value });
      this.#lastText = "";
      this.#target.value = "";
      this.#send({ type: "state", state: "idle" });
    }
  }

  #handleTargetInput = (): void => {
    const text = this.#target.value;
    if (text === this.#lastText) {
      return;
    }
    this.#lastText = text;
    this.#send({ type: "marked-text", text });
  };

  #handleRecordingStopped = (): void => {
    this.#recording = false;
    this.#send({ type: "state", state: "idle" });
  };

  #send(message: KeyboardEventMessage): void {
    this.#transport.send(message);
  }
}
