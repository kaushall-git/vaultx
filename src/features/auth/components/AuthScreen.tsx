/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useVaultStore } from "../../../store.js";
import { ShieldAlert, KeyRound, Mail, Lock, Loader2, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Derivation steps for visuals
  const [currentCryptoStep, setCurrentCryptoStep] = useState<number | null>(null);

  const login = useVaultStore((state) => state.login);
  const signup = useVaultStore((state) => state.signup);
  const isAuthenticating = useVaultStore((state) => state.isAuthenticating);
  const globalError = useVaultStore((state) => state.error);
  const clearError = useVaultStore((state) => state.clearError);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email) {
      setLocalError("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setLocalError("Master password is required");
      return;
    }

    if (password.length < 10) {
      setLocalError("Master password must be at least 10 characters long");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    // Trigger visual steps to educate recruiter/user on zero-knowledge crypto
    try {
      setCurrentCryptoStep(1); // stretching
      await delay(700);
      setCurrentCryptoStep(2); // dual keys
      await delay(600);
      setCurrentCryptoStep(3); // transport
      await delay(500);

      let success = false;
      if (isLogin) {
        success = await login(email, password);
      } else {
        success = await signup(email, password);
      }

      if (!success) {
        setCurrentCryptoStep(null);
      }
    } catch (err: any) {
      setLocalError(err.message || "Authentication failed");
      setCurrentCryptoStep(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0C] px-4 py-12 relative overflow-hidden">
      {/* Visual background decorations */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative">
        {/* Left Side: Product Intro & Visual Zero-Knowledge Pipeline */}
        <div className="md:col-span-5 space-y-6 text-zinc-300">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Architecture</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Vault<span className="text-indigo-400">X</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your Digital Vault. Protected by You. Every password, note, card, and identity is fully encrypted client-side before touching our servers.
            </p>
          </div>

          {/* Visual Cryptography Pipeline */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Cryto Derivation Visualizer
            </h3>

            <div className="space-y-4">
              <div className={`flex gap-3 items-start transition-opacity duration-300 ${currentCryptoStep === 1 ? "opacity-100" : "opacity-35"}`}>
                <div className={`p-1 rounded-md text-xs font-mono shrink-0 ${currentCryptoStep === 1 ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}>
                  01
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Password Stretching</h4>
                  <p className="text-[10px] text-zinc-500">Derives strong keys using 100,000 rounds of PBKDF2-SHA256 and unique user salts.</p>
                </div>
              </div>

              <div className={`flex gap-3 items-start transition-opacity duration-300 ${currentCryptoStep === 2 ? "opacity-100" : "opacity-35"}`}>
                <div className={`p-1 rounded-md text-xs font-mono shrink-0 ${currentCryptoStep === 2 ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}>
                  02
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Dual-Key Isolation</h4>
                  <p className="text-[10px] text-zinc-500">Separates authKey (transferred securely) and vaultKey (master encryption key, kept in browser RAM).</p>
                </div>
              </div>

              <div className={`flex gap-3 items-start transition-opacity duration-300 ${currentCryptoStep === 3 ? "opacity-100" : "opacity-35"}`}>
                <div className={`p-1 rounded-md text-xs font-mono shrink-0 ${currentCryptoStep === 3 ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}>
                  03
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Double Hashing Transmission</h4>
                  <p className="text-[10px] text-zinc-500">Server receives authKey, hashes it again, and registers the session. Safe against database leaks.</p>
                </div>
              </div>
            </div>

            {currentCryptoStep && (
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold font-mono text-indigo-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Running client operations...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="md:col-span-7 glass-panel rounded-2xl border border-zinc-800/80 p-8 glow-indigo">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white">{isLogin ? "Sign In to Vault" : "Create Master Vault"}</h2>
            <p className="text-xs text-zinc-400 mt-1">
              {isLogin ? "Securely unlock your passwords and digital files." : "Establish your private key database. Make sure you don't forget your password."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-700 outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                  disabled={isAuthenticating}
                  required
                />
              </div>
            </div>

            {/* Master Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-400">Master Password</label>
                {isLogin && (
                  <span className="text-[10px] text-zinc-500 cursor-help hover:text-indigo-400 transition-colors" title="VaultX is fully zero-knowledge, so passwords can never be recovered if lost. Ensure you write it down safely.">
                    Cannot recover if lost
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-3 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                  disabled={isAuthenticating}
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field (Sign up only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Confirm Master Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-3 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all focus:ring-1 focus:ring-indigo-500/20"
                    disabled={isAuthenticating}
                    required
                  />
                </div>
              </div>
            )}

            {/* Errors */}
            {(localError || globalError) && (
              <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 text-xs font-medium flex gap-2 items-start">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{localError || globalError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deriving local keys...
                </>
              ) : (
                <>
                  {isLogin ? "Unlock Vault Database" : "Create Zero-Knowledge Vault"}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Form Toggle Link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-zinc-500">
              {isLogin ? "New to VaultX? " : "Already have a database? "}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setLocalError(null);
                clearError();
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition-colors outline-none"
            >
              {isLogin ? "Register a free vault" : "Sign in to existing vault"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
