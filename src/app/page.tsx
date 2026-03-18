"use client";

import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/components/Dashboard";
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div role="status" aria-label="Loading" className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginScreen />;
}
