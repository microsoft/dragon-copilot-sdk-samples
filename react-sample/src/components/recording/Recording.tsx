import { Spinner, Tooltip } from "@fluentui/react-components";
import type * as Dragon from "@microsoft/dragon-copilot-sdk-types";
import { useEffect, useState } from "react";
import "../../App.css";
import { useAuthContext } from "../../context/auth-context";
import { getDragonService, type RecordingMode } from "../../services/dragon-service";
import "./Recording.css";

const dragon = ((window as any).DragonCopilotSDK?.dragon ?? undefined) as unknown as typeof Dragon;

/**
 * Component to wrap Dragon Copilot SDK recording controls and recording status.
 */
export function Recording() {
  const { authService } = useAuthContext();
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(null);
  const [volume, setVolume] = useState<number>(0);
  const [processingDictation, setProcessingDictation] = useState<boolean>(false);
  const [hasMicrophone, setHasMicrophone] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  /**
   * Subscribe to DragonService observables to update component state accordingly.
   */
  useEffect(() => {
    const dragonService = getDragonService(authService);

    const recordingModeSub = dragonService.onRecordingModeChanged$.subscribe(setRecordingMode);
    const volumeSub = dragonService.onVolumeChanged$.subscribe(setVolume);
    const processingDictationSub = dragonService.onProcessingDictationChanged$.subscribe(setProcessingDictation);
    const hasMicrophoneSub = dragonService.onHasMicrophoneChanged$.subscribe(setHasMicrophone);
    const initializedSub = dragonService.onInitializedChanged$.subscribe(setIsInitialized);

    return () => {
      recordingModeSub.unsubscribe();
      volumeSub.unsubscribe();
      processingDictationSub.unsubscribe();
      hasMicrophoneSub.unsubscribe();
      initializedSub.unsubscribe();
    };
  }, [authService]);

  const handleToggleDictation = () => {
    try {
      dragon.recording.toggleRecording({ recordingMode: "dictation" });
    } catch (error) {
      console.error("Error toggling dictation:", error);
    }
  };

  const handleToggleAmbient = () => {
    try {
      dragon.recording.toggleRecording({ recordingMode: "ambient" });
    } catch (error) {
      console.error("Error toggling ambient:", error);
    }
  };

  const getShadowForRecordingMode = (recordingModeParam: string) => {
    if (recordingMode === recordingModeParam) {
      const spread = volume / 10;
      return `rgba(70, 79, 235, 0.18) 0 0 0 ${spread}px`;
    }
    return `var(--shadow4Brand)`;
  };

  const getDictationButtonShadow = () => {
    return getShadowForRecordingMode("dictation");
  };

  const getAmbientButtonShadow = () => {
    return getShadowForRecordingMode("ambient");
  };

  const dictationButtonTooltip = recordingMode === "dictation" ? "Stop dictation" : "Start dictation";
  const ambientButtonTooltip = recordingMode === "ambient" ? "Stop ambient recording" : "Start ambient recording";

  return (
    <div className="recording">
      <div className="recording-button-wrapper">
        <Tooltip content={dictationButtonTooltip} relationship="description">
          <button
            id="dictation-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleDictation}
            className={`recording-button ${recordingMode === "dictation" ? "active" : ""}`}
            style={{ boxShadow: getDictationButtonShadow() }}
            disabled={!hasMicrophone || !isInitialized}
          >
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 10a.5.5 0 0 0-1 0 5.5 5.5 0 0 0 5 5.48v2.02a.5.5 0 0 0 1 0v-2.02c2.8-.26 5-2.61 5-5.48a.5.5 0 0 0-1 0 4.5 4.5 0 1 1-9 0Zm7.5 0a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0v5Z"></path>
            </svg>
            {processingDictation && (
              <Spinner
                className="dictation-processing-spinner"
                spinner={{ className: "dictation-processing-spinner-background" }}
                spinnerTail={{ className: "dictation-processing-spinner-tail" }}
              ></Spinner>
            )}
          </button>
        </Tooltip>
      </div>

      <div className="recording-button-wrapper">
        <Tooltip content={ambientButtonTooltip} relationship="description">
          <button
            id="ambient-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleAmbient}
            className={`recording-button ${recordingMode === "ambient" ? "active" : ""}`}
            style={{ boxShadow: getAmbientButtonShadow() }}
            disabled={!hasMicrophone || !isInitialized}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3c.38 0 .7.28.74.65l.01.1v16.5a.75.75 0 0 1-1.5.1V3.75c0-.41.34-.75.75-.75ZM8.25 6c.38 0 .7.28.75.65v10.6a.75.75 0 0 1-1.49.1V6.75c0-.41.33-.75.74-.75Zm7.5 0c.37 0 .69.28.74.65v10.6a.75.75 0 0 1-1.49.1V6.75c0-.41.33-.75.74-.75Zm-11 3c.38 0 .7.28.74.65l.01.1v4.5a.75.75 0 0 1-1.5.1v-4.6c0-.41.34-.75.75-.75Zm14.5 0c.38 0 .7.28.75.65v4.6a.75.75 0 0 1-1.5.1v-4.6c0-.41.34-.75.75-.75Z"></path>
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
