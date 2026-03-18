import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type AccountType = "mix" | "bank" | "cash";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
}

export const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string; color: string }[] = [
  { type: "mix", label: "Mix", icon: "💳", color: "#8b5cf6" },
  { type: "bank", label: "Bank", icon: "🏦", color: "#3b82f6" },
  { type: "cash", label: "Cash", icon: "💵", color: "#22c55e" },
];

export function getAccountTypeInfo(type: AccountType) {
  return ACCOUNT_TYPES.find((t) => t.type === type) || ACCOUNT_TYPES[0];
}

export async function ensureDefaultAccount(userId: string): Promise<void> {
  const defaultDocRef = doc(db, "accounts", `default_${userId}`);
  const q = query(
    collection(db, "accounts"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // No accounts at all — create the default
    await setDoc(defaultDocRef, {
      name: "Main Account",
      type: "mix",
      isDefault: true,
      userId,
      createdAt: Timestamp.now(),
    });
  } else {
    // Clean up duplicate default accounts (keep only one)
    const defaults = snapshot.docs.filter((d) => d.data().isDefault === true);
    if (defaults.length > 1) {
      // Keep the deterministic one if it exists, otherwise keep the first
      const keep = defaults.find((d) => d.id === `default_${userId}`)?.id || defaults[0].id;
      for (const d of defaults) {
        if (d.id !== keep) {
          await deleteDoc(doc(db, "accounts", d.id));
        }
      }
    }
  }
}

export async function addAccount(
  userId: string,
  data: { name: string; type: AccountType; bankName?: string; accountNumber?: string }
) {
  await addDoc(collection(db, "accounts"), {
    ...data,
    isDefault: false,
    userId,
    createdAt: Timestamp.now(),
  });
}

export async function deleteAccount(id: string) {
  await deleteDoc(doc(db, "accounts", id));
}

export function subscribeToAccounts(
  userId: string,
  callback: (accounts: Account[]) => void
) {
  const q = query(
    collection(db, "accounts"),
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const accounts: Account[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Account[];
    callback(accounts);
  });
}
