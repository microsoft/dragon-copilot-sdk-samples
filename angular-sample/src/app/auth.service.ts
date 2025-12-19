import { Injectable } from '@angular/core';
import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
  PopupRequest,
} from '@azure/msal-browser';
import { environment } from '../app/environment';
import type { AccessToken } from './dragon';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private msalApp: PublicClientApplication;
  account: AccountInfo | null = null;
  isAuthenticated = false;

  // Initialization state observables
  private initializationComplete$ = new BehaviorSubject<boolean>(false);
  public onInitializationComplete$: Observable<boolean> =
    this.initializationComplete$.asObservable();

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

  /** Interactive popup sign-in; updates reactive auth signals on success. */
  async signinPopup() {
    try {
      const popupRequest: PopupRequest = { scopes: environment.msalConfig.scopes };
      const authResult: AuthenticationResult = await this.msalApp.loginPopup(popupRequest);
      this.account = authResult.account;
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Signin failed:', error);
      throw error;
    }
  }

  /** Signs out the current account with a popup flow and clears auth signals. */
  async signOut() {
    try {
      await this.msalApp.logoutPopup({ account: this.account });
      this.account = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Signout failed:', error);
      throw error;
    }
  }

  /** Acquires an access token for the given scope using silent token acquisition. */
  async acquireAccessToken(scope: string): Promise<AccessToken> {
    const activeAccount = this.account;
    if (!activeAccount) throw new Error('No authenticated account found');
    const response = await this.msalApp.acquireTokenSilent({
      scopes: [scope],
      account: activeAccount,
      forceRefresh: false,
    });
    return { accessToken: response.accessToken };
  }
}
