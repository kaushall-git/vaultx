/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { useVaultStore } from "../../../store.js";
import { History, ShieldAlert, KeyRound, Edit, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function ActivityLogs() {
  const auditLogs = useVaultStore((state) => state.auditLogs);
  const fetchAuditLogs = useVaultStore((state) => state.fetchAuditLogs);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getActionStyles = (action: string) => {
    switch (action) {
      case "USER_REGISTERED":
      case "VAULT_ITEM_CREATED":
        return {
          icon: <Plus className="w-4 h-4 text-emerald-400" />,
          color: "border-emerald-500/10 bg-emerald-500/5 text-emerald-400",
        };
      case "USER_LOGGED_IN":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
          color: "border-blue-500/10 bg-blue-500/5 text-blue-400",
        };
      case "LOGIN_FAILED":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
          color: "border-red-500/10 bg-red-500/5 text-red-400 font-bold",
        };
      case "VAULT_ITEM_UPDATED":
        return {
          icon: <Edit className="w-4 h-4 text-indigo-400" />,
          color: "border-indigo-500/10 bg-indigo-500/5 text-indigo-400",
        };
      case "VAULT_ITEM_DELETED":
        return {
          icon: <Trash2 className="w-4 h-4 text-amber-400" />,
          color: "border-amber-500/10 bg-amber-500/5 text-amber-400",
        };
      default:
        return {
          icon: <KeyRound className="w-4 h-4 text-zinc-400" />,
          color: "border-zinc-800 bg-zinc-950/40 text-zinc-400",
        };
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <History className="w-6 h-6 text-indigo-400" />
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Security Audit Logs</h2>
          <p className="text-xs text-zinc-400">A rolling, un-editable cryptographic ledger tracking all operations inside this user vault.</p>
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-zinc-800 bg-zinc-950/20 text-zinc-500">
          <History className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
          No activities recorded yet.
        </div>
      ) : (
        <div className="border border-zinc-800 bg-zinc-950/20 rounded-xl divide-y divide-zinc-800/80 overflow-hidden">
          {auditLogs.map((log) => {
            const styles = getActionStyles(log.action);
            return (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-950/40 transition-colors">
                <div className="flex gap-3 items-start">
                  <div className={`p-2 rounded-lg border shrink-0 ${styles.color}`}>
                    {styles.icon}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded border bg-zinc-900 border-zinc-800 text-zinc-300">
                        {log.action}
                      </span>
                      {log.ipAddress && (
                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/40 px-1.5 py-0.5 rounded">
                          IP: {log.ipAddress}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300">{log.details}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-zinc-500 block">
                    {formatDate(log.timestamp)}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">ID: {log.id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
