import "./App.css";
import { useEffect, useState } from "react";
import { useAuthContext } from "./context/auth-context";
import { SignIn } from "./components/sign-in/SignIn";
import { Recording } from "./components/recording/Recording";
import { NativeTextInput } from "./components/text-control/NativeTextInput";
import { session } from "./session";
import { Account } from "./components/account/Account";
import { Button } from "@fluentui/react-components";
import { UploadToaster } from "./components/upload-toaster/UploadToaster";
import { getDragonService } from "./services/dragon-service";

type ControlType = "native";

interface Control {
  id: string;
  type: ControlType;
  conceptName: string;
}

export function App() {
  const {
    isInitialized: isAuthInitialized,
    isAuthenticated,
    authService,
  } = useAuthContext();

  const [controls, setControls] = useState<Control[]>([
    { id: "1", type: "native", conceptName: "Patient Name" },
    { id: "2", type: "native", conceptName: session.fields[0] },
    { id: "3", type: "native", conceptName: session.fields[1] },
    { id: "4", type: "native", conceptName: session.fields[2] },
    { id: "5", type: "native", conceptName: session.fields[3] },
  ]);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [nextFieldIndex, setNextFieldIndex] = useState<number>(5);
  const dragonService = getDragonService(authService);

  const addControl = () => {
    const newControl: Control = {
      id: Date.now().toString(),
      type: "native",
      conceptName:
        nextFieldIndex === 0
          ? "Patient Name"
          : session.fields[(nextFieldIndex - 1) % session.fields.length],
    };

    setControls([...controls, newControl]);
    setNextFieldIndex(nextFieldIndex + 1);
  };

  const removeControl = () => {
    setControls(controls.slice(0, controls.length - 1));
    setNextFieldIndex(nextFieldIndex - 1);
  };

  const renderControl = (control: Control) => {
    return (
      <NativeTextInput id={control.id} conceptName={control.conceptName} />
    );
  };

  /** Shows the specified settings view within the Dragon Copilot SDK iframe. */
  const showSettingsView = (view: string | null) => {
    // If iframe is already shown and just use api to navigate to view, so iframe won't reload
    if (showIframe === true && view) {
      dragonService.navigateToSettingView(view);
      return;
    }

    // Otherwise, get URLs and set iframe src
    dragonService.getUrls().then((urls) => {
      if (!urls) {
        console.error("Setting views URLs not available");
        return;
      }
      setIframeUrl(view ? urls.views[view] : urls.baseUrl);
      setShowIframe(true);
    });
  };

  useEffect(() => {
    const dragonService = getDragonService(authService);

    const initializedSub =
      dragonService.onInitializedChanged$.subscribe(setIsInitialized);
    return () => {
      initializedSub.unsubscribe();
    };
  }, [authService]);

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
              <img
                src="dragon-copilot.svg"
                className="app-title-logo"
                alt="Dragon Copilot SDK logo"
              />
              <span className="app-title-text">
                Microsoft Dragon Copilot SDK for JavaScript Sample
              </span>
            </div>
            <Account />
          </div>

          <div className="button-bar">
            <Button onClick={addControl} appearance="primary">
              Add Control
            </Button>
            <Button
              onClick={removeControl}
              appearance="secondary"
              disabled={controls.length === 0}
            >
              Remove Control
            </Button>
            {/* Show Dragon Copilot website in iframe */}
            <Button
              disabled={!isInitialized}
              onClick={() => showSettingsView(null)}
            >
              Show Dragon Copilot
            </Button>

            {/* Show specific settings views (settings-home) in iframe */}
            <Button
              disabled={!isInitialized}
              onClick={() => showSettingsView("settings-home")}
            >
              Show Settings-Home
            </Button>
            {/* Show specific settings views (settings-microphone) in iframe */}
            <Button
              disabled={!isInitialized}
              onClick={() => showSettingsView("settings-microphone")}
            >
              Show Settings-Microphone
            </Button>
            {/* Remove the Dragon Copilot iframe */}
            <Button
              disabled={!isInitialized}
              onClick={() => setShowIframe(false)}
            >
              Remove Dragon Copilot
            </Button>
            {/* Set new session data for Dragon Copilot and ambient recording */}
            <Button
              disabled={!isInitialized}
              onClick={() => dragonService.setSessionData()}
            >
              Set Session Data
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
            {/* Dragon Copilot in iframe, `data-dragon-iframe` is needed for the Dragon Copilot SDK to recognize the iframe */}
            <div className="iframe-wrapper">
              {showIframe && (
                <iframe
                  className="drc-frame"
                  src={iframeUrl ? iframeUrl : "about:blank"}
                  allow="microphone"
                  title="DRC Frame"
                  data-dragon-iframe
                ></iframe>
              )}
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
