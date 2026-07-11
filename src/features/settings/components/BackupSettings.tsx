/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useVaultStore } from "../../../store.js";
import {
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  FileUp,
  CheckCircle,
  Chrome,
  Database,
  Eye,
  EyeOff,
  Check,
  X,
  Info,
  Layers,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { DecryptedVaultItem, LoginDetails } from "../../../types.js";

interface CSVRow {
  id: string;
  name: string;
  url: string;
  username: string;
  password:  string;
  note: string;
  isWeak: boolean;
  isDuplicate: boolean;
  duplicateItem?: DecryptedVaultItem;
  selected: boolean;
}

export default function BackupSettings() {
  const decryptedItems = useVaultStore((state) => state.decryptedItems);
  const encryptedItems = useVaultStore((state) => state.encryptedItems);
  const createItem = useVaultStore((state) => state.createItem);
  const updateItem = useVaultStore((state) => state.updateItem);
  const fetchItems = useVaultStore((state) => state.fetchItems);
  const setCurrentCategory = useVaultStore((state) => state.setCurrentCategory);

  // Layout tabs
  const [activeTab, setActiveTab] = useState<"csv" | "json">("csv");

  // State for CSV Importer
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [csvFileSize, setCsvFileSize] = useState<string>("");
  const [dragActiveCSV, setDragActiveCSV] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "merge" | "all">("skip");
  const [importNotes, setImportNotes] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // State for JSON backup import
  const [dragActiveJSON, setDragActiveJSON] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Import Progress tracker
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    completed: boolean;
    addedCount: number;
    mergedCount: number;
    skippedCount: number;
  } | null>(null);

  // Helper: Duplicate detection
  const checkDuplicate = (name: string, url: string, username: string) => {
    return decryptedItems.find((item) => {
      if (item.category !== "login") return false;
      const details = item.details as LoginDetails;
      
      // Match username exactly (case-insensitive)
      const usernameMatch = (details.username || "").toLowerCase().trim() === username.toLowerCase().trim();
      
      // Match website name or url (case-insensitive)
      const titleMatch = item.title.toLowerCase().trim() === name.toLowerCase().trim();
      const urlMatch = !!(url && details.url && (
        details.url.toLowerCase().replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "").trim() === 
        url.toLowerCase().replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "").trim()
      ));
      
      return usernameMatch && (titleMatch || urlMatch);
    });
  };

  // 1. Native robust CSV parser
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let insideQuote = false;
    let entry = "";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          entry += '"';
          i++; // skip next quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = "";
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        row.push(entry.trim());
        entry = "";
        if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
      } else {
        entry += char;
      }
    }
    
    if (entry || row.length > 0) {
      row.push(entry.trim());
      if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
        lines.push(row);
      }
    }
    
    return lines;
  };

  // Parse Chrome Export CSV format
  const parseChromeCSV = (text: string): CSVRow[] => {
    const lines = parseCSV(text);
    if (lines.length === 0) return [];

    const headers = lines[0].map((h) => h.toLowerCase().trim());
    
    // Standard Google Chrome columns: name, url, username, password, note
    const nameIdx = headers.indexOf("name");
    const urlIdx = headers.indexOf("url");
    const usernameIdx = headers.indexOf("username");
    const passwordIdx = headers.indexOf("password");
    const noteIdx = headers.findIndex((h) => h === "note" || h === "notes");

    if (nameIdx === -1 || passwordIdx === -1) {
      throw new Error(
        "Invalid Chrome CSV format. The CSV must contain header columns for 'name' and 'password'."
      );
    }

    const results: CSVRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

      const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : "Unknown Website";
      const url = urlIdx !== -1 && row[urlIdx] ? row[urlIdx] : "";
      const username = usernameIdx !== -1 && row[usernameIdx] ? row[usernameIdx] : "";
      const password = passwordIdx !== -1 && row[passwordIdx] ? row[passwordIdx] : "";
      const note = noteIdx !== -1 && row[noteIdx] ? row[noteIdx] : "";

      // Skip rows with no name, password, and username
      if (!name.trim() && !password.trim() && !username.trim()) continue;

      // Strength criteria matching our Security Auditor
      const isWeak =
        password.length < 10 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      const duplicateItem = checkDuplicate(name, url, username);
      const isDuplicate = !!duplicateItem;

      results.push({
        id: `csv-row-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        url: url.trim(),
        username: username.trim(),
        password,
        note: note.trim(),
        isWeak,
        isDuplicate,
        duplicateItem,
        selected: !isDuplicate, // Uncheck duplicates by default to prevent accidental overwrite
      });
    }

    return results;
  };

  const processCSVFile = (text: string, fileName: string, fileSize: number) => {
    try {
      setImportStatus(null);
      const parsed = parseChromeCSV(text);
      if (parsed.length === 0) {
        throw new Error("The uploaded CSV file contains no readable credentials.");
      }
      setCsvRows(parsed);
      setCsvFileName(fileName);
      setCsvFileSize((fileSize / 1024).toFixed(1) + " KB");
      setImportProgress(null);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || "Failed to parse Google Chrome CSV file.",
      });
    }
  };

  const handleDragCSV = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveCSV(true);
    } else if (e.type === "dragleave") {
      setDragActiveCSV(false);
    }
  };

  const handleDropCSV = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveCSV(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const text = await file.text();
      processCSVFile(text, file.name, file.size);
    }
  };

  const handleCSVFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      processCSVFile(text, file.name, file.size);
    }
  };

  const handleDuplicateActionChange = (action: "skip" | "merge" | "all") => {
    setDuplicateAction(action);
    setCsvRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        selected: action === "skip" ? (row.isDuplicate ? false : row.selected) : true,
      }))
    );
  };

  const handleRowToggle = (rowId: string) => {
    setCsvRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, selected: !row.selected } : row))
    );
  };

  const handleSelectAllToggle = () => {
    const allSelected = csvRows.every((r) => r.selected);
    setCsvRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected: !allSelected,
      }))
    );
  };

  const togglePasswordReveal = (rowId: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  // Core encrypted CSV Import pipeline
  const handleImportCSV = async () => {
    const selectedRows = csvRows.filter((r) => r.selected);
    if (selectedRows.length === 0) return;

    setIsImporting(true);
    setImportProgress({
      current: 0,
      total: selectedRows.length,
      completed: false,
      addedCount: 0,
      mergedCount: 0,
      skippedCount: 0,
    });

    let added = 0;
    let merged = 0;
    let skipped = 0;
    let index = 0;

    for (const record of selectedRows) {
      try {
        if (record.isDuplicate && duplicateAction === "skip") {
          skipped++;
          index++;
          setImportProgress((prev) =>
            prev ? { ...prev, current: index, skippedCount: skipped } : null
          );
          continue;
        }

        if (record.isDuplicate && duplicateAction === "merge" && record.duplicateItem) {
          // Merge & update the existing item with client-side encryption
          const existingDetails = record.duplicateItem.details as LoginDetails;
          const updatedDetails = {
            ...existingDetails,
            password: record.password,
          };
          
          if (importNotes && record.note) {
            updatedDetails.notes = existingDetails.notes
              ? `${existingDetails.notes}\n---\nImported Chrome Note: ${record.note}`
              : record.note;
          }

          const success = await updateItem(
            record.duplicateItem.id,
            record.duplicateItem.title,
            updatedDetails,
            record.duplicateItem.isFavorite
          );

          if (success) {
            merged++;
          } else {
            skipped++;
          }
        } else {
          // Create new record with client-side encryption
          const details: LoginDetails = {
            username: record.username,
            password: record.password,
            url: record.url,
          };

          if (importNotes && record.note) {
            details.notes = record.note;
          }

          const success = await createItem(
            "login",
            record.name,
            details,
            false
          );

          if (success) {
            added++;
          } else {
            skipped++;
          }
        }
      } catch (err) {
        console.error("CSV import record failure:", record.name, err);
        skipped++;
      }

      index++;
      setImportProgress((prev) =>
        prev
          ? {
              ...prev,
              current: index,
              addedCount: added,
              mergedCount: merged,
              skippedCount: skipped,
            }
          : null
      );

      // Micro delay to allow local cryptographic state ticks & DOM redraws
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    setImportProgress((prev) => (prev ? { ...prev, completed: true } : null));
    setIsImporting(false);
    
    // Purge the raw credentials from browser state immediately to secure memory
    setCsvRows([]);
    setCsvFileName("");
    setCsvFileSize("");
    setRevealedPasswords({});
  };

  const handleResetCSV = () => {
    setCsvRows([]);
    setCsvFileName("");
    setCsvFileSize("");
    setRevealedPasswords({});
    setImportProgress(null);
    setImportStatus(null);
  };

  // 2. Original JSON Sync procedures
  const processJSONBackupFile = async (text: string) => {
    setIsImporting(true);
    setImportStatus(null);
    try {
      const backup = JSON.parse(text);

      if (!backup.items || !Array.isArray(backup.items)) {
        throw new Error("Invalid backup file structure: missing items list");
      }

      let importCount = 0;

      if (backup.type === "vaultx-plaintext-backup") {
        for (const item of backup.items) {
          const success = await createItem(
            item.category,
            item.title,
            item.details,
            !!item.isFavorite
          );
          if (success) importCount++;
        }
        setImportStatus({
          success: true,
          message: `Successfully imported ${importCount} records from decrypted backup. All secrets were fully encrypted client-side.`,
        });
      } else if (backup.type === "vaultx-encrypted-backup") {
        const vaultKey = useVaultStore.getState().vaultKey;
        if (!vaultKey) throw new Error("Vault is locked. Unlock to import encrypted backups.");

        const { decryptData } = await import("../../../lib/crypto.js");

        for (const item of backup.items) {
          try {
            await decryptData(item.encryptedTitle, vaultKey);
            const decryptedPayload = await decryptData(item.encryptedPayload, vaultKey);
            const details = JSON.parse(decryptedPayload);
            const title = await decryptData(item.encryptedTitle, vaultKey);

            const success = await createItem(
              item.category,
              title,
              details,
              !!item.isFavorite
            );
            if (success) importCount++;
          } catch (err) {
            console.warn("Skipped item: could not decrypt with current master key", err);
          }
        }

        if (importCount === 0) {
          throw new Error("No items could be imported. Verify that the backup file matches your current master password.");
        }

        setImportStatus({
          success: true,
          message: `Successfully imported ${importCount} encrypted secrets that match your current Master Password.`,
        });
      } else {
        throw new Error("Unknown backup file signature. Make sure it is a valid VaultX JSON export.");
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || "Failed to process backup file.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportEncrypted = () => {
    try {
      const dataStr = JSON.stringify({
        type: "vaultx-encrypted-backup",
        version: "1.0.0",
        items: encryptedItems.map(({ id, ...rest }) => rest),
      }, null, 2);

      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vaultx_encrypted_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export encrypted error:", err);
    }
  };

  const handleExportDecrypted = () => {
    const confirm = window.confirm(
      "WARNING: This will export ALL your passwords, keys, and identities in CLEAR PLAIN TEXT. Anyone with access to this file can view all your secrets immediately. Are you sure you want to proceed?"
    );
    if (!confirm) return;

    try {
      const dataStr = JSON.stringify({
        type: "vaultx-plaintext-backup",
        version: "1.0.0",
        items: decryptedItems.map(({ id, createdAt, updatedAt, ...rest }) => rest),
      }, null, 2);

      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vaultx_plaintext_DECRYPTED_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export decrypted error:", err);
    }
  };

  const handleDragJSON = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveJSON(true);
    } else if (e.type === "dragleave") {
      setDragActiveJSON(false);
    }
  };

  const handleDropJSON = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveJSON(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const text = await file.text();
      processJSONBackupFile(text);
    }
  };

  const handleJSONFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      processJSONBackupFile(text);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 select-none">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Data Migration & Backups</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Import credentials from browsers or sync/back up your cryptographic vaults.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-zinc-800/80">
        <button
          onClick={() => setActiveTab("csv")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "csv"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Chrome className="w-3.5 h-3.5" />
          Chrome CSV Import
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "json"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          JSON Sync & Backup
        </button>
      </div>

      {/* Tab Panel 1: CSV Importer */}
      {activeTab === "csv" && (
        <div className="space-y-6">
          {/* Progress Tracker */}
          {importProgress && (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {importProgress.completed ? "🎉 Import Completed Successfully" : "🔒 Securing & Encrypting Credentials..."}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {importProgress.completed
                      ? "Your credentials have been securely stored with zero-knowledge AES-256-GCM encryption."
                      : `Encrypting item ${importProgress.current} of ${importProgress.total} completely client-side...`}
                  </p>
                </div>
                {!importProgress.completed && (
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                <div
                  className="bg-indigo-600 h-full transition-all duration-150"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-4 gap-3 pt-2 text-center">
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Processed</span>
                  <span className="text-sm font-mono font-bold text-zinc-300">
                    {importProgress.current} / {importProgress.total}
                  </span>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-emerald-950/25">
                  <span className="block text-[10px] text-emerald-500/80 uppercase tracking-wider font-bold">Added</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{importProgress.addedCount}</span>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-indigo-950/25">
                  <span className="block text-[10px] text-indigo-400 uppercase tracking-wider font-bold">Merged</span>
                  <span className="text-sm font-mono font-bold text-indigo-400">{importProgress.mergedCount}</span>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Skipped</span>
                  <span className="text-sm font-mono font-bold text-zinc-400">{importProgress.skippedCount}</span>
                </div>
              </div>

              {importProgress.completed && (
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={handleResetCSV}
                    className="py-1.5 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200 text-zinc-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Import Another CSV File
                  </button>
                  <button
                    onClick={() => setCurrentCategory("login")}
                    className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>View Logins</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Setup / Dropzone View (Show when no CSV loaded and not in progress) */}
          {csvRows.length === 0 && !importProgress && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* File Dropzone */}
              <div className="md:col-span-7 space-y-4">
                <div
                  onDragEnter={handleDragCSV}
                  onDragOver={handleDragCSV}
                  onDragLeave={handleDragCSV}
                  onDrop={handleDropCSV}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative ${
                    dragActiveCSV
                      ? "border-indigo-500 bg-indigo-500/5"
                      : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700"
                  }`}
                >
                  <input
                    id="csv-file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <label htmlFor="csv-file-upload" className="cursor-pointer space-y-3 block">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-zinc-200">
                        Upload exported Google Chrome CSV
                      </span>
                      <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        Drag and drop your password spreadsheet here, or click to browse files from your computer.
                      </p>
                    </div>
                  </label>
                </div>

                {importStatus && !importStatus.success && (
                  <div className="p-3.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 flex gap-2.5 items-start text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{importStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Instructions Sidebar */}
              <div className="md:col-span-5 p-5 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-4">
                <div className="flex gap-2 items-center">
                  <Chrome className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">How to Export Passwords</h3>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-zinc-400">
                  <ol className="list-decimal list-inside space-y-2 text-[11px]">
                    <li>
                      Open Google Chrome and navigate to <strong className="text-zinc-300">Settings</strong>.
                    </li>
                    <li>
                      Select <strong className="text-zinc-300">Autofill and passwords</strong> &gt; <strong className="text-zinc-300">Google Password Manager</strong>.
                    </li>
                    <li>
                      Go to <strong className="text-zinc-300">Settings</strong> on the left-side panel.
                    </li>
                    <li>
                      Locate <strong className="text-zinc-300">Export passwords</strong> and click <strong className="text-zinc-300">Download file</strong>.
                    </li>
                    <li>Upload that exported .csv file directly to VaultX above.</li>
                  </ol>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80 text-[10px] text-zinc-500 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Zero-Knowledge Rule</span>
                    </div>
                    <p className="leading-relaxed">
                      VaultX processes and encrypts all credentials locally inside your browser sandbox. Your unencrypted master key never leaves your RAM, and raw CSV files are immediately purged from page memory after saving.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Preview & Settings View (Show when CSV records are parsed and waiting confirmation) */}
          {csvRows.length > 0 && !importProgress && (
            <div className="space-y-5">
              {/* Top File Summary Panel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 truncate max-w-sm">{csvFileName}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Spreadsheet parsed successfully — {csvFileSize} • {csvRows.length} total credentials found
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetCSV}
                  className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Import
                </button>
              </div>

              {/* Interactive Duplicate-Action Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Options Panel: Duplicates Action Selector */}
                <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Duplicate Records Strategy</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Choose what to do when an incoming credential username matches a credential that already exists in your VaultX vault:
                  </p>

                  <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                    <button
                      onClick={() => handleDuplicateActionChange("skip")}
                      className={`p-3 text-left rounded-lg border transition-all relative cursor-pointer ${
                        duplicateAction === "skip"
                          ? "border-indigo-500/70 bg-indigo-500/5 text-white"
                          : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700/80"
                      }`}
                    >
                      <span className="block text-xs font-bold">Skip Duplicates</span>
                      <span className="block text-[9px] text-zinc-500 mt-0.5 leading-normal">Ignore existing entries (recommended)</span>
                      {duplicateAction === "skip" && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleDuplicateActionChange("merge")}
                      className={`p-3 text-left rounded-lg border transition-all relative cursor-pointer ${
                        duplicateAction === "merge"
                          ? "border-indigo-500/70 bg-indigo-500/5 text-white"
                          : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700/80"
                      }`}
                    >
                      <span className="block text-xs font-bold">Merge & Overwrite</span>
                      <span className="block text-[9px] text-zinc-500 mt-0.5 leading-normal">Replace matching password with new data</span>
                      {duplicateAction === "merge" && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => handleDuplicateActionChange("all")}
                      className={`p-3 text-left rounded-lg border transition-all relative cursor-pointer ${
                        duplicateAction === "all"
                          ? "border-indigo-500/70 bg-indigo-500/5 text-white"
                          : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700/80"
                      }`}
                    >
                      <span className="block text-xs font-bold">Import Anyway</span>
                      <span className="block text-[9px] text-zinc-500 mt-0.5 leading-normal">Keep both accounts as separate records</span>
                      {duplicateAction === "all" && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Import Customizations */}
                <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Options</h4>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={importNotes}
                          onChange={(e) => setImportNotes(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        <span>Import website notes</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled={true}
                          className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-indigo-600 opacity-55"
                        />
                        <span>Place in "Logins" category</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleImportCSV}
                    disabled={csvRows.filter((r) => r.selected).length === 0}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Import Selected ({csvRows.filter((r) => r.selected).length} records)
                  </button>
                </div>
              </div>

              {/* CSV Records Preview Grid Table */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Confirm Accounts to Encrypt ({csvRows.filter((r) => r.selected).length} selected)
                  </h4>
                  <button
                    onClick={handleSelectAllToggle}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    {csvRows.every((r) => r.selected) ? "Deselect All" : "Select All Available"}
                  </button>
                </div>

                {/* Table wrapper */}
                <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/20">
                  <div className="max-h-96 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-zinc-950 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={csvRows.length > 0 && csvRows.every((r) => r.selected)}
                              onChange={handleSelectAllToggle}
                              className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0"
                            />
                          </th>
                          <th className="py-2.5 px-4">Account Website</th>
                          <th className="py-2.5 px-4">Username</th>
                          <th className="py-2.5 px-4">Password</th>
                          <th className="py-2.5 px-4 text-right">Security Warning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-xs">
                        {csvRows.map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors hover:bg-zinc-900/40 ${
                              row.selected ? "bg-zinc-950/5" : "bg-black/10 opacity-60"
                            }`}
                          >
                            {/* Checkbox select */}
                            <td className="py-2 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() => handleRowToggle(row.id)}
                                className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Website info */}
                            <td className="py-2 px-4">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-zinc-200 block">{row.name}</span>
                                {row.url && (
                                  <span className="block text-[10px] text-zinc-500 truncate max-w-xs font-mono">
                                    {row.url}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Username */}
                            <td className="py-2 px-4 text-zinc-300 font-mono text-[11px]">
                              {row.username || <span className="text-zinc-600 italic">No username</span>}
                            </td>

                            {/* Password revealed state */}
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                                <span className={revealedPasswords[row.id] ? "text-indigo-300 font-semibold" : ""}>
                                  {revealedPasswords[row.id] ? row.password : "••••••••••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordReveal(row.id)}
                                  className="text-zinc-600 hover:text-zinc-400 transition-colors p-0.5 cursor-pointer"
                                  title={revealedPasswords[row.id] ? "Hide Password" : "Reveal Password"}
                                >
                                  {revealedPasswords[row.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </div>
                            </td>

                            {/* Security checks */}
                            <td className="py-2 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {row.isDuplicate && (
                                  <span className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded bg-yellow-500/5 border border-yellow-500/10 text-yellow-500 text-[9px] font-bold">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Duplicate</span>
                                  </span>
                                )}
                                {row.isWeak && (
                                  <span className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded bg-red-500/5 border border-red-500/10 text-red-500 text-[9px] font-bold">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Weak</span>
                                  </span>
                                )}
                                {!row.isDuplicate && !row.isWeak && (
                                  <span className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Secure</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel 2: JSON Backup Sync */}
      {activeTab === "json" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Panel */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-200">Export Vault</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Export data as a clean JSON spreadsheet. We support two forms depending on your secure storage requirements:
              </p>

              <div className="space-y-2.5 mt-3">
                <div className="p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 text-emerald-400 flex gap-2.5 items-start">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-white">Recommended: Encrypted Export</h4>
                    <p className="text-[10px] text-zinc-400">
                      Exports fully encrypted base64 strings. Safe to save on public drives. Decrypts only inside VaultX using your current password.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-white">Danger: Plaintext Export</h4>
                    <p className="text-[10px] text-zinc-400">
                      Exports all passwords, cards, and usernames in readable format. High risk of leak if stored insecurely.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleExportEncrypted}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export Encrypted (Safe)
              </button>
              <button
                onClick={handleExportDecrypted}
                className="flex-1 py-2 px-3 bg-zinc-900 border border-zinc-800 hover:bg-red-500/20 hover:border-red-500/30 text-zinc-300 hover:text-red-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export Plaintext
              </button>
            </div>
          </div>

          {/* Import Panel */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/40 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-200">Import Vault Records</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Upload a standard VaultX export file (either encrypted or decrypted). The system will automatically parse and migrate records directly into your account:
              </p>

              {/* Drag & Drop Canvas */}
              <div
                onDragEnter={handleDragJSON}
                onDragOver={handleDragJSON}
                onDragLeave={handleDragJSON}
                onDrop={handleDropJSON}
                className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative ${
                  dragActiveJSON
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-zinc-800 bg-zinc-950/20 hover:border-zinc-700"
                }`}
              >
                <input
                  id="import-json-file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleJSONFileChange}
                  className="hidden"
                  disabled={isImporting}
                />
                <label htmlFor="import-json-file-upload" className="cursor-pointer space-y-2 block">
                  <FileUp className="w-8 h-8 text-zinc-500 mx-auto" />
                  <div className="space-y-0.5">
                    <span className="block text-xs font-semibold text-zinc-300">
                      {isImporting ? "Processing archive..." : "Drag and drop or click to upload"}
                    </span>
                    <span className="block text-[10px] text-zinc-500">Supports .json file backups</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Import Output Logs */}
            {importStatus && (
              <div
                className={`mt-4 p-3 rounded-lg border flex gap-2.5 items-start text-xs ${
                  importStatus.success
                    ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400"
                    : "border-red-500/10 bg-red-500/5 text-red-400"
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
