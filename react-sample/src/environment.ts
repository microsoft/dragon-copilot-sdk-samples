const defaultEnvironment = {
  dragonConfig: {
    applicationName: 'react-sample',
    partnerGuid: 'YOUR_PARTNER_GUID', // Replace with your Partner GUID
    dragonMedicalServer: {
      url: 'https://dragon.example.com', // Replace with your Dragon Medical Server URL
      scope: 'api://YOUR_SCOPE', // Token scope for Dragon Medical Server
    },
    speechLanguage: 'en-US',
  },
  msalConfig: {
    auth: {
      clientId: 'YOUR_CLIENT_ID', // Replace with your Azure AD app client ID
      authority: 'https://login.microsoftonline.com/common', // Or your specific tenant ID
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage' as const,
      storeAuthStateInCookie: false,
    },
    scopes: ['user.read'], // Default scopes for login
  },
};

function getEnvironmentFromLocalStorage(): typeof defaultEnvironment | undefined {
  const storageKey = 'react-sample-env';

  try {
    const value = localStorage.getItem(storageKey);
    if (value) {
      return JSON.parse(value);
    }
  } catch (e) {
    console.error('Failed to parse environment from localStorage:', e);
  }

  return undefined;
}

const localStorageEnvironment = getEnvironmentFromLocalStorage();

export const environment = localStorageEnvironment ?? defaultEnvironment;
