import { useToastController, useId, Toast, ToastTitle, Toaster, Spinner } from "@fluentui/react-components";
import { useEffect } from "react";
import { useAuthContext } from "../../context/auth-context";
import { getDragonService } from "../../services/dragon-service";

type ToastType = "inprogress" | "success" | "error";

export function UploadToaster() {
  const { authService } = useAuthContext();
  const toastId = useId("toast");
  const toasterId = useId("toaster");
  const { dispatchToast, updateToast } = useToastController(toasterId);

  useEffect(() => {
    const dragonService = getDragonService(authService);

    const ambientUploadStatusSub = dragonService.onAmbientUploadStatusChanged$.subscribe((status) => {
      if (!status) return;
      switch (status) {
        case "uploading":
          console.log("Uploading ambient audio...");
          dispatchUploadToast("Uploading ambient audio...", "inprogress");
          break;
        case "uploadCompleted":
          console.log("Recording successfully uploaded");
          updateUploadToast("Ambient audio successfully uploaded", "success");
          break;
        case "uploadFailed":
          console.error("Recording upload failed");
          updateUploadToast("Ambient audio upload failed", "error");
          break;
      }
    });

    return () => {
      ambientUploadStatusSub.unsubscribe();
    };
  }, [authService]);

  const dispatchUploadToast = (message: string, type?: ToastType) => {
    switch (type) {
      case "inprogress":
        dispatchToast(
          <Toast>
            <ToastTitle media={<Spinner size="tiny" />}>{message}</ToastTitle>
          </Toast>,
          { toastId },
        );
        break;
      case "success":
      case "error":
        dispatchToast(
          <Toast>
            <ToastTitle>{message}</ToastTitle>
          </Toast>,
          { intent: type, toastId },
        );
      default:
        dispatchToast(
          <Toast>
            <ToastTitle>{message}</ToastTitle>
          </Toast>,
          { toastId },
        );
        break;
    }
  };

  const updateUploadToast = (message: string, type?: ToastType) => {
    switch (type) {
      case "error":
      case "success":
        updateToast({
          content: (
            <Toast>
              <ToastTitle>{message}</ToastTitle>
            </Toast>
          ),
          intent: type,
          toastId,
          timeout: 2000,
        });
      default:
        updateToast({
          content: (
            <Toast>
              <ToastTitle>{message}</ToastTitle>
            </Toast>
          ),
          toastId,
          timeout: 2000,
        });
    }
  };

  return <Toaster toasterId={toasterId} position="top-end" limit={1} offset={{ vertical: 42, horizontal: 16 }} />;
}
