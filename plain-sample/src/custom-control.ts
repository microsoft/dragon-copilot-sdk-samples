import { TextArea } from "@fluentui/web-components";
import { dragon } from "./dragon";

/**
 * Implements a custom control initializer for fluent UI text area elements.
 * @param element The fluent UI text area element.
 * @param control The custom control interface.
 * @returns The initializer.
 */
export const customInputInitializer: dragon.customControls.CustomControlInitializer = function (element, control) {
  if (element.tagName.toLowerCase() !== "fluent-text-area") {
    throw new Error("Element must be a fluent-text-area");
  }

  const textArea = (element as TextArea).control as HTMLTextAreaElement;

  if (textArea == null) {
    throw new Error("Inner control must be a TextArea");
  }

  // configure the custom control
  control.newline = "\n";
  control.paragraph = "\n\n";
  control.isMultiline = true;

  const notifyCustomControl = () => {
    control.update({
      text: textArea.value,
      selection: {
        start: textArea.selectionStart ?? 0,
        end: textArea.selectionEnd ?? 0,
      },
      focus: element === textArea.ownerDocument.activeElement,
    });
  };

  // signal initial state
  notifyCustomControl();

  // changes coming as a result of dictation
  control.handle("text", ({ value, start, length }) => {
    textArea.value = textArea.value.slice(0, start) + value + textArea.value.slice(start + length);

    // setting the value does not always trigger an input or change event, so let's do it manually
    textArea.dispatchEvent(new Event("change", { bubbles: true }));
  });

  control.handle("selection", ({ start, end }) => {
    textArea.setSelectionRange(start, end);
  });

  control.handle("focus", (focus) => {
    if (focus) {
      textArea.focus();
    } else {
      textArea.blur();
    }
  });

  // changes coming from the html element
  textArea.addEventListener("input", notifyCustomControl);
  textArea.addEventListener("change", notifyCustomControl);
  textArea.addEventListener("select", notifyCustomControl);
  textArea.addEventListener("focusin", notifyCustomControl);
  textArea.addEventListener("focusout", notifyCustomControl);

  return function () {
    textArea.removeEventListener("input", notifyCustomControl);
    textArea.removeEventListener("change", notifyCustomControl);
    textArea.removeEventListener("select", notifyCustomControl);
    textArea.removeEventListener("focusin", notifyCustomControl);
    textArea.removeEventListener("focusout", notifyCustomControl);
  };
};
