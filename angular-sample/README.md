# Dragon Copilot SDK for JavaScript - Angular sample

A working example showing how to integrate Dragon Copilot SDK for JavaScript into an Angular web application.

## Prerequisites

### Software requirements

- Node.js 20.19 or later (check with `node --version`)
- npm

### Access credentials

- Dragon Medical Server URL, Partner GUID, and Environment ID
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

Wait for "Application bundle generation complete" then open <http://localhost:4200> in your browser.

### 3. Configure your credentials

Open the developer console in your browser, go to the Console tab, and paste in the following code snippet, replacing the placeholder values with your actual configuration details and then refresh the page:

```javascript
localStorage.setItem(
  'angular-sample-env',
  JSON.stringify({
    dragonConfig: {
      applicationName: 'angular-sample',
      partnerGuid: 'YOUR_PARTNER_GUID',
      environmentId: 'YOUR_ENVIRONMENT_ID',
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
    },
  }),
);
```

> **Note:** In a production app, do not store sensitive configuration data in local storage. This is only for demonstration purposes.

## Step-by-step: Get speech recognition working

### Step 1: Sign in

Select **Sign in with Microsoft**. A popup opens asking for your credentials.

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

Select **Start ambient recording** to start ambient recording. Ambient audio is captured automatically and sent to the Dragon Copilot server.

> **Note:** The UI only shows messages relating to the upload of ambient audio. Displaying the ambient results is outside the scope of this sample app.

Select **Add control** to create more text fields dynamically.

## Understand the code

### Authentication flow (`auth.service.ts`)

The app uses Microsoft Authentication Library (MSAL) to:

1. Get your identity from Entra ID.
2. Acquire access tokens for the Dragon Copilot server.
3. Refresh tokens automatically when they expire.

### Speech integration (`app.ts`)

Dragon Speech SDK is initialized here. The implementation listens for authentication state changes and initializes accordingly.

Event handlers should be attached before initialization.

If ambient mode is enabled the session data should be set with `dragon.recording.ambient.setSessionData(...)`.

### Dynamic Controls

The **Add control**/**Remove control** buttons dynamically add and remove speech fields:

- Each text field is a `FormControl` in a `FormArray`.
- Angular automatically updates the DOM when you add/remove controls.
- Each control requires a unique `data-dragon-container` attribute so the SDK can target it.
- A `data-dragon-concept-name` attribute can be optionally added for text fields where navigation is required.

**Why this matters:** If you're integrating the Dragon Copilot SDK in your own app, you need to make sure every input field the SDK should speech enable has this attribute.

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
