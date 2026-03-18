"use client";

import { format } from "date-fns";
import { Expense, CATEGORIES, INCOME_CATEGORIES } from "@/lib/expenses";
import { Account, getAccountTypeInfo } from "@/lib/accounts";

interface Props {
  expenses: Expense[];
  accounts: Account[];
  onEdit?: (expense: Expense) => void;
}

export default function ExpenseList({ expenses, accounts, onEdit }: Props) {
  const allCategories = [...CATEGORIES, ...INCOME_CATEGORIES];
  const getCategoryInfo = (name: string) =>
    allCategories.find((c) => c.name === name) || CATEGORIES[CATEGORIES.length - 1];

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
        <p className="font-medium">No transactions yet</p>
        <p className="text-sm mt-1">Tap + to add your first transaction</p>
      </div>
    );
  }

  // Group expenses by date
  const grouped: Record<string, Expense[]> = {};
  for (const expense of expenses) {
    const key = format(expense.date, "yyyy-MM-dd");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(expense);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateKey, items]) => (
        <div key={dateKey}>
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">
            {format(new Date(dateKey), "EEEE, MMM d")}
          </p>
          <div className="space-y-2">
            {items.map((expense) => {
              const cat = getCategoryInfo(expense.category);
              return (
                <div
                  key={expense.id}
                  onClick={() => onEdit?.(expense)}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors ${onEdit ? "cursor-pointer active:scale-[0.98] active:bg-zinc-50 dark:active:bg-zinc-800" : ""}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: cat.color + "18" }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                      {expense.title}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {cat.name}
                      {(() => {
                        const acc = accounts.find((a) => a.id === expense.accountId);
                        if (!acc) return null;
                        const info = getAccountTypeInfo(acc.type);
                        return (
                          <span className="ml-1.5">
                            &middot; {info.icon} {acc.name}
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className={`font-semibold text-sm ${
                      expense.type === "income"
                        ? "text-green-600 dark:text-green-400"
                        : "text-zinc-900 dark:text-white"
                    }`}>
                      {expense.type === "income" ? "+" : "-"}{expense.amount.toFixed(2)}
                    </p>
                    {onEdit && (
                      <svg className="w-4 h-4 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
