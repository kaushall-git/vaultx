/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand";
import {
  EncryptedVaultItem,
  DecryptedVaultItem,
  UserSession,
  AuditLog,
  VaultCategory,
} from "./types.js";
import {
  deriveKeys,
  encryptData,
  decryptData,
  generateRandomSalt,
  generateAsymmetricKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  encryptAsymmetric,
  decryptAsymmetric,
  importSymmetricKey,
} from "./lib/crypto.js";

interface VaultState {
  token: string | null;
  user: UserSession["user"] | null;
  vaultKey: CryptoKey | null;
  encryptedItems: EncryptedVaultItem[];
  decryptedItems: DecryptedVaultItem[];
  auditLogs: AuditLog[];
  selectedItemId: string | null;
  currentCategory: VaultCategory | "all" | "favorites" | "audit" | "activity" | "settings" | "shared-received" | "shared-sent";
  searchQuery: string;
  isLocked: boolean;
  isAuthenticating: boolean;
  error: string | null;

  // Sharing State
  asymmetricPrivateKey: CryptoKey | null;
  sharedByMe: any[];
  sharedLinks: any[];
  sharedWithMe: DecryptedVaultItem[];
  pendingReceivedShares: any[];

  // Actions
  initializeSession: () => Promise<void>;
  signup: (email: string, masterPassword: string) => Promise<boolean>;
  login: (email: string, masterPassword: string) => Promise<boolean>;
  unlock: (masterPassword: string) => Promise<boolean>;
  logout: () => void;
  lockSession: () => void;
  fetchItems: () => Promise<void>;
  createItem: (
    category: VaultCategory,
    title: string,
    details: any,
    isFavorite?: boolean
  ) => Promise<boolean>;
  updateItem: (
    id: string,
    title: string,
    details: any,
    isFavorite?: boolean
  ) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  fetchAuditLogs: () => Promise<void>;
  clearError: () => void;
  setCurrentCategory: (
    category: VaultCategory | "all" | "favorites" | "audit" | "activity" | "settings" | "shared-received" | "shared-sent"
  ) => void;
  setSearchQuery: (query: string) => void;
  setSelectedItemId: (id: string | null) => void;

  // Sharing Actions
  initializeAsymmetricKeys: (vaultKey: CryptoKey) => Promise<void>;
  shareByEmail: (
    vaultItemId: string,
    recipientEmail: string,
    permission: "view" | "copy" | "edit",
    expiresAt?: string | null
  ) => Promise<boolean>;
  generateShareLink: (
    vaultItemId: string,
    expiresAt: string,
    viewLimit: number,
    passwordProtected: boolean,
    password?: string
  ) => Promise<string | null>;
  fetchSharedItems: () => Promise<void>;
  acceptShare: (shareId: string) => Promise<boolean>;
  revokeShare: (shareId: string) => Promise<boolean>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  token: localStorage.getItem("vaultx_token"),
  user: localStorage.getItem("vaultx_user")
    ? JSON.parse(localStorage.getItem("vaultx_user")!)
    : null,
  vaultKey: null,
  encryptedItems: [],
  decryptedItems: [],
  auditLogs: [],
  selectedItemId: null,
  currentCategory: "all",
  searchQuery: "",
  isLocked: false,
  isAuthenticating: false,
  error: null,

  // Sharing State
  asymmetricPrivateKey: null,
  sharedByMe: [],
  sharedLinks: [],
  sharedWithMe: [],
  pendingReceivedShares: [],

  initializeSession: async () => {
    const { token, user } = get();
    if (token && user) {
      // If we have token and user, we are logged in but session is locked (since vaultKey is not persisted in localStorage)
      set({ isLocked: true });
    }
  },

  clearError: () => set({ error: null }),
  setCurrentCategory: (category) => set({ currentCategory: category, selectedItemId: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),

  signup: async (email, masterPassword) => {
    set({ isAuthenticating: true, error: null });
    try {
      // Generate client-side salts
      const authSalt = generateRandomSalt(16);
      const vaultSalt = generateRandomSalt(16);

      // Derive keys
      const { authKeyHex, vaultKey } = await deriveKeys(
        masterPassword,
        email,
        authSalt,
        vaultSalt
      );

      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          authSalt,
          vaultSalt,
          authHash: authKeyHex,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("vaultx_token", data.token);
      localStorage.setItem("vaultx_user", JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        vaultKey,
        isLocked: false,
        isAuthenticating: false,
      });

      await get().initializeAsymmetricKeys(vaultKey);
      await get().fetchSharedItems();

      return true;
    } catch (err: any) {
      set({ error: err.message, isAuthenticating: false });
      return false;
    }
  },

  login: async (email, masterPassword) => {
    set({ isAuthenticating: true, error: null });
    try {
      // 1. Fetch salts for this user
      const saltRes = await fetch("/api/v1/auth/salts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const saltData = await saltRes.json();
      if (!saltRes.ok) {
        throw new Error(saltData.error || "Failed to retrieve account salts");
      }

      const { authSalt, vaultSalt } = saltData;

      // 2. Derive keys
      const { authKeyHex, vaultKey } = await deriveKeys(
        masterPassword,
        email,
        authSalt,
        vaultSalt
      );

      // 3. Login
      const loginRes = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          authHash: authKeyHex,
        }),
      });

      const data = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("vaultx_token", data.token);
      localStorage.setItem("vaultx_user", JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        vaultKey,
        isLocked: false,
        isAuthenticating: false,
      });

      // Fetch vault items immediately
      await get().fetchItems();
      await get().initializeAsymmetricKeys(vaultKey);
      await get().fetchSharedItems();

      return true;
    } catch (err: any) {
      set({ error: err.message, isAuthenticating: false });
      return false;
    }
  },

  unlock: async (masterPassword) => {
    const { user } = get();
    if (!user) return false;

    set({ isAuthenticating: true, error: null });
    try {
      const { authKeyHex, vaultKey } = await deriveKeys(
        masterPassword,
        user.email,
        user.authSalt,
        user.vaultSalt
      );

      // Verify master password locally by validating with the server
      const loginRes = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          authHash: authKeyHex,
        }),
      });

      const data = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error("Incorrect master password");
      }

      // Update token in case it expired or renewed
      localStorage.setItem("vaultx_token", data.token);

      set({
        token: data.token,
        vaultKey,
        isLocked: false,
        isAuthenticating: false,
      });

      // Fetch items
      await get().fetchItems();
      await get().initializeAsymmetricKeys(vaultKey);
      await get().fetchSharedItems();

      return true;
    } catch (err: any) {
      set({ error: err.message, isAuthenticating: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("vaultx_token");
    localStorage.removeItem("vaultx_user");
    set({
      token: null,
      user: null,
      vaultKey: null,
      encryptedItems: [],
      decryptedItems: [],
      auditLogs: [],
      selectedItemId: null,
      currentCategory: "all",
      isLocked: false,
      error: null,
      asymmetricPrivateKey: null,
      sharedByMe: [],
      sharedLinks: [],
      sharedWithMe: [],
      pendingReceivedShares: [],
    });
  },

  lockSession: () => {
    // Clear decrypted items and key from memory
    set({
      vaultKey: null,
      decryptedItems: [],
      isLocked: true,
      selectedItemId: null,
      asymmetricPrivateKey: null,
      sharedWithMe: [],
    });
  },

  fetchItems: async () => {
    const { token, vaultKey } = get();
    if (!token || !vaultKey) return;

    try {
      const res = await fetch("/api/v1/vault", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch items");

      const encryptedItems: EncryptedVaultItem[] = await res.json();

      // Decrypt items on the fly
      const decryptedItems: DecryptedVaultItem[] = [];
      for (const item of encryptedItems) {
        try {
          const title = await decryptData(item.encryptedTitle, vaultKey);
          const payloadStr = await decryptData(item.encryptedPayload, vaultKey);
          const details = JSON.parse(payloadStr);

          decryptedItems.push({
            id: item.id,
            category: item.category,
            title,
            isFavorite: item.isFavorite,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            details,
          });
        } catch (decryptErr) {
          console.error("Failed to decrypt item:", item.id, decryptErr);
          // Keep item in UI as locked/undecryptable rather than breaking
        }
      }

      set({ encryptedItems, decryptedItems });
    } catch (err: any) {
      console.error("Fetch items error:", err);
      set({ error: "Failed to load and decrypt vault items" });
    }
  },

  createItem: async (category, title, details, isFavorite = false) => {
    const { token, vaultKey } = get();
    if (!token || !vaultKey) return false;

    try {
      const encryptedTitle = await encryptData(title, vaultKey);
      const encryptedPayload = await encryptData(JSON.stringify(details), vaultKey);

      const res = await fetch("/api/v1/vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          encryptedTitle,
          encryptedPayload,
          isFavorite,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create item");

      // Reload all items to stay in perfect sync and verify key derivation
      await get().fetchItems();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  updateItem: async (id, title, details, isFavorite) => {
    const { token, vaultKey, sharedWithMe, asymmetricPrivateKey } = get();
    if (!token) return false;

    try {
      // Check if this is a received shared item
      const sharedItem = sharedWithMe.find((item) => item.id === id);
      if (sharedItem) {
        // Fetch current received shares to get the raw encryptedShareKey
        const resReceived = await fetch("/api/v1/share/received", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const receivedItems = await resReceived.json();
        const rawSharedRecord = Array.isArray(receivedItems)
          ? receivedItems.find((item: any) => item.id === id)
          : null;
        if (!rawSharedRecord) {
          throw new Error("Shared item record not found on server");
        }

        if (!asymmetricPrivateKey) {
          throw new Error("Asymmetric sharing module is not initialized");
        }

        // Decrypt the share key to re-encrypt updated payload
        const shareKeyHex = await decryptAsymmetric(rawSharedRecord.encryptedShareKey, asymmetricPrivateKey);
        const shareKey = await importSymmetricKey(shareKeyHex);

        const encryptedTitle = await encryptData(title, shareKey);
        const encryptedPayload = await encryptData(JSON.stringify(details), shareKey);

        const res = await fetch(`/api/v1/share/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            encryptedTitle,
            encryptedPayload,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update shared item");

        await get().fetchSharedItems();
        return true;
      }

      // Otherwise, update regular vault item
      if (!vaultKey) return false;
      const encryptedTitle = await encryptData(title, vaultKey);
      const encryptedPayload = await encryptData(JSON.stringify(details), vaultKey);

      const res = await fetch(`/api/v1/vault/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          encryptedTitle,
          encryptedPayload,
          isFavorite,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update item");

      await get().fetchItems();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  deleteItem: async (id) => {
    const { token, sharedWithMe } = get();
    if (!token) return false;

    try {
      const isShared = sharedWithMe.some((item) => item.id === id);
      if (isShared) {
        // Leaving/revoking a received shared item
        return await get().revokeShare(id);
      }

      const res = await fetch(`/api/v1/vault/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");

      set((state) => ({
        decryptedItems: state.decryptedItems.filter((item) => item.id !== id),
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
      }));

      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  fetchAuditLogs: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const res = await fetch("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch audit logs");

      const logs = await res.json();
      set({ auditLogs: logs });
    } catch (err: any) {
      console.error("Fetch audit logs error:", err);
    }
  },

  initializeAsymmetricKeys: async (vaultKey) => {
    const { token, user } = get();
    if (!token || !user) return;

    try {
      if (user.publicKey && user.encryptedPrivateKey) {
        // We already have keys! Decrypt private key
        const privateKeyJwkStr = await decryptData(user.encryptedPrivateKey, vaultKey);
        const privateKey = await importPrivateKey(privateKeyJwkStr);
        set({ asymmetricPrivateKey: privateKey });
      } else {
        // No keys exist yet! Generate a new keypair
        const keyPair = await generateAsymmetricKeyPair();
        const publicKeyJwkStr = await exportPublicKey(keyPair.publicKey);
        const privateKeyJwkStr = await exportPrivateKey(keyPair.privateKey);

        // Encrypt private key with symmetric vaultKey
        const encryptedPrivateKey = await encryptData(privateKeyJwkStr, vaultKey);

        // Save on server
        const res = await fetch("/api/v1/auth/keypair", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            publicKey: publicKeyJwkStr,
            encryptedPrivateKey,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save sharing keys to server");
        }

        // Update local user state
        const updatedUser = {
          ...user,
          publicKey: publicKeyJwkStr,
          encryptedPrivateKey,
        };
        localStorage.setItem("vaultx_user", JSON.stringify(updatedUser));
        set({
          user: updatedUser,
          asymmetricPrivateKey: keyPair.privateKey,
        });
      }
    } catch (err: any) {
      console.error("Failed to initialize asymmetric sharing keys:", err);
      set({ error: "Failed to initialize secure sharing module" });
    }
  },

  shareByEmail: async (vaultItemId, recipientEmail, permission, expiresAt = null) => {
    const { token, decryptedItems } = get();
    if (!token) return false;

    try {
      // 1. Get public key of recipient
      const keyRes = await fetch(`/api/v1/auth/public-key/${encodeURIComponent(recipientEmail)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const keyData = await keyRes.json();
      if (!keyRes.ok) {
        throw new Error(keyData.error || "Failed to find recipient's secure sharing key");
      }

      // 2. Find local decrypted item
      const item = decryptedItems.find((i) => i.id === vaultItemId);
      if (!item) {
        throw new Error("Local vault item details not found");
      }

      // 3. Generate symmetric ShareKey
      const shareKeyHex = generateRandomSalt(32);
      const shareKey = await importSymmetricKey(shareKeyHex);

      // 4. Encrypt title and payload with ShareKey
      const encryptedTitle = await encryptData(item.title, shareKey);
      const encryptedPayload = await encryptData(JSON.stringify(item.details), shareKey);

      // 5. Encrypt ShareKey with recipient's public key
      const recipientPubKey = await importPublicKey(keyData.publicKey);
      const encryptedShareKey = await encryptAsymmetric(shareKeyHex, recipientPubKey);

      // 6. Send to server
      const res = await fetch("/api/v1/share/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vaultItemId,
          recipientEmail,
          permission,
          encryptedTitle,
          encryptedPayload,
          encryptedShareKey,
          expiresAt,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to send secure share");
      }

      // Refresh sharing state
      await get().fetchSharedItems();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  generateShareLink: async (vaultItemId, expiresAt, viewLimit, passwordProtected, password) => {
    const { token, decryptedItems } = get();
    if (!token) return null;

    try {
      // 1. Find local decrypted item
      const item = decryptedItems.find((i) => i.id === vaultItemId);
      if (!item) {
        throw new Error("Local vault item details not found");
      }

      // 2. Generate symmetric ShareKey
      const shareKeyHex = generateRandomSalt(32);
      const shareKey = await importSymmetricKey(shareKeyHex);

      // 3. Encrypt title and payload with ShareKey
      const encryptedTitle = await encryptData(item.title, shareKey);
      const encryptedPayload = await encryptData(JSON.stringify(item.details), shareKey);

      // 4. Handle password protection
      let passwordHash: string | undefined = undefined;
      if (passwordProtected && password) {
        // Hash password simple SHA-256 for checking on server if required
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
        passwordHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      // 5. Send to server
      const res = await fetch("/api/v1/share/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vaultItemId,
          encryptedTitle,
          encryptedPayload,
          expiresAt,
          viewLimit,
          passwordProtected,
          passwordHash,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to generate secure link");
      }

      // Refresh state
      await get().fetchSharedItems();

      // Return complete secure link including shareKey in hash fragment!
      return `${window.location.origin}/share/link/${resData.token}#${shareKeyHex}`;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  fetchSharedItems: async () => {
    const { token, asymmetricPrivateKey } = get();
    if (!token) return;

    try {
      // 1. Fetch received shares
      const resReceived = await fetch("/api/v1/share/received", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receivedItems = await resReceived.json();

      // 2. Fetch my shared items (sent and links)
      const resMyShared = await fetch("/api/v1/share/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mySharedData = await resMyShared.json();

      // Decrypt received shares that are accepted
      const decryptedWithMe: DecryptedVaultItem[] = [];
      const pendingReceivedShares: any[] = [];

      if (Array.isArray(receivedItems)) {
        for (const item of receivedItems) {
          if (item.status === "accepted") {
            try {
              if (!asymmetricPrivateKey) continue;
              // Decrypt the shareKey using our asymmetric private key
              const shareKeyHex = await decryptAsymmetric(item.encryptedShareKey, asymmetricPrivateKey);
              const shareKey = await importSymmetricKey(shareKeyHex);

              const title = await decryptData(item.encryptedTitle, shareKey);
              const payloadStr = await decryptData(item.encryptedPayload, shareKey);
              const details = JSON.parse(payloadStr);

              decryptedWithMe.push({
                id: item.id, // we use the share ID as item ID
                category: "login",
                title,
                isFavorite: false,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                details,
                shareInfo: {
                  id: item.id,
                  ownerEmail: item.ownerEmail,
                  permission: item.permission,
                  status: item.status,
                },
              } as any);
            } catch (decryptErr) {
              console.error("Failed to decrypt received share:", item.id, decryptErr);
            }
          } else if (item.status === "pending") {
            pendingReceivedShares.push(item);
          }
        }
      }

      set({
        sharedWithMe: decryptedWithMe,
        pendingReceivedShares,
        sharedByMe: mySharedData.sharedByMe || [],
        sharedLinks: mySharedData.sharedLinks || [],
      });
    } catch (err: any) {
      console.error("Failed to fetch shared items:", err);
    }
  },

  acceptShare: async (shareId) => {
    const { token } = get();
    if (!token) return false;

    try {
      const res = await fetch(`/api/v1/share/${shareId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept share invitation");
      }

      await get().fetchSharedItems();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  revokeShare: async (shareId) => {
    const { token } = get();
    if (!token) return false;

    try {
      const res = await fetch("/api/v1/share/revoke", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: shareId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke share");
      }

      await get().fetchSharedItems();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },
}));
