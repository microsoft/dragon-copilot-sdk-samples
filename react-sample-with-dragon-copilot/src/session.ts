import type * as Dragon from "@microsoft/dragon-copilot-sdk-types";
import { environment } from "./environment";

/** random correlation ID generator */
function createCorrelationId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `corr-${Math.random().toString(36).slice(2)}-${Date.now()}`
  );
}

/** Creates a new sample ambient session data object with default values. */
export function newSessionData(): Dragon.recording.ambient.AmbientSessionData {
  return {
    correlationId: createCorrelationId(),
    clientApplicationStableId: "dragonCopilotSdkForJavascriptSample",
    clientApplicationVersion: "1.0.0",
    localeInfo: {
      recordingLocales: [environment.dragonConfig.speechLanguage],
      encounterReportLocale: "en-US",
      encounterUxLocale: "en-US",
    },
    ehrData: {
      patientId: "PT-123456",
      appointmentId: "APT-789012",
      mrn: "MRN-345678",
      siteId: "SITE-001",
      reasonForVisit: "Annual checkup",
      physicianName: "Dr. Jane Smith",
      physicianId: "PHY-111222",
      patient: {
        id: "PT-123456",
        firstName: "John",
        middleName: "Michael",
        lastName: "Doe",
        gender: 0,
        dateOfBirth: "1980-06-17T04:00:00Z",
        pronounPreference: {
          system: "loinc.org",
          identifier: "LA29519-8",
          description: "he/him/his/his/himself",
        },
        dataOrigin: 0,
      },
      version: 1,
      dataOrigin: 0,
    },
    draftAutoCreated: false,
    recordingList: [],
    partnerId: environment.dragonConfig.partnerGuid,
  } as Dragon.recording.ambient.AmbientSessionData;
}

export const session = {
  ambientData: newSessionData(),
  fields: [
    "History",
    "Allergies",
    "Medications",
    "Immunizations",
    "Results",
    "Procedure",
    "Review of Systems",
    "Physical Exam",
    "Assessment and Plan",
    "History of Present Illness",
    "Social History",
    "Family History",
  ],
};
