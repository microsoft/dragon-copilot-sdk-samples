export type KeyboardCommand =
  | { type: "toggle-dictation" }
  | { type: "start-dictation" }
  | { type: "stop-dictation" }
  | { type: "clear-marked-text" };

export type KeyboardEventMessage =
  | { type: "ready" }
  | { type: "state"; state: "idle" | "recording" | "processing"; error?: string }
  | { type: "marked-text"; text: string }
  | { type: "commit-text"; text: string }
  | { type: "error"; message: string };

export interface KeyboardTransport {
  send(message: KeyboardEventMessage): void;
  onCommand(handler: (command: KeyboardCommand) => void): () => void;
}

/**
 * Adapts window messaging for a WKWebView/WebView host.
 *
 * The host must validate the message origin before forwarding commands to this
 * bridge. Commands are deliberately allow-listed and have no executable data.
 */
export function createWindowKeyboardTransport(
  target: Window = globalThis.window,
  targetOrigin = "*",
): KeyboardTransport {
  const handlers = new Set<(command: KeyboardCommand) => void>();

  const onMessage = (event: MessageEvent<unknown>) => {
    const command = event.data;
    if (!isKeyboardCommand(command)) {
      return;
    }
    handlers.forEach((handler) => handler(command));
  };

  target.addEventListener("message", onMessage);

  return {
    send(message) {
      target.parent.postMessage(message, targetOrigin);
    },
    onCommand(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}

function isKeyboardCommand(value: unknown): value is KeyboardCommand {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return false;
  }

  return (
    value.type === "toggle-dictation" ||
    value.type === "start-dictation" ||
    value.type === "stop-dictation" ||
    value.type === "clear-marked-text"
  );
}
