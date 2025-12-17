import "./App.css";
import { useState } from "react";
import { useAuthContext } from "./context/auth-context";
import { SignIn } from "./components/sign-in/SignIn";
import { Recording } from "./components/recording/Recording";
import { NativeTextInput } from "./components/text-control/NativeTextInput";
import { session } from "./session";
import { Account } from "./components/account/Account";
import { Button } from "@fluentui/react-components";
import { UploadToaster } from "./components/upload-toaster/UploadToaster";

type ControlType = "native";

interface Control {
  id: string;
  type: ControlType;
  conceptName: string;
}

export function App() {
  const { isInitialized: isAuthInitialized, isAuthenticated } = useAuthContext();

  const [controls, setControls] = useState<Control[]>([
    { id: "1", type: "native", conceptName: "Patient Name" },
    { id: "2", type: "native", conceptName: session.fields[0] },
    { id: "3", type: "native", conceptName: session.fields[1] },
    { id: "4", type: "native", conceptName: session.fields[2] },
    { id: "5", type: "native", conceptName: session.fields[3] },
  ]);

  const [nextFieldIndex, setNextFieldIndex] = useState<number>(5);

  const addControl = () => {
    const newControl: Control = {
      id: Date.now().toString(),
      type: "native",
      conceptName: nextFieldIndex === 0 ? "Patient Name" : session.fields[(nextFieldIndex - 1) % session.fields.length],
    };

    setControls([...controls, newControl]);
    setNextFieldIndex(nextFieldIndex + 1);
  };

  const removeControl = () => {
    setControls(controls.slice(0, controls.length - 1));
    setNextFieldIndex(nextFieldIndex - 1);
  };

  const renderControl = (control: Control) => {
    return <NativeTextInput id={control.id} conceptName={control.conceptName} />;
  };

  if (!isAuthInitialized) {
    return <div>Loading authentication and services...</div>;
  }

  return (
    <div className="App">
      {!isAuthenticated ? (
        <SignIn />
      ) : (
        <>
          <div className="toolbar">
            <div className="app-title">
              <img src="dragon-copilot.svg" className="app-title-logo" alt="Dragon Copilot SDK logo" />
              <span className="app-title-text">Microsoft Dragon Copilot SDK for JavaScript Sample</span>
            </div>
            <Account />
          </div>

          <div className="button-bar">
            <Button onClick={addControl} appearance="primary">
              Add Control
            </Button>
            <Button onClick={removeControl} appearance="secondary" disabled={controls.length === 0}>
              Remove Control
            </Button>
          </div>

          {/* Dragon enabled controls */}
          <div className="content">
            <div className="text-input-wrapper" data-dragon-container>
              {controls.map((control) => (
                <div key={control.id} className="control-wrapper">
                  {renderControl(control)}
                </div>
              ))}
            </div>
          </div>

          {/* Dragon ambient recording upload notifications */}
          <UploadToaster />

          {/* Dragon recording handler */}
          <Recording />
        </>
      )}
    </div>
  );
}

export default App;
