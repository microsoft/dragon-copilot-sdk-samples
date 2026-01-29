import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type PopupRequest,
} from "@azure/msal-browser";
import type { Auth, AuthAccountInfo } from "./auth";
import { dragon, type EhrAuthenticationClient } from "./dragon";
import { environment } from "./environment";

export class AuthEhrViaEntra implements Auth {
  #msalApp: PublicClientApplication;

  #ehrClient: EhrAuthenticationClient;

  #account: AccountInfo | null = null;

  #isAuthenticated = false;

  onAuthenticationStatusChanged: ((isAuthenticated: boolean) => void) | null = null;

  private constructor() {
    this.#msalApp = new PublicClientApplication({
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

    this.#ehrClient = new dragon.authentication.ehr.EhrAuthenticationClient({
      customerId: environment.ehrConfig.customerId,
    });
  }

  static async create(): Promise<Auth> {
    const instance = new AuthEhrViaEntra();
    await instance.#initialize();
    return instance;
  }

  /** Indicates whether there is an authenticated user. */
  get isAuthenticated(): boolean {
    return this.#isAuthenticated;
  }

  get accountInfo(): AuthAccountInfo {
    return {
      username: this.#account?.username || "",
      name: this.#account?.name || "",
      initials: this.#initials,
    };
  }

  get #initials(): string {
    const username = this.#account?.username || null;
    if (!username) {
      return "";
    }

    const parts = username.split(/[@.\s_-]+/);

    if (parts.length >= 2 && parts[1] && parts[0]) {
      return (parts[1][0] + parts[0][0]).toUpperCase();
    }

    return username.substring(0, 2).toUpperCase();
  }

  /** Interactive popup sign in; updates reactive auth signals on success. */
  async signIn() {
    try {
      const popupRequest: PopupRequest = { scopes: environment.msalConfig.scopes };
      const authResult: AuthenticationResult = await this.#msalApp.loginPopup(popupRequest);
      this.#account = authResult.account;
      this.#setAuthenticated(true);
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  }

  /** Signs out the current account with a popup flow and clears auth signals. */
  async signOut() {
    try {
      await this.#msalApp.logoutPopup({ account: this.#account });
      this.#account = null;
      this.#setAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  /** Acquires an access token for the given scope using silent token acquisition. */
  async acquireAccessToken(scope: string): Promise<dragon.authentication.AccessToken> {
    const activeAccount = this.#account;
    if (!activeAccount) {
      throw new Error("No authenticated account found");
    }
    const response = await this.#msalApp.acquireTokenSilent({
      scopes: [scope],
      account: activeAccount,
      forceRefresh: false,
    });

    // Exchange the Entra ID token via the EHR Authentication Client.
    return this.#ehrClient.acquireToken({
      accessToken: response.accessToken,
    });
  }

  /** Performs MSAL initialization and restores existing account if present. */
  async #initialize() {
    await this.#msalApp.initialize();
    await this.#msalApp.handleRedirectPromise();
    const accounts = this.#msalApp.getAllAccounts();
    if (accounts.length > 0) {
      this.#account = accounts[0];
      this.#setAuthenticated(true);
    }
  }

  #setAuthenticated(value: boolean) {
    if (this.#isAuthenticated !== value) {
      this.#isAuthenticated = value;
      this.onAuthenticationStatusChanged?.(value);
    }
  }
}
