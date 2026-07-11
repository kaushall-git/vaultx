/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useVaultStore } from "../../../store.js";
import { Search, Plus, Star, Globe, FileText, CreditCard, User, ShieldAlert } from "lucide-react";

export default function VaultList() {
  const decryptedItems = useVaultStore((state) => state.decryptedItems);
  const sharedWithMe = useVaultStore((state) => state.sharedWithMe);
  const selectedItemId = useVaultStore((state) => state.selectedItemId);
  const setSelectedItemId = useVaultStore((state) => state.setSelectedItemId);
  const currentCategory = useVaultStore((state) => state.currentCategory);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);

  // Combine user's own decrypted items with items shared with them
  const allAvailableItems = [...decryptedItems, ...sharedWithMe];

  // Filter items
  const filteredItems = allAvailableItems.filter((item) => {
    // Category filter
    if (currentCategory === "favorites") {
      if (!item.isFavorite) return false;
    } else if (currentCategory !== "all") {
      if (item.category !== currentCategory) return false;
    }

    // Search filter (searches decrypted titles, usernames, content, address, etc.)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      
      const details: any = item.details;
      const matchUsername = details?.username?.toLowerCase().includes(q);
      const matchUrl = details?.url?.toLowerCase().includes(q);
      const matchNotes = details?.notes?.toLowerCase().includes(q);
      const matchContent = details?.content?.toLowerCase().includes(q);
      const matchCardholder = details?.cardholderName?.toLowerCase().includes(q);

      return matchTitle || matchUsername || matchUrl || matchNotes || matchContent || matchCardholder;
    }

    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "login":
        return <Globe size={14} className="text-blue-400" />;
      case "secure_note":
        return <FileText size={14} className="text-emerald-400" />;
      case "card":
        return <CreditCard size={14} className="text-amber-400" />;
      case "identity":
        return <User size={14} className="text-indigo-400" />;
      default:
        return <FileText size={14} />;
    }
  };

  const getSubtext = (item: typeof decryptedItems[0]) => {
    const details: any = item.details;
    if (item.category === "login") return details.username || "No username";
    if (item.category === "secure_note") return "Secure Note";
    if (item.category === "card") {
      const num = details.cardNumber || "";
      return num ? `•••• ${num.slice(-4)}` : "Payment Card";
    }
    if (item.category === "identity") {
      return `${details.firstName || ""} ${details.lastName || ""}`.trim() || "Identity File";
    }
    return "";
  };

  return (
    <div className="w-80 border-r border-zinc-800/80 bg-zinc-950/20 flex flex-col h-full shrink-0">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-900 space-y-3 shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credentials..."
            className="w-full bg-zinc-950 border border-zinc-850 focus:border-indigo-500 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-600 outline-none transition-all focus:ring-1 focus:ring-indigo-500/10"
          />
        </div>

        <button
          onClick={() => setSelectedItemId("new")}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Add New Record</span>
        </button>
      </div>

      {/* Scrollable Records List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs space-y-1.5 mt-8">
            <ShieldAlert size={20} className="mx-auto text-zinc-600 mb-1" />
            <p className="font-semibold text-zinc-400">No entries found</p>
            <p className="text-[10px] text-zinc-500">Add credentials or update search query.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors outline-none cursor-pointer ${
                selectedItemId === item.id
                  ? "bg-zinc-900/60"
                  : "hover:bg-zinc-900/20"
              }`}
            >
              <div className="p-2 bg-zinc-900 border border-zinc-800/80 rounded-lg shrink-0 mt-0.5">
                {getCategoryIcon(item.category)}
              </div>
              
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="block text-xs font-semibold text-zinc-200 truncate pr-1 flex items-center gap-1.5">
                    <span className="truncate">{item.title}</span>
                    {item.shareInfo && (
                      <span className="text-[8px] px-1 bg-indigo-900/40 text-indigo-400 border border-indigo-900/30 rounded scale-90 shrink-0 font-sans tracking-wide uppercase font-bold">
                        Shared
                      </span>
                    )}
                  </span>
                  {item.isFavorite && (
                    <Star size={11} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                  )}
                </div>
                <span className="block text-[10px] font-mono text-zinc-500 truncate">
                  {getSubtext(item)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
