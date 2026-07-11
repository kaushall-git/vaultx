/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useVaultStore } from "../../../store.js";
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, KeyRound } from "lucide-react";

export default function SecurityAudit() {
  const decryptedItems = useVaultStore((state) => state.decryptedItems);
  const setSelectedItemId = useVaultStore((state) => state.setSelectedItemId);
  const setCurrentCategory = useVaultStore((state) => state.setCurrentCategory);

  // Filter logins
  const logins = decryptedItems.filter((item) => item.category === "login");

  const weakLogins: typeof logins = [];
  const reusedGroups: { [password: string]: typeof logins } = {};
  let totalScoreCount = 0;

  logins.forEach((item) => {
    const details: any = item.details;
    const password = details.password || "";

    if (!password) return;
    totalScoreCount++;

    // 1. Weak password criteria
    const isWeak =
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (isWeak) {
      weakLogins.push(item);
    }

    // 2. Reused password groupings
    if (password) {
      if (!reusedGroups[password]) {
        reusedGroups[password] = [];
      }
      reusedGroups[password].push(item);
    }
  });

  // Extract actual reused items
  const reusedLogins: typeof logins = [];
  Object.keys(reusedGroups).forEach((pw) => {
    if (reusedGroups[pw].length > 1) {
      reusedLogins.push(...reusedGroups[pw]);
    }
  });

  // Unique reused logins list
  const uniqueReusedLogins = Array.from(new Set(reusedLogins));

  // Calculate Security Score (0 to 100)
  // Deduct points for weak and reused passwords
  let securityScore = 100;
  if (totalScoreCount > 0) {
    const weakCount = weakLogins.length;
    const reusedCount = uniqueReusedLogins.length;

    // Weight: Weak counts as -40% potential, Reused counts as -30% potential
    const weakDeduction = (weakCount / totalScoreCount) * 50;
    const reusedDeduction = (reusedCount / totalScoreCount) * 40;
    securityScore = Math.max(0, Math.round(100 - weakDeduction - reusedDeduction));
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 55) return "text-yellow-500 border-yellow-500/20 bg-yellow-500/5";
    return "text-red-500 border-red-500/20 bg-red-500/5";
  };

  const handleFixItem = (itemId: string) => {
    setCurrentCategory("login");
    setSelectedItemId(itemId);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Summary Banner */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${getScoreColor(securityScore)}`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            {securityScore >= 80 ? (
              <ShieldCheck className="w-8 h-8 shrink-0" />
            ) : (
              <ShieldAlert className="w-8 h-8 shrink-0" />
            )}
            <h2 className="text-xl font-bold tracking-tight text-white">Vault Security Auditor</h2>
          </div>
          <p className="text-sm text-zinc-400 max-w-lg">
            All cryptographic scans are computed locally inside your browser context. VaultX never analyzes your cleartext password strings server-side.
          </p>
        </div>

        {/* Big Score Visualizer */}
        <div className="flex items-center gap-4 shrink-0 bg-black/40 px-5 py-4 rounded-xl border border-white/5">
          <div className="text-center">
            <span className="block text-3xl font-mono font-bold text-white">{securityScore}%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Health Index</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <span className="block text-xs text-zinc-400 mb-1">Total Passwords</span>
          <span className="text-2xl font-mono font-bold text-zinc-100">{totalScoreCount}</span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 flex justify-between items-start">
          <div>
            <span className="block text-xs text-zinc-400 mb-1">Weak Passwords</span>
            <span className="text-2xl font-mono font-bold text-red-400">{weakLogins.length}</span>
          </div>
          {weakLogins.length > 0 && <AlertTriangle className="w-4 h-4 text-red-400 mt-1" />}
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 flex justify-between items-start">
          <div>
            <span className="block text-xs text-zinc-400 mb-1">Reused Passwords</span>
            <span className="text-2xl font-mono font-bold text-yellow-400">{uniqueReusedLogins.length}</span>
          </div>
          {uniqueReusedLogins.length > 0 && <RefreshCw className="w-4 h-4 text-yellow-400 mt-1 animate-spin-slow" />}
        </div>
      </div>

      {/* Warnings & Suggestions List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Action Required</h3>

        {logins.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-zinc-800 bg-zinc-950/20 text-zinc-500">
            <KeyRound className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
            No credentials found to audit. Add your login details to see security reports.
          </div>
        ) : weakLogins.length === 0 && uniqueReusedLogins.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-400">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
            <h4 className="font-semibold text-white">Perfect Score!</h4>
            <p className="text-xs text-zinc-400 mt-1">All verified credentials use distinct, highly cryptographically resilient passwords.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Weak Password List */}
            {weakLogins.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-red-500/10 bg-red-500/5 hover:border-red-500/20 transition-all">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
                  <div className="flex gap-2 items-center text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Weak: Password is too short or simple</span>
                  </div>
                  {(item.details as any).username && (
                    <span className="block text-[11px] font-mono text-zinc-500">User: {(item.details as any).username}</span>
                  )}
                </div>
                <button
                  onClick={() => handleFixItem(item.id)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-indigo-400 transition-colors shrink-0"
                >
                  Configure
                </button>
              </div>
            ))}

            {/* Reused Passwords */}
            {uniqueReusedLogins.map((item) => {
              // Only print warning if it wasn't already printed as a weak item
              const isAlsoWeak = weakLogins.some((wl) => wl.id === item.id);
              if (isAlsoWeak) return null;

              return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 hover:border-yellow-500/20 transition-all">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
                    <div className="flex gap-2 items-center text-xs text-yellow-400">
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>Reused: Identical password string used on other sites</span>
                    </div>
                    {(item.details as any).username && (
                      <span className="block text-[11px] font-mono text-zinc-500">User: {(item.details as any).username}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleFixItem(item.id)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-indigo-400 transition-colors shrink-0"
                  >
                    Configure
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
