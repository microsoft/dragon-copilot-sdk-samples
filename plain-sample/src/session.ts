import type { AmbientSessionData } from "./dragon";
import { environment } from "./environment";

export const session = {
  ambientData: {
    correlationId: crypto.randomUUID(),
    clientApplicationStableId: "dragonCopilotSdkForJavaScriptSample",
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
  } as AmbientSessionData,
  fields: [
    "Patient Name",
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
