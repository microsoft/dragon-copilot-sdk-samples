import "../../App.css";
import "./TextControl.css";

interface NativeTextInputProps {
  id: string;
  conceptName?: string;
}

export function NativeTextInput({ id, conceptName }: NativeTextInputProps) {
  return (
    <div className="input-section">
      <label htmlFor={id}>{conceptName}</label>
      <input
        id={id}
        placeholder="Dictate here..."
        type="text"
        className="text-input"
        // Optional data-dragon-concept-name attribute to enable speech navigation
        data-dragon-concept-name={conceptName}
      />
    </div>
  );
}
