import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type TransactionType = "expense" | "income";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  accountId: string;
  date: Date;
  userId: string;
  createdAt: Date;
}

export const CATEGORIES = [
  { name: "Food", color: "#f97316", icon: "🍔" },
  { name: "Transport", color: "#3b82f6", icon: "🚗" },
  { name: "Shopping", color: "#a855f7", icon: "🛍️" },
  { name: "Bills", color: "#ef4444", icon: "📄" },
  { name: "Health", color: "#22c55e", icon: "💊" },
  { name: "Other", color: "#6b7280", icon: "📦" },
];

export const INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e", icon: "💰" },
  { name: "Freelance", color: "#06b6d4", icon: "💻" },
  { name: "Gift", color: "#f59e0b", icon: "🎁" },
  { name: "Other", color: "#6b7280", icon: "📦" },
];

export async function addExpense(
  userId: string,
  data: { title: string; amount: number; type: TransactionType; category: string; accountId: string; date: Date }
) {
  await addDoc(collection(db, "expenses"), {
    ...data,
    userId,
    date: Timestamp.fromDate(data.date),
    createdAt: Timestamp.now(),
  });
}

export async function updateExpense(
  id: string,
  data: { title: string; amount: number; category: string; accountId: string }
) {
  await updateDoc(doc(db, "expenses", id), data);
}

export async function deleteExpense(id: string) {
  await deleteDoc(doc(db, "expenses", id));
}

export function subscribeToExpenses(
  userId: string,
  callback: (expenses: Expense[]) => void
) {
  const q = query(
    collection(db, "expenses"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const expenses: Expense[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      type: "expense", // default for old entries without type
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Expense[];
    callback(expenses);
  });
}
