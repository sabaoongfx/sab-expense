"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Expense, subscribeToExpenses } from "@/lib/expenses";
import { Account, subscribeToAccounts, ensureDefaultAccount, getAccountTypeInfo, deleteAccount } from "@/lib/accounts";
import { UserSettings, DEFAULT_SETTINGS, getSettings, updateSettings } from "@/lib/settings";
import Summary from "./Summary";
import ExpenseList from "./ExpenseList";
import AddExpenseModal from "./AddExpenseModal";
import AddIncomeModal from "./AddIncomeModal";
import AddAccountModal from "./AddAccountModal";
import EditExpenseModal from "./EditExpenseModal";
import DetailsTab from "./DetailsTab";

type Tab = "home" | "accounts" | "details" | "income" | "settings";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    ensureDefaultAccount(user.uid);
    getSettings(user.uid).then(setSettings);
    const unsubExpenses = subscribeToExpenses(user.uid, setExpenses);
    const unsubAccounts = subscribeToAccounts(user.uid, setAccounts);
    return () => {
      unsubExpenses();
      unsubAccounts();
    };
  }, [user]);

  const toggleSetting = async (key: keyof UserSettings) => {
    if (!user) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await updateSettings(user.uid, { [key]: newSettings[key] });
  };

  const incomeEntries = expenses.filter((e) => e.type === "income");
  const expenseEntries = expenses.filter((e) => e.type !== "income");
  const hasIncome = incomeEntries.length > 0;

  // If current tab was hidden via settings, go home
  useEffect(() => {
    if (tab === "income" && !settings.showIncome) setTab("home");
    if (tab === "details" && !settings.showDetails) setTab("home");
    if (tab === "accounts" && !settings.showAccounts) setTab("home");
  }, [settings, tab]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
              Sab Expense
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {user?.displayName?.split(" ")[0] || "User"}
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-28 space-y-6">
        {/* HOME */}
        {tab === "home" && (
          <>
            <Summary expenses={expenses} showIncome={settings.showIncome && hasIncome} />
            <ExpenseList expenses={expenseEntries} accounts={accounts} onEdit={setEditingExpense} />
          </>
        )}

        {/* INCOME */}
        {tab === "income" && (
          <>
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20">
              <p className="text-sm font-medium text-green-200">Total Income</p>
              <p className="text-3xl font-bold mt-1">
                ${incomeEntries.reduce((s, e) => s + e.amount, 0).toFixed(2)}
              </p>
              <p className="text-xs text-green-200 mt-1">
                {incomeEntries.length} transaction{incomeEntries.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ExpenseList expenses={incomeEntries} accounts={accounts} onEdit={setEditingExpense} />
          </>
        )}

        {/* DETAILS */}
        {tab === "details" && (
          <DetailsTab expenses={expenses} accounts={accounts} />
        )}

        {/* ACCOUNTS */}
        {tab === "accounts" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Accounts</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedAccountId(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  selectedAccountId === null
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                }`}
              >
                All
              </button>
              {accounts.map((acc) => {
                const info = getAccountTypeInfo(acc.type);
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                      selectedAccountId === acc.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                    }`}
                  >
                    <span>{info.icon}</span>
                    {acc.name}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-2">
              {accounts.map((acc) => {
                const info = getAccountTypeInfo(acc.type);
                const accExpenses = expenses.filter((e) => e.accountId === acc.id);
                const accTotal = accExpenses.reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div
                    key={acc.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: info.color + "18" }}
                    >
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-white text-sm">
                        {acc.name}
                        {acc.isDefault && (
                          <span className="ml-1.5 text-[10px] bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded-full">
                            default
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {info.label}
                        {acc.bankName && <span> &middot; {acc.bankName}</span>}
                        {acc.accountNumber && <span> &middot; ****{acc.accountNumber}</span>}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          ${accTotal.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {accExpenses.length} txn{accExpenses.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {!acc.isDefault && (
                        <button
                          onClick={() => deleteAccount(acc.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all text-lg leading-none"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Settings</h2>
            <div className="space-y-2">
              {[
                { key: "showIncome" as const, label: "Income", description: "Track income alongside expenses", icon: "💰" },
                { key: "showDetails" as const, label: "Details", description: "Calendar view with daily breakdown", icon: "📅" },
                { key: "showAccounts" as const, label: "Accounts", description: "Multiple account management", icon: "💳" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(item.key)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      settings[item.key]
                        ? "bg-violet-600"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings[item.key] ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FAB per screen */}
      {(tab === "home" || tab === "details") && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-6 sm:right-[calc(50%-14rem)] w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg shadow-violet-500/30 flex items-center justify-center text-2xl font-light transition-all hover:scale-105 active:scale-95 z-20"
        >
          +
        </button>
      )}
      {tab === "income" && (
        <button
          onClick={() => setShowAddIncome(true)}
          className="fixed bottom-20 right-6 sm:right-[calc(50%-14rem)] w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-violet-500/30 flex items-center justify-center text-2xl font-light transition-all hover:scale-105 active:scale-95 z-20"
        >
          +
        </button>
      )}
      {tab === "accounts" && (
        <button
          onClick={() => setShowAddAccount(true)}
          className="fixed bottom-20 right-6 sm:right-[calc(50%-14rem)] w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg shadow-violet-500/30 flex items-center justify-center text-2xl font-light transition-all hover:scale-105 active:scale-95 z-20"
        >
          +
        </button>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-lg mx-auto flex">
          {/* Home - always visible */}
          <button
            onClick={() => setTab("home")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
              tab === "home" ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {tab === "home" ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 11-1.06 1.06l-.97-.97V19.5a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5v-3a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v3a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5v-6.88l-.97.97a.75.75 0 01-1.06-1.06l8.69-8.69z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            )}
            <span className="text-[10px] font-semibold">Home</span>
          </button>

          {/* Accounts - togglable */}
          {settings.showAccounts && (
            <button
              onClick={() => setTab("accounts")}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                tab === "accounts" ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {tab === "accounts" ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                  <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              )}
              <span className="text-[10px] font-semibold">Accounts</span>
            </button>
          )}

          {/* Income - togglable */}
          {settings.showIncome && (
            <button
              onClick={() => setTab("income")}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                tab === "income" ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {tab === "income" ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.128 3.128 0 00-1.071.267c-.619.31-1.18.834-1.18 1.592 0 .758.561 1.282 1.18 1.592.275.137.576.242.896.31.436.092.837.166 1.175.249v3.024a4.012 4.012 0 01-1.921-.584.75.75 0 10-.814 1.26 5.51 5.51 0 002.735.748V18a.75.75 0 001.5 0v-.8a3.556 3.556 0 001.174-.29c.665-.333 1.256-.888 1.256-1.685 0-.797-.59-1.352-1.256-1.685a3.556 3.556 0 00-1.174-.29v-3.094a3.49 3.49 0 011.043.375.75.75 0 00.729-1.312 4.99 4.99 0 00-1.772-.594V6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                </svg>
              )}
              <span className="text-[10px] font-semibold">Income</span>
            </button>
          )}

          {/* Details - togglable */}
          {settings.showDetails && (
            <button
              onClick={() => setTab("details")}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                tab === "details" ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {tab === "details" ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              )}
              <span className="text-[10px] font-semibold">Details</span>
            </button>
          )}

          {/* Settings - always visible */}
          <button
            onClick={() => setTab("settings")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
              tab === "settings" ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {tab === "settings" ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span className="text-[10px] font-semibold">Settings</span>
          </button>
        </div>
      </nav>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} accounts={accounts} />
      <AddIncomeModal open={showAddIncome} onClose={() => setShowAddIncome(false)} accounts={accounts} />
      <AddAccountModal open={showAddAccount} onClose={() => setShowAddAccount(false)} />
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          accounts={accounts}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
