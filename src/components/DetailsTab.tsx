"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { Expense, getCategoryInfo } from "@/lib/expenses";
import { Account, getAccountTypeInfo } from "@/lib/accounts";

interface Props {
  expenses: Expense[];
  accounts: Account[];
  onEdit?: (expense: Expense) => void;
}

export default function DetailsTab({ expenses, accounts, onEdit }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  // Map of date -> total spend for the month
  const dailyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      if (isSameMonth(e.date, currentMonth)) {
        const key = format(e.date, "yyyy-MM-dd");
        map[key] = (map[key] || 0) + e.amount;
      }
    }
    return map;
  }, [expenses, currentMonth]);

  const monthTotal = useMemo(() => {
    return expenses
      .filter((e) => isSameMonth(e.date, currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonth]);

  const selectedExpenses = useMemo(() => {
    if (!selectedDate) return [];
    return expenses.filter((e) => isSameDay(e.date, selectedDate));
  }, [expenses, selectedDate]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => isSameMonth(e.date, currentMonth));
  }, [expenses, currentMonth]);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            {format(currentMonth, "MMMM yyyy")}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {monthTotal.toFixed(2)} spent
          </p>
        </div>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const total = dailyTotals[key] || 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasExpenses = total > 0;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`relative flex flex-col items-center py-1.5 rounded-lg transition-all text-xs ${
                  isSelected
                    ? "bg-violet-600 text-white"
                    : isToday
                    ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="font-medium">{format(day, "d")}</span>
                {hasExpenses && (
                  <span
                    className={`text-[8px] font-semibold mt-0.5 ${
                      isSelected ? "text-violet-200" : "text-violet-500 dark:text-violet-400"
                    }`}
                  >
                    {total < 1000 ? total.toFixed(0) : (total / 1000).toFixed(1) + "k"}
                  </span>
                )}
                {!hasExpenses && <span className="text-[8px] mt-0.5 invisible">0</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date expenses */}
      {selectedDate && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
            {format(selectedDate, "EEEE, MMM d")}
            {selectedExpenses.length > 0 && (
              <span className="ml-2 normal-case">
                — {selectedExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}
              </span>
            )}
          </p>
          {selectedExpenses.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6">
              No expenses on this day
            </p>
          ) : (
            selectedExpenses.map((expense) => {
              const cat = getCategoryInfo(expense.category);
              const acc = accounts.find((a) => a.id === expense.accountId);
              const accInfo = acc ? getAccountTypeInfo(acc.type) : null;
              return (
                <div
                  key={expense.id}
                  tabIndex={onEdit ? 0 : undefined}
                  role={onEdit ? "button" : undefined}
                  onClick={() => onEdit?.(expense)}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors ${onEdit ? "cursor-pointer active:scale-[0.98] active:bg-zinc-50 dark:active:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none" : ""}`}
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
                      {acc && accInfo && (
                        <span className="ml-1.5">
                          &middot; {accInfo.icon} {acc.name}
                        </span>
                      )}
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
            })
          )}
        </div>
      )}

      {/* Month expense list (when no date selected) */}
      {!selectedDate && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
            All in {format(currentMonth, "MMMM")}
          </p>
          {monthExpenses.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6">
              No expenses this month
            </p>
          ) : (
            monthExpenses.map((expense) => {
                const cat = getCategoryInfo(expense.category);
                const acc = accounts.find((a) => a.id === expense.accountId);
                const accInfo = acc ? getAccountTypeInfo(acc.type) : null;
                return (
                  <div
                    key={expense.id}
                    tabIndex={onEdit ? 0 : undefined}
                    role={onEdit ? "button" : undefined}
                    onClick={() => onEdit?.(expense)}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors ${onEdit ? "cursor-pointer active:scale-[0.98] active:bg-zinc-50 dark:active:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none" : ""}`}
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
                        {cat.name} &middot; {format(expense.date, "MMM d")}
                        {acc && accInfo && (
                          <span className="ml-1.5">
                            &middot; {accInfo.icon} {acc.name}
                          </span>
                        )}
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
              })
          )}
        </div>
      )}
    </div>
  );
}
