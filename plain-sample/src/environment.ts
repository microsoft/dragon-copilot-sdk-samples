const defaultEnvironment = {
  region: "us", // Replace with your region code. e.g., 'us', 'ca', 'uk', etc.
  dragonConfig: {
    applicationName: "plain-sample",
    partnerGuid: "YOUR_PARTNER_GUID", // Replace with your Partner GUID
    environmentId: "YOUR_ENVIRONMENT_ID", // Replace with your Environment ID
    speechLanguage: "en-US",
    authMode: "entra",
  },
  msalConfig: {
    auth: {
      clientId: "YOUR_CLIENT_ID", // Replace with your Azure AD app client ID
      authority: "https://login.microsoftonline.com/common", // Or your specific tenant ID
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "localStorage" as const,
      storeAuthStateInCookie: false,
    },
    scopes: ["user.read"], // Default scopes for login
  },
  ehrConfig: {
    customerId: "YOUR_CUSTOMER_ID", // Replace with your Customer ID
  },
};

function getEnvironmentFromLocalStorage(): typeof defaultEnvironment | undefined {
  const storageKey = "plain-sample-env";

  try {
    const value = localStorage.getItem(storageKey);
    if (value) {
      return JSON.parse(value);
    }
  } catch (e) {
    console.error("Failed to parse environment from localStorage:", e);
  }

  return undefined;
}

const localStorageEnvironment = getEnvironmentFromLocalStorage();

export const environment = localStorageEnvironment ?? defaultEnvironment;
