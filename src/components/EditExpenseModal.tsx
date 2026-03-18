"use client";

import { useState } from "react";
import { Expense, CATEGORIES, INCOME_CATEGORIES, updateExpense, deleteExpense } from "@/lib/expenses";
import { Account, getAccountTypeInfo } from "@/lib/accounts";

interface Props {
  expense: Expense;
  accounts: Account[];
  onClose: () => void;
}

export default function EditExpenseModal({ expense, accounts, onClose }: Props) {
  const isIncome = expense.type === "income";
  const categories = isIncome ? INCOME_CATEGORIES : CATEGORIES;
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [accountId, setAccountId] = useState(expense.accountId);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    setLoading(true);
    try {
      await updateExpense(expense.id, {
        title,
        amount: parseFloat(amount),
        category,
        accountId,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      await deleteExpense(expense.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const activeClass = isIncome
    ? "border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 ring-1 ring-green-500"
    : "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500";

  const ringClass = isIncome ? "focus:ring-green-500" : "focus:ring-violet-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-semibold ${isIncome ? "text-green-600 dark:text-green-400" : "text-zinc-900 dark:text-white"}`}>
            Edit {isIncome ? "Income" : "Expense"}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 ${ringClass} transition-all`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 ${ringClass} transition-all`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Account
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {accounts.map((acc) => {
                const info = getAccountTypeInfo(acc.type);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                      accountId === acc.id
                        ? activeClass
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span>{info.icon}</span>
                    {acc.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                    category === cat.name
                      ? activeClass
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className={`py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm ${
                confirmDelete
                  ? "bg-red-600 hover:bg-red-700 text-white px-6"
                  : "bg-zinc-100 dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-4"
              }`}
            >
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 ${
                isIncome
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
