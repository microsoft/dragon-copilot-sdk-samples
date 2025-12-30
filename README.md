# Dragon Copilot SDK for Javascript

The Dragon Copilot SDK enables you to add speech recognition functionality to your web browser applications.

## Installation & Usage

Import CDN using script tag
```html
<script src="https://download.microsoft.com/download/fcb94e4a-b6ed-4905-9ea0-5186c44faaed/dragon-copilot-sdk-mainline.js"></script>
```

Access dragon object and initialize
```TS
await globalThis.DragonCopilotSDK.dragon.initialize(options);
```

`options` is a configuration object that allows you to set up the SDK.

| Property | Type | Mandatory | Description | Default |
| --- | --- | --- | --- | --- |
| `services` | `ServiceConfig` | ✅ Yes | Service configurations or region code for backend services.| — |
| `applicationName` | `string` | ✅ Yes | Name of the application integrating with the SDK | — |
| `authentication` | `AuthenticationOptions` | ✅ Yes | Authentication options. The consuming application must implement Entra ID or EHR authentication via a callback provided to the SDK. | — |
| `partnerGuid` | `string` | ✅ Yes  | Partner GUID | — |
| `enableAll` | `boolean` | ❌ No | Enables speech recognition for all text fields | `true` |
| `speechOptions` | `SpeechOptions` | ❌ No | Speech-related configuration options | — |
| `containerSelector` | `string` | ❌ No | The CSS selector of the DOM element which serves as a direct or indirect container for the text controls to be speech-enabled. This DOM element will be monitored by the SDK for DOM changes. If not provided, the SDK will default to using the document body as the container. | — |
| `useConsoleLogger` | `boolean` or `ConsoleLoggerOptions` | ❌ No | Enables console logging or provides logger options | `false` |
| `environmentId` | `string` | ❌ No | Colossus Environment ID | — |
| `customControlOptions` | `CustomControlOptions` | ❌ No | Custom control options for SDK components | — |
| `dispatchAllCommands` | `boolean` | ❌ No | If true, dispatches all recognized commands | `false` |
| `traceId` | `string` | ❌ No | Trace identifier for logging/diagnostics | — |
| `isAmbientEnabled` | `boolean` | ❌ No | Enables ambient mode | `false` |
| `isDictationEnabled` | `boolean` | ❌ No | Enables dictation mode | `true` |
| `platformGuid` | `string` | ❌ No | Platform GUID for integration | — |
| `daxProductId` | `string` | ❌ No | DAX product identifier | — |
| `preferredMicrophone` | `PreferredMicrophone` | ❌ No | Preferred microphone configuration | — |
| `buttonPreferences` | `Partial<MicrophoneButtonPreferences>` | ❌ No | Microphone button settings | — |
| `navigationOptions` | `Partial<NavigationOptions>` | ❌ No | Field delimiter/navigation preferences | — |
| `speechObjects` | `SpeechObjectsConfiguration` | ❌ No | Speech objects configuration | — |
| `clientType` | `ClientType` | ❌ No | Type of client (e.g., VUI form, audio) | — |
| `disabledSystemCommands` | `Set<Extract<SystemCommand, "scratchThat" \| "compoundThat" \| "undo" \| "redo" \| "beginningOfField" \| "endOfField">>` | ❌ No |  **This feature is not yet available and may change before public release. Not all system commands are supported.** The list of system commands to disable.| — |
|`additionalSystemCommandSpokenForms`|`AdditionalSystemCommandSpokenForms`|❌ No| Extends built-in system commands with custom spoken forms while preserving their original built-in spoken form.| — |
| `correctionOptions` | `CorrectionOptions` |❌ No| Correction related configuration options. | — |

#### Sample Initialization

```TS
await globalThis.DragonCopilotSDK.dragon.initialize({
  services: {
    dragonMedicalServer: {
      url: "https://dms.url.com",
      scope: "",
    },
  },
  authentication: {
    acquireAccessToken: acquireAccessTokenCallback,
    scopeBehavior:"serviceScope"
  },  
  partnerGuid: "MyPartnerGuid",
  applicationName: "MyApp",
});
```