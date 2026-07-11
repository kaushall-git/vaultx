/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useVaultStore } from "../../../store.js";
import { ShieldCheck, Eye, EyeOff, Loader2, LogOut } from "lucide-react";

export default function LockScreen() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const user = useVaultStore((state) => state.user);
  const unlock = useVaultStore((state) => state.unlock);
  const logout = useVaultStore((state) => state.logout);
  const isAuthenticating = useVaultStore((state) => state.isAuthenticating);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);

    if (!password) {
      setUnlockError("Master password is required");
      return;
    }

    const success = await unlock(password);
    if (!success) {
      setUnlockError("Incorrect master password. Verification failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0C] px-4 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-2xl border border-zinc-800/80 p-8 glow-indigo relative">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Vault Suspended</h2>
          <p className="text-xs text-zinc-400">
            Session locked to protect cryptographic keys in memory. Re-enter master password for <span className="text-zinc-200 font-medium">{user?.email}</span> to continue decrypting.
          </p>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Master Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2.5 pl-3 pr-10 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                disabled={isAuthenticating}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {unlockError && (
            <p className="text-xs text-red-400 font-medium bg-red-500/5 border border-red-500/10 py-2 px-3 rounded-lg">
              {unlockError}
            </p>
          )}

          <div className="flex flex-col gap-3.5 pt-2">
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Stretching Key...
                </>
              ) : (
                "Unlock Vault"
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              Logout / Disconnect Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
