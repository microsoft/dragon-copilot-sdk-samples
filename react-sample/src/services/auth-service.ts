import {
  type AccountInfo,
  type AuthenticationResult,
  type PopupRequest,
  PublicClientApplication,
} from "@azure/msal-browser";
import type * as Dragon from "@microsoft/dragon-copilot-sdk-types";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "../environment";

const dragon = ((window as any).DragonCopilotSDK?.dragon ?? undefined) as unknown as typeof Dragon;

export class AuthService {
  private msalApp: PublicClientApplication;
  account: AccountInfo | null = null;
  isAuthenticated = false;
  hasWebKitBridgeAvailable = false;

  // Initialization state observables
  private initializationComplete$ = new BehaviorSubject<boolean>(false);
  public onInitializationComplete$: Observable<boolean> = this.initializationComplete$.asObservable();

  /** Creates the authentication service and initializes MSAL + cached account state. */
  constructor() {
    this.msalApp = new PublicClientApplication({
      auth: {
        clientId: environment.msalConfig.auth.clientId,
        authority: environment.msalConfig.auth.authority,
        redirectUri: environment.msalConfig.auth.redirectUri,
      },
      cache: {
        cacheLocation: environment.msalConfig.cache.cacheLocation,
        storeAuthStateInCookie: environment.msalConfig.cache.storeAuthStateInCookie,
      },
    });
    this.initialize();
  }

  /** Performs MSAL initialization and restores existing account if present. */
  private async initialize() {
    /* 
        - If Webkit bridge is available, consider that the user is authenticated assuming native will handle authentication and will provide tokens
        - Publish initialization complete event
     */
    this.hasWebKitBridgeAvailable = await this.isWebKitBridgeAvailable();
    if (this.hasWebKitBridgeAvailable) {
      this.isAuthenticated = true;
      this.initializationComplete$.next(true);
      return;
    }

    await this.msalApp.initialize();
    await this.msalApp.handleRedirectPromise();
    const accounts = this.msalApp.getAllAccounts();
    if (accounts.length > 0) {
      this.account = accounts[0];
      this.isAuthenticated = true;
    }
    // Notify subscribers that initialization is complete
    this.initializationComplete$.next(true);
  }

  /** Interactive popup signin; updates reactive auth signals on success. */
  async signinPopup() {
    try {
      const popupRequest: PopupRequest = { scopes: environment.msalConfig.scopes };
      const authResult: AuthenticationResult = await this.msalApp.loginPopup(popupRequest);
      this.account = authResult.account;
      this.isAuthenticated = true;
    } catch (error) {
      console.error("Signin failed:", error);
      throw error;
    }
  }

  /** Signs out the current account with a popup flow and clears auth signals. */
  async signout() {
    try {
      await this.msalApp.logoutPopup({ account: this.account });
      await dragon.destroy();
      this.account = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error("Signout failed:", error);
      throw error;
    }
  }

  /** Acquires an access token for the given scope using silent token acquisition. */
  async acquireAccessToken(scope: string): Promise<dragon.AccessToken> {
    // If Webkit bridge is available, acquire token from Webkit bridge
    if (this.hasWebKitBridgeAvailable) {
      const nativeToken = await this.getAccessTokenFromWebKitBridge(scope);
      return { accessToken: nativeToken };
    }

    const activeAccount = this.account;
    if (!activeAccount) throw new Error("No authenticated account found");
    const response = await this.msalApp.acquireTokenSilent({
      scopes: [scope],
      account: activeAccount,
      forceRefresh: false,
    });
    return { accessToken: response.accessToken };
  }

  /**
   * Checks if the WebKit bridge is available in the WebKit environment.
   *
   * This method attempts to communicate with the native iOS bridge through WebKit's
   * message handlers to determine if the bridge interface is properly initialized
   * and available for use.
   *
   * @returns A promise that resolves to `true` if the Webkit bridge is available,
   * `false` otherwise.
   * @remarks
   * This method relies on the WebKit bridge being available in the window object.
   * It expects a `isWebKitBridgeAvailable` message handler to be registered on the native side using `WKScriptMessageHandlerWithReply`.
   *
   * @private
   */
  private async isWebKitBridgeAvailable(): Promise<boolean> {
    const webkitMessageHandlers = (window as any).webkit?.messageHandlers;
    if (!webkitMessageHandlers?.isWebKitBridgeAvailable) {
      console.log("Webkit bridge is not available");
      return false;
    }

    const isWebKitBridgeAvailable = await webkitMessageHandlers.isWebKitBridgeAvailable.postMessage(null);
    console.log("Webkit bridge isWebKitBridgeAvailable = ", isWebKitBridgeAvailable);
    return isWebKitBridgeAvailable;
  }

  /**
   * Retrieves an access token from the Webkit bridge using WebKit message handlers.
   *
   * This method communicates with the native iOS layer through the WebKit bridge to obtain
   * an authentication token. The token acquisition is logged for debugging purposes.
   *
   * @param scope - Optional scope parameter to specify the token's access scope
   * @returns A promise that resolves to the access token string retrieved from the Webkit bridge
   *
   * @remarks
   * This method relies on the WebKit bridge being available in the window object.
   * It expects a `getNativeToken` message handler to be registered on the native side using `WKScriptMessageHandlerWithReply`.
   *
   * @private
   */
  private async getAccessTokenFromWebKitBridge(scope?: string): Promise<string> {
    console.log("Acquiring token from WebKitBridge for scope:", scope);
    const token = await (window as any).webkit.messageHandlers.getNativeToken.postMessage(scope);
    return token;
  }
}
