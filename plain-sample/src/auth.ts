import * as dragon from "dragon-speech-sdk";

export type AuthAccountInfo = {
  username: string;
  name: string;
  initials: string;
};

export interface Auth {
  onAuthenticationStatusChanged: ((isAuthenticated: boolean) => void) | null;

  /** Indicates whether there is an authenticated user. */
  readonly isAuthenticated: boolean;

  readonly accountInfo: AuthAccountInfo;

  /** Interactive popup sign in; updates reactive auth signals on success. */
  signIn(): Promise<void>;

  /** Signs out the current account with a popup flow and clears auth signals. */
  signOut(): Promise<void>;

  /** Acquires an access token for the given scope using silent token acquisition. */
  acquireAccessToken(scope: string): Promise<dragon.authentication.AccessToken>;
}
