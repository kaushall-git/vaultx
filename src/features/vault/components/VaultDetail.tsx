/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useVaultStore } from "../../../store.js";
import {
  Globe,
  FileText,
  CreditCard,
  User,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Save,
  KeyRound,
  ShieldAlert,
  Share2,
  Link2,
  Mail,
  UserCheck,
  Lock,
  Unlock,
  Clock,
} from "lucide-react";
import PasswordGenerator from "../../generator/components/PasswordGenerator.js";
import { VaultCategory } from "../../../types.js";

export default function VaultDetail() {
  const selectedItemId = useVaultStore((state) => state.selectedItemId);
  const setSelectedItemId = useVaultStore((state) => state.setSelectedItemId);
  const decryptedItems = useVaultStore((state) => state.decryptedItems);
  const sharedWithMe = useVaultStore((state) => state.sharedWithMe);
  const createItem = useVaultStore((state) => state.createItem);
  const updateItem = useVaultStore((state) => state.updateItem);
  const deleteItem = useVaultStore((state) => state.deleteItem);
  const shareByEmail = useVaultStore((state) => state.shareByEmail);
  const generateShareLink = useVaultStore((state) => state.generateShareLink);

  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Sharing Modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeShareTab, setActiveShareTab] = useState<"email" | "link">("email");
  
  // Email Share form
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "copy" | "edit">("view");
  const [isSharingByEmail, setIsSharingByEmail] = useState(false);
  const [emailShareSuccess, setEmailShareSuccess] = useState(false);
  const [emailShareError, setEmailShareError] = useState<string | null>(null);

  // Link Share form
  const [linkExpiration, setLinkExpiration] = useState("24h");
  const [linkViewLimit, setLinkViewLimit] = useState(1);
  const [linkPasswordProtected, setLinkPasswordProtected] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states
  const [category, setCategory] = useState<VaultCategory>("login");
  const [title, setTitle] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Category specific fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [content, setContent] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [pin, setPin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const activeItem = decryptedItems.find((item) => item.id === selectedItemId) ||
                     sharedWithMe.find((item) => item.id === selectedItemId);

  const isSharedItem = !!activeItem?.shareInfo;
  const permission = activeItem?.shareInfo?.permission;
  const ownerEmail = activeItem?.shareInfo?.ownerEmail;
  const canCopy = !isSharedItem || permission !== "view";

  // Populate form when item selection changes
  useEffect(() => {
    if (selectedItemId === "new") {
      setIsEditing(true);
      setCategory("login");
      setTitle("");
      setIsFavorite(false);
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
      setContent("");
      setCardholderName("");
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setPin("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setShowGenerator(false);
    } else if (activeItem) {
      setIsEditing(false);
      setCategory(activeItem.category);
      setTitle(activeItem.title);
      setIsFavorite(activeItem.isFavorite);
      setShowGenerator(false);

      const d: any = activeItem.details;
      if (activeItem.category === "login") {
        setUsername(d.username || "");
        setPassword(d.password || "");
        setUrl(d.url || "");
        setNotes(d.notes || "");
      } else if (activeItem.category === "secure_note") {
        setContent(d.content || "");
      } else if (activeItem.category === "card") {
        setCardholderName(d.cardholderName || "");
        setCardNumber(d.cardNumber || "");
        setExpiryDate(d.expiryDate || "");
        setCvv(d.cvv || "");
        setPin(d.pin || "");
        setNotes(d.notes || "");
      } else if (activeItem.category === "identity") {
        setFirstName(d.firstName || "");
        setLastName(d.lastName || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setAddress(d.address || "");
        setNotes(d.notes || "");
      }
    }
  }, [selectedItemId, activeItem]);

  if (!selectedItemId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 bg-[#0B0B0C]">
        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl mb-4 text-zinc-600">
          <KeyRound size={32} />
        </div>
        <h3 className="text-sm font-semibold text-zinc-400">Vault Decrypted & Safe</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
          Select an entry from the sidebar to inspect detailed records, copy parameters, or verify key derivations.
        </p>
      </div>
    );
  }

  const handleCopy = (val: string, fieldName: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    const msg = isSharedItem 
      ? `Are you sure you want to remove '${activeItem.title}' from your shared vault?`
      : `Are you sure you want to permanently delete '${activeItem.title}'? This action cannot be undone.`;
    const confirm = window.confirm(msg);
    if (confirm) {
      const success = await deleteItem(activeItem.id);
      if (success) {
        setSelectedItemId(null);
      }
    }
  };

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !recipientEmail.trim()) return;

    setIsSharingByEmail(true);
    setEmailShareError(null);
    setEmailShareSuccess(false);

    try {
      const success = await shareByEmail(activeItem.id, recipientEmail.trim().toLowerCase(), sharePermission);
      if (success) {
        setEmailShareSuccess(true);
      } else {
        setEmailShareError("Failed to share. Verify the recipient has logged in and has initialized sharing keys.");
      }
    } catch (err: any) {
      setEmailShareError(err.message || "An unexpected error occurred during sharing.");
    } finally {
      setIsSharingByEmail(false);
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    setIsGeneratingLink(true);
    setGeneratedShareLink(null);

    try {
      let expiresAt: string | null = null;
      const now = new Date();
      if (linkExpiration === "1h") {
        now.setHours(now.getHours() + 1);
        expiresAt = now.toISOString();
      } else if (linkExpiration === "24h") {
        now.setHours(now.getHours() + 24);
        expiresAt = now.toISOString();
      } else if (linkExpiration === "7d") {
        now.setDate(now.getDate() + 7);
        expiresAt = now.toISOString();
      }

      const link = await generateShareLink(
        activeItem.id,
        expiresAt,
        linkViewLimit,
        linkPasswordProtected,
        linkPasswordProtected ? linkPassword : undefined
      );

      if (link) {
        setGeneratedShareLink(link);
      } else {
        alert("Failed to generate secure link.");
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    let details = {};
    if (category === "login") {
      details = { username, password, url, notes };
    } else if (category === "secure_note") {
      details = { content };
    } else if (category === "card") {
      details = { cardholderName, cardNumber, expiryDate, cvv, pin, notes };
    } else if (category === "identity") {
      details = { firstName, lastName, email, phone, address, notes };
    }

    let success = false;
    if (selectedItemId === "new") {
      success = await createItem(category, title, details, isFavorite);
    } else if (activeItem) {
      success = await updateItem(activeItem.id, title, details, isFavorite);
    }

    if (success) {
      setIsEditing(false);
      if (selectedItemId === "new") {
        setSelectedItemId(null);
      }
    }
  };

  const getCleanUrl = (link: string) => {
    if (!link) return "";
    if (link.startsWith("http://") || link.startsWith("https://")) return link;
    return `https://${link}`;
  };

  const getStrengthScore = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 20;
    if (pass.length >= 14) score += 20;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    return score;
  };

  const getStrengthBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const strength = getStrengthScore(password);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0B0C] overflow-y-auto">
      {/* Top action bar */}
      <div className="p-4 border-b border-zinc-900 flex justify-between items-center shrink-0 bg-zinc-950/20">
        <div className="flex items-center gap-2">
          {category === "login" && <Globe size={16} className="text-blue-400" />}
          {category === "secure_note" && <FileText size={16} className="text-emerald-400" />}
          {category === "card" && <CreditCard size={16} className="text-amber-400" />}
          {category === "identity" && <User size={16} className="text-indigo-400" />}
          <span className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
            {selectedItemId === "new" ? `Create ${category}` : "Credential Details"}
          </span>
        </div>

        <div className="flex gap-2">
          {selectedItemId !== "new" && !isEditing && (
            <>
              {!isSharedItem && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="py-1.5 px-3 bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>
              )}
              {(!isSharedItem || permission === "edit") && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="py-1.5 px-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                className="py-1.5 px-3 bg-zinc-900 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900/30 text-zinc-500 hover:text-red-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{isSharedItem ? "Leave Share" : "Delete"}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setSelectedItemId(null)}
            className="p-1.5 text-zinc-500 hover:bg-zinc-900 rounded-md transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl w-full mx-auto space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Shared Credential Banner */}
          {isSharedItem && (
            <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 bg-indigo-950/50 border border-indigo-900/50 rounded-lg text-indigo-400 shrink-0">
                <Share2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-200">Shared Credential</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  This item is securely shared with you by <span className="text-indigo-400 font-semibold">{ownerEmail}</span>.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-900/30 text-indigo-400 border border-indigo-900/40 rounded">
                    {permission === "view" ? "View Only" : permission === "copy" ? "Can Copy & View" : "Can Edit"}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Categories select when creating a new secret */}
          {selectedItemId === "new" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Record Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(["login", "secure_note", "card", "identity"] as VaultCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all outline-none cursor-pointer ${
                      category === cat
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                        : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {cat === "login" && <Globe size={14} />}
                    {cat === "secure_note" && <FileText size={14} />}
                    {cat === "card" && <CreditCard size={14} />}
                    {cat === "identity" && <User size={14} />}
                    <span className="capitalize">{cat.replace("_", " ")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Favorite Star block */}
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Amazon, Personal Note, Chase Debit, etc."
                disabled={!isEditing}
                className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm font-semibold text-white placeholder-zinc-700 outline-none transition-all"
                required
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              disabled={!isEditing}
              className={`p-2 border rounded-xl transition-colors cursor-pointer ${
                isFavorite
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-zinc-950 border-zinc-850 text-zinc-600 hover:text-zinc-400 disabled:opacity-50"
              }`}
            >
              <Star size={16} className={isFavorite ? "fill-amber-400" : ""} />
            </button>
          </div>

          <div className="h-px bg-zinc-900" />

          {/* DYNAMIC FORMS ACCORDING TO CATEGORIES */}

          {/* 1. LOGIN CATEGORY */}
          {category === "login" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Username / Email</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="alex@gmail.com"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                  />
                  {!isEditing && username && canCopy && (
                    <button
                      type="button"
                      onClick={() => handleCopy(username, "username")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {copiedField === "username" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Password</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowGenerator(!showGenerator)}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 select-none cursor-pointer outline-none"
                    >
                      {showGenerator ? "Hide Password Generator" : "Generate Secure Password"}
                    </button>
                  )}
                </div>

                {/* Secure Generator portal nested */}
                {isEditing && showGenerator && (
                  <div className="mb-3">
                    <PasswordGenerator
                      inline={true}
                      onUsePassword={(gen) => {
                        setPassword(gen);
                        setShowGenerator(false);
                      }}
                    />
                  </div>
                )}

                <div className="relative">
                  <input
                    type={showPassword || isEditing ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-16 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all"
                  />
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {!isEditing && password && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {canCopy && (
                          <button
                            type="button"
                            onClick={() => handleCopy(password, "password")}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          >
                            {copiedField === "password" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Password strength visualizer during editing */}
                {isEditing && password && (
                  <div className="pt-1.5">
                    <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-500 font-semibold uppercase">
                      <span>Entropy Strength</span>
                      <span className="font-bold">{strength >= 80 ? "Resilient" : strength >= 50 ? "Moderate" : "Vulnerable"}</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${getStrengthBarColor(strength)}`} style={{ width: `${strength}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Website Address (URL)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://google.com"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-16 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {!isEditing && url && (
                      <>
                        <a
                          href={getCleanUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          Launch
                        </a>
                        {canCopy && (
                          <button
                            type="button"
                            onClick={() => handleCopy(url, "url")}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          >
                            {copiedField === "url" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SECURE NOTE CATEGORY */}
          {category === "secure_note" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Note Content</label>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Insert secure passwords, recovery keys, secret codes, or confidential details here."
                  disabled={!isEditing}
                  rows={8}
                  className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-700 outline-none transition-all resize-none font-mono"
                />
                {!isEditing && content && canCopy && (
                  <button
                    type="button"
                    onClick={() => handleCopy(content, "content")}
                    className="absolute right-3 bottom-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-zinc-950/80 p-1.5 rounded-lg border border-zinc-800"
                  >
                    {copiedField === "content" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. CARD CATEGORY */}
          {category === "card" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Cardholder Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Alex Smith"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                  />
                  {!isEditing && cardholderName && canCopy && (
                    <button
                      type="button"
                      onClick={() => handleCopy(cardholderName, "cardholderName")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {copiedField === "cardholderName" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19))}
                    placeholder="4111 2222 3333 4444"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all"
                  />
                  {!isEditing && cardNumber && canCopy && (
                    <button
                      type="button"
                      onClick={() => handleCopy(cardNumber.replace(/\s/g, ""), "cardNumber")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {copiedField === "cardNumber" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Expiration (MM/YY)</label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value.slice(0, 5))}
                    placeholder="12/28"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">CVV</label>
                  <div className="relative">
                    <input
                      type={showCvv || isEditing ? "text" : "password"}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                      placeholder="321"
                      disabled={!isEditing}
                      className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all"
                    />
                    {!isEditing && cvv && (
                      <button
                        type="button"
                        onClick={() => setShowCvv(!showCvv)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">PIN Code</label>
                  <div className="relative">
                    <input
                      type={showPin || isEditing ? "text" : "password"}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.slice(0, 6))}
                      placeholder="9876"
                      disabled={!isEditing}
                      className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm font-mono text-white placeholder-zinc-700 outline-none transition-all"
                    />
                    {!isEditing && pin && (
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. IDENTITY CATEGORY */}
          {category === "identity" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.smith@example.com"
                      disabled={!isEditing}
                      className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                    />
                    {!isEditing && email && canCopy && (
                      <button
                        type="button"
                        onClick={() => handleCopy(email, "email")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {copiedField === "email" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Phone Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      disabled={!isEditing}
                      className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                    />
                    {!isEditing && phone && canCopy && (
                      <button
                        type="button"
                        onClick={() => handleCopy(phone, "phone")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {copiedField === "phone" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Physical Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Financial Way, San Francisco, CA 94101"
                    disabled={!isEditing}
                    className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-10 text-sm text-white placeholder-zinc-700 outline-none transition-all"
                  />
                  {!isEditing && address && canCopy && (
                    <button
                      type="button"
                      onClick={() => handleCopy(address, "address")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {copiedField === "address" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NOTES AREA (Common for Logins, Cards, and Identities) */}
          {category !== "secure_note" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Extra Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Secure note metadata, recovery questions, pins, etc."
                disabled={!isEditing}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-850 disabled:bg-zinc-950/20 disabled:border-transparent disabled:px-0 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-700 outline-none transition-all resize-none"
              />
            </div>
          )}

          {/* Form Action buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-zinc-900">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save size={13} />
                <span>Save Secret</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (selectedItemId === "new") {
                    setSelectedItemId(null);
                  } else {
                    setIsEditing(false);
                  }
                }}
                className="flex-1 py-2 px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-semibold text-xs rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Sharing Modal */}
      {showShareModal && activeItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-100">Secure Share: {activeItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setEmailShareSuccess(false);
                  setEmailShareError(null);
                  setGeneratedShareLink(null);
                  setRecipientEmail("");
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-900 bg-zinc-950/20">
              <button
                type="button"
                onClick={() => setActiveShareTab("email")}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeShareTab === "email"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Mail size={13} />
                <span>Share by Email</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveShareTab("link")}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeShareTab === "link"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Link2 size={13} />
                <span>Generate Secure Link</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {activeShareTab === "email" ? (
                /* Email Tab */
                <form onSubmit={handleEmailShare} className="space-y-4">
                  {emailShareSuccess ? (
                    <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-4 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                        <UserCheck size={18} />
                      </div>
                      <h4 className="text-xs font-bold text-zinc-200">Share Invitation Sent!</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        An in-app notification has been dispatched to <span className="text-emerald-400 font-semibold">{recipientEmail}</span>. The record is encrypted with their secure public key.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailShareSuccess(false);
                          setRecipientEmail("");
                        }}
                        className="mt-2 py-1 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Share with someone else
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Recipient Email Address</label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="recipient@example.com"
                          className="w-full bg-zinc-950 border border-zinc-850 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 outline-none transition-all font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Share Permission</label>
                        <select
                          value={sharePermission}
                          onChange={(e) => setSharePermission(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-850 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-white outline-none transition-all font-semibold"
                        >
                          <option value="view">View Only (Cannot Copy or Edit)</option>
                          <option value="copy">Can Copy & View (Cannot Edit)</option>
                          <option value="edit">Can Edit, Copy & View</option>
                        </select>
                      </div>

                      {emailShareError && (
                        <p className="text-[10px] font-semibold text-red-400 bg-red-950/10 border border-red-900/20 rounded-lg p-2.5 font-sans">
                          {emailShareError}
                        </p>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSharingByEmail}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isSharingByEmail ? "Encrypting & Sending..." : "Send Secure Invitation"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                /* Secure Link Tab */
                <div className="space-y-4">
                  {generatedShareLink ? (
                    <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Secure Link Active</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Decryption key included in hash</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={generatedShareLink}
                          readOnly
                          className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg py-1.5 px-2.5 text-[11px] font-mono text-zinc-300 select-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedShareLink);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedLink ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="text-[10px] text-zinc-500 leading-relaxed p-2.5 bg-yellow-950/10 border border-yellow-900/20 rounded-lg text-yellow-500/80">
                        <strong>Security Warning:</strong> This link contains the symmetric encryption key after the <code className="bg-zinc-900 px-1 py-0.5 rounded">#</code> fragment. The key is never sent to our servers. Anyone who has this link can decrypt the credentials immediately.
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleGenerateLink} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Link Expiration</label>
                          <select
                            value={linkExpiration}
                            onChange={(e) => setLinkExpiration(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none transition-all font-semibold"
                          >
                            <option value="1h">1 Hour</option>
                            <option value="24h">24 Hours</option>
                            <option value="7d">7 Days</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Maximum Views</label>
                          <select
                            value={linkViewLimit}
                            onChange={(e) => setLinkViewLimit(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-850 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none transition-all font-semibold"
                          >
                            <option value={1}>1 view (one-time)</option>
                            <option value={5}>5 views</option>
                            <option value={999999}>Unlimited views</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3 pt-1 border-t border-zinc-900/60">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                            <Lock size={11} className="text-zinc-400" />
                            <span>Password Protection</span>
                          </label>
                          <input
                            type="checkbox"
                            checked={linkPasswordProtected}
                            onChange={(e) => setLinkPasswordProtected(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-800 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </div>

                        {linkPasswordProtected && (
                          <div className="space-y-1.5">
                            <input
                              type="password"
                              value={linkPassword}
                              onChange={(e) => setLinkPassword(e.target.value)}
                              placeholder="Set access password for link"
                              className="w-full bg-zinc-950 border border-zinc-850 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 outline-none font-semibold"
                              required
                            />
                            <p className="text-[9px] text-zinc-500 font-sans">The recipient will need this password to open the share page.</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isGeneratingLink}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isGeneratingLink ? "Generating Decryption Key..." : "Generate Encrypted Link"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
