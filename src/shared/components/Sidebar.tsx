/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useVaultStore } from "../../store.js";
import {
  KeyRound,
  Globe,
  FileText,
  CreditCard,
  User,
  ShieldAlert,
  History,
  Database,
  Lock,
  LogOut,
  Shield,
  Bell,
  Check,
  X,
} from "lucide-react";

export default function Sidebar() {
  const user = useVaultStore((state) => state.user);
  const currentCategory = useVaultStore((state) => state.currentCategory);
  const setCurrentCategory = useVaultStore((state) => state.setCurrentCategory);
  const lockSession = useVaultStore((state) => state.lockSession);
  const logout = useVaultStore((state) => state.logout);

  const pendingReceivedShares = useVaultStore((state) => state.pendingReceivedShares);
  const acceptShare = useVaultStore((state) => state.acceptShare);
  const revokeShare = useVaultStore((state) => state.revokeShare);

  const [showInvitesModal, setShowInvitesModal] = useState(false);

  const navigationItems = [
    { id: "all", label: "All Items", icon: <KeyRound size={15} /> },
    { id: "login", label: "Logins", icon: <Globe size={15} /> },
    { id: "secure_note", label: "Secure Notes", icon: <FileText size={15} /> },
    { id: "card", label: "Payment Cards", icon: <CreditCard size={15} /> },
    { id: "identity", label: "Identities", icon: <User size={15} /> },
  ] as const;

  const securityItems = [
    { id: "audit", label: "Security Auditor", icon: <ShieldAlert size={15} /> },
    { id: "activity", label: "Audit Ledger", icon: <History size={15} /> },
    { id: "settings", label: "Backup & Restore", icon: <Database size={15} /> },
  ] as const;

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex flex-col justify-between shrink-0 h-full p-4 select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600/15 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Shield size={18} />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white uppercase">
              Vault<span className="text-indigo-400">X</span> Studio
            </span>
          </div>

          {/* Notification Indicator Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowInvitesModal(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors relative cursor-pointer outline-none"
              title="Share Invitations"
            >
              <Bell size={16} />
              {pendingReceivedShares.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 border border-zinc-950 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Primary Categories Navigation */}
        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-wider font-extrabold text-zinc-600 px-2.5 mb-2">
            Categories
          </span>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentCategory(item.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                currentCategory === item.id
                  ? "bg-indigo-600/10 border border-indigo-500/15 text-indigo-400 glow-indigo"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <span className={currentCategory === item.id ? "text-indigo-400" : "text-zinc-500"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Security Auditor & Logs */}
        <div className="space-y-1.5">
          <span className="block text-[10px] uppercase tracking-wider font-extrabold text-zinc-600 px-2.5 mb-2">
            Vault Safety
          </span>
          {securityItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentCategory(item.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                currentCategory === item.id
                  ? "bg-indigo-600/10 border border-indigo-500/15 text-indigo-400 glow-indigo"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <span className={currentCategory === item.id ? "text-indigo-400" : "text-zinc-500"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User Session Footer Block */}
      <div className="space-y-3 pt-4 border-t border-zinc-900">
        <div className="px-2.5 py-1">
          <span className="block text-[10px] font-semibold text-zinc-500 truncate" title={user?.email}>
            {user?.email}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-mono">Zero-Knowledge On</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={lockSession}
            className="py-1.5 px-2 bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Lock Cryptographic Session"
          >
            <Lock size={11} />
            <span>Lock</span>
          </button>
          <button
            onClick={logout}
            className="py-1.5 px-2 bg-zinc-900 border border-zinc-800/80 hover:bg-red-950/20 hover:border-red-900/30 text-zinc-500 hover:text-red-400 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Log Out Session"
          >
            <LogOut size={11} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {showInvitesModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-indigo-400 animate-bounce" />
                <h3 className="text-sm font-bold text-zinc-100">Pending Secure Shares</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInvitesModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content list */}
            <div className="p-5 max-h-[350px] overflow-y-auto space-y-3">
              {pendingReceivedShares.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs space-y-1.5">
                  <Bell size={24} className="mx-auto text-zinc-700 mb-1" />
                  <p className="font-semibold text-zinc-400">All clear!</p>
                  <p className="text-[10px] text-zinc-500 font-sans">You have no pending sharing invitations.</p>
                </div>
              ) : (
                pendingReceivedShares.map((invite) => (
                  <div key={invite.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-zinc-300 truncate">
                          From: <span className="text-indigo-400 font-semibold">{invite.ownerEmail}</span>
                        </p>
                        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                          Received: {new Date(invite.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-900/30 text-indigo-400 border border-indigo-900/40 rounded shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const success = await acceptShare(invite.id);
                          if (success) {
                            alert("Invitation accepted successfully! Decrypted record is now in your vault list.");
                          }
                        }}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check size={11} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to decline this share?")) {
                            await revokeShare(invite.id);
                          }
                        }}
                        className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-red-950/20 hover:border-red-900/30 text-zinc-400 hover:text-red-400 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <X size={11} />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
