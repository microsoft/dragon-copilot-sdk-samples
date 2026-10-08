# Dragon Copilot mobile keyboard bridge

This sample is the JavaScript side of an alternate keyboard for iOS and Android.
It is intentionally a bridge rather than a claim that the browser SDK can run
directly inside every keyboard extension.

The Dragon Copilot JavaScript SDK speech-enables DOM controls. The bridge keeps
one hidden `<textarea>` focused as the SDK's dictation target, then forwards its
value to the native keyboard as marked text:

```text
native keyboard button
        │ postMessage({ type: "toggle-dictation" })
        ▼
JavaScript bridge ── Dragon Copilot dictation ── hidden textarea
        │ postMessage({ type: "marked-text", text })
        ▼
native keyboard inserts/replaces marked text
```

## Integration boundary

`src/dragon-keyboard-controller.ts` is the only code that knows about the
Dragon SDK. `src/keyboard-bridge.ts` is a small transport protocol that can be
implemented by:

- an Android `WebView` hosted by the companion app;
- an iOS `WKWebView` hosted by the companion app;
- a browser-based prototype while the native keyboard UI is being built.

The native side should use its platform's composing-text API for
`marked-text`, not append every update as a separate committed string. On iOS
that is `setMarkedText`; on Android it is the composing span APIs on
`InputConnection`.

## Run the browser proof of concept

This folder is a library-oriented sample and does not require a framework:

```bash
npm install
npm run build
```

The host application must provide:

1. An authenticated Dragon Copilot SDK runtime.
2. `DragonCopilotSDK.initSpeechBroker()` before initialization.
3. A Dragon configuration with the partner GUID, service endpoints, and token
   callback.
4. A native text sink that applies `marked-text` and `commit-text` messages.

Create the target inside the WebView host page and keep it focusable:

```html
<div data-dragon-container>
  <textarea
    id="dragon-keyboard-target"
    aria-label="Dragon dictation target"
    autocomplete="off"
    autocapitalize="sentences"
    spellcheck="false"
    style="position: fixed; left: -10000px; width: 1px; height: 1px"
  ></textarea>
</div>
```

Pass an explicit `targetOrigin` to `createWindowKeyboardTransport` in
production. The default `"*"` is only convenient for a local prototype.

The SDK still owns authentication and service configuration. Do not put client
secrets or long-lived service credentials in the keyboard bundle.

## Native lifecycle notes

- Start the companion WebView only when the keyboard needs dictation and tear it
  down when the platform suspends it.
- Keep the current composing text in native state so partial Dragon updates
  replace the same marked range.
- Stop dictation before committing or clearing the composing range.
- Request microphone permission in the companion app, not from JavaScript.
- iOS keyboard extensions require the appropriate networking/open-access
  entitlement and Apple review approval; confirm those product constraints
  before treating this as a production architecture.
