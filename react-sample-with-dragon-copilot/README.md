# Dragon Copilot SDK for JavaScript - React sample

A working example showing how to integrate Dragon Copilot SDK for JavaScript into a React web application.

## Prerequisites

### Software requirements

- Node.js 18.12.0 or later (check with `node --version`)
- npm

### Access credentials

- Dragon Medical Server URL and Partner GUID
- Microsoft Entra tenant ID and application (client) ID

## Quick start

### 1. Install dependencies

Open a terminal in the project root folder and run:

```bash
npm install
```

### 2. Run the Application

```bash
npm start
```

Wait for "Application bundle generation complete" then open <http://localhost:1234> in your browser.

### 3. Configure your credentials

Open the developer console in your browser, go to the Console tab, and paste in the following code snippet, replacing the placeholder values with your actual configuration details and then refresh the page:

```javascript
localStorage.setItem('react-sample-env', JSON.stringify({
  dragonConfig: {
    applicationName: 'react-sample',
    partnerGuid: 'YOUR_PARTNER_GUID',
    dragonMedicalServer: {
      url: 'https://dragon.example.com',
      scope: 'api://YOUR_SCOPE',
    },
    speechLanguage: 'en-US',
    userId: 'test-user',
  },
  msalConfig: {
    auth: {
      clientId: 'YOUR_CLIENT_ID',
      authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
    scopes: ['user.read'],
  }
}));
```

> **Note:** In a production app, do not store sensitive configuration data in local storage. This is only for demonstration purposes.

## Step-by-step: Get speech recognition working

### Step 1: Sign in

Select **Sign in**. A popup opens asking for your credentials.

**If sign-in fails:**

- Check that your `clientId` and `authority` match your Microsoft Entra app registration.
- Verify your browser isn't blocking popups.
- Confirm your user account has permissions in Entra ID.

The Dragon Copilot SDK should automatically initialize after sign-in.

**If initialization fails:**

- Check the browser console (F12) for error messages.
- Common issue: Wrong `url` or `scope`.

### Step 2: Test recording

Grant permission to use the microphone when prompted by the browser.

Place the text cursor in any text field, select **Start dictation** and start speaking. Your words should appear in the text field as you talk.

Select **Start ambient recording** to start ambient recording. Ambient audio is captured automatically and sent to the server.

> **Note:** The UI only shows messages relating to the upload of ambient audio. Displaying the ambient results is outside the scope of this sample app.

Select **Add control** to create more text fields dynamically.

## Understand the code

### Authentication flow (`auth-service.ts`)

The app uses Microsoft Authentication Library (MSAL).

### Speech integration (`dragon-service.ts`)

Dragon Speech SDK is initialized here. The implementation listens for authentication state changes and initializes accordingly.

Event handlers should be attached before initialization.

If ambient mode is enabled the session data should be set with `dragon.recording.ambient.setSessionData(...)`.

### Dynamic Controls

The **Add control**/**Remove control** buttons dynamically add and remove speech fields:

- Each control must be inside a container element marked with the `data-dragon-container` attribute so the SDK can target it.
- A `data-dragon-concept-name="conceptname"` attribute can be optionally added for text fields where navigation is required.

## Troubleshooting checklist

When things go wrong, check these in order:

1. **Browser console** (F12 → Console tab): Look for red error messages.
2. **Network tab** (F12 → Network): Check for failed requests (401 = auth problem).
3. **Credentials**: Double-check every GUID and URL in `environment.ts`.
4. **Entra permissions**: Confirm your app has API permissions AND admin consent.
5. **Dragon server status**: Verify the server is reachable.

Additional logging can be configured during initialization:

```typescript
dragon.initialize({
  ...
  useConsoleLogger: true,
  ...
});
```
