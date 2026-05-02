const E2EE = (() => {
  function b64Encode(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
  function b64Decode(str) {
    const bin = atob(str);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }
 async function deriveWrappingKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
 
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 600000, 
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"] 
    );
  }
 
  return {
 
    async generateAndWrapMasterKey(password) {
     
      const masterKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
 
      const rawKey = await crypto.subtle.exportKey("raw", masterKey);
 
    
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const wrappingKey = await deriveWrappingKey(password, salt);
 
       const iv = crypto.getRandomValues(new Uint8Array(12));
      const wrappedKey = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        wrappingKey,
        rawKey
      );
 
      return {
        masterKey,
        exported: {
          wrappedKey: b64Encode(wrappedKey),
          salt: b64Encode(salt),
          iv: b64Encode(iv),
        },
      };
    },
 
       async unwrapMasterKey(wrappedKeyB64, saltB64, ivB64, password) {
      const wrappedKey = b64Decode(wrappedKeyB64);
      const salt = b64Decode(saltB64);
      const iv = b64Decode(ivB64);
 
      const wrappingKey = await deriveWrappingKey(password, salt);
 
      const rawKey = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        wrappingKey,
        wrappedKey
      );
 
      return crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "AES-GCM", length: 256 },
        true, 
        ["encrypt", "decrypt"]
      );
    },
 
    async rewrapMasterKey(masterKey, newPassword) {
      const rawKey = await crypto.subtle.exportKey("raw", masterKey);
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const wrappingKey = await deriveWrappingKey(newPassword, salt);
      const iv = crypto.getRandomValues(new Uint8Array(12));
 
      const wrappedKey = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        wrappingKey,
        rawKey
      );
 
      return {
        wrappedKey: b64Encode(wrappedKey),
        salt: b64Encode(salt),
        iv: b64Encode(iv),
      };
    },
 
  async encryptFile(file, masterKey) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintext = await file.arrayBuffer();
 
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        masterKey,
        plaintext
      );
 
      return {
        encryptedBlob: new Blob([ciphertext], {
          type: "application/octet-stream",
        }),
        iv: b64Encode(iv),
        originalName: file.name,
        originalType: file.type,
        originalSize: file.size,
      };
    },
 
      async decryptFile(encryptedData, ivB64, masterKey, mimeType) {
      const iv = b64Decode(ivB64);
 
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        masterKey,
        encryptedData
      );
 
      return new Blob([plaintext], { type: mimeType || "application/octet-stream" });
    },
 

    async encryptThumbnail(thumbnailBlob, masterKey) {
      return this.encryptFile(thumbnailBlob, masterKey);
    },
 
    
    async exportKeyForStorage(masterKey) {
      const raw = await crypto.subtle.exportKey("raw", masterKey);
      return b64Encode(raw);
    },
 
    async importKeyFromStorage(b64Key) {
      const raw = b64Decode(b64Key);
      return crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
    },
  };
})();
 

if (typeof module !== "undefined" && module.exports) {
  module.exports = E2EE;
}
