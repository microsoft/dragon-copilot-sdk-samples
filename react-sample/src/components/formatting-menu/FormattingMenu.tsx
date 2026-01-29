import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, type TextFormatType } from "lexical";
import React, { useEffect } from "react";
import { TextBold24Regular, TextItalic24Regular, TextUnderline24Regular } from "@fluentui/react-icons";
import "./FormattingMenu.css";

export function FormattingMenu() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);

  useEffect(() => {
    const updateButtonStates = () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
      }
    };

    const cleanup = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateButtonStates();
      });
    });

    return () => {
      cleanup();
    };
  }, [editor]);

  const applyFormat = (format: TextFormatType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
      }
    });
  };

  return (
    <div className="formatting-menu">
      <button className={"formatting-button " + (isBold ? "active" : "")} onClick={() => applyFormat("bold")}>
        <TextBold24Regular primaryFill={isBold ? "#0f6cbd" : "black"} />
      </button>
      <button className={"formatting-button " + (isItalic ? "active" : "")} onClick={() => applyFormat("italic")}>
        <TextItalic24Regular primaryFill={isItalic ? "#0f6cbd" : "black"} />
      </button>
      <button className={"formatting-button " + (isUnderline ? "active" : "")} onClick={() => applyFormat("underline")}>
        <TextUnderline24Regular primaryFill={isUnderline ? "#0f6cbd" : "black"} />
      </button>
    </div>
  );
}
