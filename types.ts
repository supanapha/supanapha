
export type MedicationPeriod = 'morning' | 'midday' | 'evening' | 'bedtime';

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  pillsPerTime: number;
  instruction?: string;
  image?: string;
  periods: MedicationPeriod[];
  reminders: string[]; // Specific times (e.g., "08:00")
  repeatDays: number[]; // 0 for Sunday, 1 for Monday, etc.
  syncRelative: boolean;
  syncDoctor: boolean;
  relativeContact?: string;
}

export interface DailyLog {
  date: string; // ISO Date YYYY-MM-DD
  taken: string[]; // List of med IDs taken
}

export enum View {
  HOME = 'HOME',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  ADD_MED = 'ADD_MED',
  CONTACT = 'CONTACT'
}
