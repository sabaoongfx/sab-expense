"use client";

import { Expense } from "@/lib/expenses";

interface Props {
  expenses: Expense[];
  showIncome?: boolean;
}

export default function Summary({ expenses, showIncome }: Props) {
  const totalExpense = expenses
    .filter((e) => e.type !== "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = expenses.filter((e) => e.type !== "income").length;

  return (
    <div className="summary-card bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 text-white shadow-lg shadow-zinc-900/40">
      {/* Animated background elements */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="ring-pulse" />
      <div className="ring-pulse-2" />

      {/* Content */}
      <div className="relative z-[1]">
        {showIncome ? (
          <>
            <p className="text-sm font-medium text-zinc-400">Balance</p>
            <p className="text-3xl font-bold mt-1">{(totalIncome - totalExpense).toFixed(2)}</p>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Income</p>
                <p className="text-sm font-semibold text-emerald-400">{totalIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Expenses</p>
                <p className="text-sm font-semibold text-rose-400">{totalExpense.toFixed(2)}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-400">Total Expenses</p>
            <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">{totalExpense.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {expenseCount} transaction{expenseCount !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
