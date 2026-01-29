import { LexicalSpeechPlugin } from "@microsoft/dragon-copilot-sdk-lexical-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useRef } from "react";
import { FormattingMenu } from "../formatting-menu/FormattingMenu";
import "../../App.css";
import "./TextControl.css";

interface CustomLexicalEditorProps {
  conceptName?: string;
}

export function CustomLexicalEditor({ conceptName }: CustomLexicalEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const theme = {
    text: {
      bold: "editor-bold",
      italic: "editor-italic",
      underline: "editor-underline",
    },
  };

  const initialConfig = {
    namespace: "MyEditor",
    theme,
    onError: (error: Error) => {
      console.error(error);
    },
  };

  return (
    <>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="input-section" ref={containerRef}>
          <label>{conceptName}</label>
          <>
            <FormattingMenu />
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="text-input content-editable"
                  aria-placeholder={"Dictate here..."}
                  placeholder={<div className="placeholder">Dictate here...</div>}
                  // Required attribute to identify custom editor controls
                  data-dragon-custom-control-type="lexicalControl"
                  // Optional data-dragon-concept-name attribute to enable speech navigation
                  data-dragon-concept-name={conceptName}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </>
          <LexicalSpeechPlugin historyPluginPresent={true} />
          <HistoryPlugin />
        </div>
      </LexicalComposer>
    </>
  );
}
