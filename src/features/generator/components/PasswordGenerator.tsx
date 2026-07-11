/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";

interface PasswordGeneratorProps {
  onUsePassword?: (password: string) => void;
  inline?: boolean;
}

export default function PasswordGenerator({ onUsePassword, inline = false }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!charset) {
      setPassword("Please select at least one option");
      return;
    }

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    let generated = "";
    for (let i = 0; i < length; i++) {
      generated += charset[array[i] % charset.length];
    }
    
    setPassword(generated);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (!password || password.startsWith("Please")) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Initialize
  if (!password) {
    generatePassword();
  }

  const getStrengthLabel = (pass: string) => {
    if (!pass || pass.startsWith("Please")) return { label: "N/A", color: "bg-zinc-800" };
    if (pass.length < 8) return { label: "Weak", color: "bg-red-500" };
    
    let entropy = 0;
    if (includeUppercase) entropy += 26;
    if (includeLowercase) entropy += 26;
    if (includeNumbers) entropy += 10;
    if (includeSymbols) entropy += 24;
    
    const strength = pass.length * Math.log2(entropy || 1);
    
    if (strength < 50) return { label: "Weak", color: "bg-red-500" };
    if (strength < 80) return { label: "Moderate", color: "bg-yellow-500" };
    return { label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getStrengthLabel(password);

  return (
    <div className={`p-5 rounded-xl border border-zinc-800 bg-zinc-950/60 ${inline ? "" : "max-w-md w-full"}`}>
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Cryptographic Password Generator</h3>
      
      {/* Password Output Area */}
      <div className="flex items-center justify-between gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg mb-4 font-mono text-zinc-100 text-sm overflow-x-auto break-all relative">
        <span className="select-all">{password}</span>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <button
            onClick={generatePassword}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Copy"
          >
            {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      {/* Strength Indicator */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1 text-xs text-zinc-400">
          <span>Entropy Strength</span>
          <span className="font-semibold text-zinc-300">{strength.label}</span>
        </div>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{
              width: password.startsWith("Please")
                ? "0%"
                : `${Math.min(100, (length / 24) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Length Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2 text-xs text-zinc-400">
          <span>Password Length</span>
          <span className="font-mono text-indigo-400 font-bold">{length} characters</span>
        </div>
        <input
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={(e) => {
            setLength(parseInt(e.target.value));
            setPassword(""); // forces re-generate
          }}
          className="w-full accent-indigo-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Option Toggles */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeUppercase}
            onChange={(e) => {
              setIncludeUppercase(e.target.checked);
              setPassword("");
            }}
            className="rounded border-zinc-800 text-indigo-600 bg-zinc-900 focus:ring-0 focus:ring-offset-0"
          />
          <span>A-Z (Uppercase)</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeLowercase}
            onChange={(e) => {
              setIncludeLowercase(e.target.checked);
              setPassword("");
            }}
            className="rounded border-zinc-800 text-indigo-600 bg-zinc-900 focus:ring-0 focus:ring-offset-0"
          />
          <span>a-z (Lowercase)</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => {
              setIncludeNumbers(e.target.checked);
              setPassword("");
            }}
            className="rounded border-zinc-800 text-indigo-600 bg-zinc-900 focus:ring-0 focus:ring-offset-0"
          />
          <span>0-9 (Numbers)</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeSymbols}
            onChange={(e) => {
              setIncludeSymbols(e.target.checked);
              setPassword("");
            }}
            className="rounded border-zinc-800 text-indigo-600 bg-zinc-900 focus:ring-0 focus:ring-offset-0"
          />
          <span>!@#$% (Symbols)</span>
        </label>
      </div>

      {onUsePassword && (
        <button
          onClick={() => onUsePassword(password)}
          disabled={password.startsWith("Please")}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
        >
          Insert Secure Password
        </button>
      )}
    </div>
  );
}
