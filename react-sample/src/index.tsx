import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthContextProvider } from "./context/auth-context";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";

function AppWrapper() {
  return (
    <React.StrictMode>
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    </React.StrictMode>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <FluentProvider theme={webLightTheme}>
      <AppWrapper />
    </FluentProvider>,
  );
}
