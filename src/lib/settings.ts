import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface UserSettings {
  showIncome: boolean;
  showDetails: boolean;
  showAccounts: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  showIncome: false,
  showDetails: true,
  showAccounts: true,
};

export async function getSettings(userId: string): Promise<UserSettings> {
  const ref = doc(db, "settings", userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_SETTINGS, ...snap.data() } as UserSettings;
  }
  return DEFAULT_SETTINGS;
}

export async function updateSettings(userId: string, settings: Partial<UserSettings>) {
  const ref = doc(db, "settings", userId);
  await setDoc(ref, settings, { merge: true });
}
