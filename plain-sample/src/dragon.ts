import type * as Dragon from '@microsoft/dragon-copilot-sdk-types';

// Runtime binding to the CDN global, fully typed via the public types package
export const dragon = (globalThis as any).DragonCopilotSDK?.dragon as typeof Dragon;

// Re-export the types so other files can import from this module
export type { Dragon };
export type RecordingMode = Dragon.recording.RecordingMode;
export type AmbientSessionData = Dragon.recording.ambient.AmbientSessionData;
export type AccessToken = Dragon.authentication.AccessToken;
