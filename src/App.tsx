/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { useVaultStore } from "./store.js";
import AuthScreen from "./features/auth/components/AuthScreen.js";
import LockScreen from "./features/auth/components/LockScreen.js";
import Sidebar from "./shared/components/Sidebar.js";
import VaultList from "./features/vault/components/VaultList.js";
import VaultDetail from "./features/vault/components/VaultDetail.js";
import SecurityAudit from "./features/security/components/SecurityAudit.js";
import ActivityLogs from "./features/audit/components/ActivityLogs.js";
import BackupSettings from "./features/settings/components/BackupSettings.js";

export default function App() {
  const token = useVaultStore((state) => state.token);
  const user = useVaultStore((state) => state.user);
  const isLocked = useVaultStore((state) => state.isLocked);
  const currentCategory = useVaultStore((state) => state.currentCategory);
  const initializeSession = useVaultStore((state) => state.initializeSession);

  // Load session from storage on start
  useEffect(() => {
    initializeSession();
  }, []);

  // 1. If not authenticated, render registration/login screen
  if (!token || !user) {
    return <AuthScreen />;
  }

  // 2. If session is locked, render master unlock prompt
  if (isLocked) {
    return <LockScreen />;
  }

  // 3. Render the active authenticated layout
  const isViewingPanel = ["all", "login", "secure_note", "card", "identity", "favorites"].includes(currentCategory);

  return (
    <div className="h-screen flex bg-[#0B0B0C] text-zinc-300 font-sans antialiased overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Dynamic Panel Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950/20">
        {isViewingPanel ? (
          // Bipartite split details workspace: lists left, details right
          <div className="flex-1 flex h-full overflow-hidden">
            <VaultList />
            <VaultDetail />
          </div>
        ) : (
          // Scrollable view containers for Audits, Logs, and Backup panels
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {currentCategory === "audit" && <SecurityAudit />}
            {currentCategory === "activity" && <ActivityLogs />}
            {currentCategory === "settings" && <BackupSettings />}
          </div>
        )}
      </main>
    </div>
  );
}
