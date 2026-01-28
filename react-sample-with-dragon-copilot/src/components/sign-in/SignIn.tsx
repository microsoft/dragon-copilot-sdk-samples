import { useState } from "react";
import { useAuthContext } from "../../context/auth-context";
import "./SignIn.css";
import { Button } from "@fluentui/react-components";

export function SignIn() {
  const { authService } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    try {
      await authService.signinPopup();
      window.location.reload(); // Refresh to update auth state
    } catch (error) {
      console.error("Signin error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-in-content">
      <div className="sign-in-main">
        <img src="/dragon-copilot.svg" className="sign-in-app-logo" />
        <label className="sign-in-app-title">Microsoft Dragon Copilot SDK for JavaScript Sample</label>
        <Button onClick={signIn} appearance="primary" disabled={isLoading} className="sign-in-button">
          Sign in
        </Button>
      </div>
      <div className="microsoft-logo-wrapper">
        <img src="/microsoft.svg" />
      </div>
    </div>
  );
}
