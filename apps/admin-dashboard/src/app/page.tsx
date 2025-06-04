"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔒</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Protected Dashboard
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Content />
      </main>
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  
  return (
    <button
      className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-medium transition-all duration-200"
      onClick={() =>
        void signOut().then(() => {
          router.push("/signin");
        })
      }
    >
      Sign Out
    </button>
  );
}

function Content() {
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};
  const addNumber = useMutation(api.myFunctions.addNumber);
  const [isAdding, setIsAdding] = useState(false);

  if (viewer === undefined || numbers === undefined) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  const handleAddNumber = async () => {
    setIsAdding(true);
    await addNumber({ value: Math.floor(Math.random() * 100) });
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Welcome, {viewer}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          This is a protected route with real-time data
        </p>
      </div>

      {/* Numbers Display */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Real-time Numbers
          </h2>
          <div className="text-3xl font-bold text-blue-600 mb-4">
            Total: {numbers?.length || 0}
          </div>
          
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            onClick={handleAddNumber}
            disabled={isAdding}
          >
            {isAdding ? (
              <span className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </span>
            ) : (
              "Add Random Number"
            )}
          </button>
        </div>

        {/* Numbers Grid */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Numbers Collection:
          </h3>
          
          {numbers?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 italic">No numbers yet. Add some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {numbers?.map((num, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-200 rounded-lg p-3 text-center font-bold text-lg hover:scale-105 transition-transform"
                >
                  {num}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <p>
          <span className="font-semibold">Stack:</span> Next.js • Convex • TypeScript • Tailwind CSS
        </p>
      </div>
    </div>
  );
}