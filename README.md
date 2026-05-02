# How end-to-end encryption works

**Megatech Photos uses end-to-end encryption.**

Your data is encrypted on your device before it leaves it, using keys that only you control.

Only encrypted data (ciphertext) is stored on our servers. Decryption is only possible on your device.

This document describes the architecture and cryptographic design used to achieve this.

---

## Architecture

Your data is encrypted locally in your browser using the `Web Crypto API` before upload.

All encryption keys are derived or generated on your device and never leave your device in plain form.

Only encrypted data and encrypted keys are stored on our servers.

![E2EE Architecture Diagram](https://assets.codepen.io/9358497/architecture_diagram.png)

---

## Key encryption

### Fundamentals

#### Master key

When you create an account, your client generates a random 256-bit `AES-GCM` key.

This master key is used to encrypt all your files.

This key never leaves your device unencrypted.

#### Key derivation (wrapping key)

Your password is used to derive a key using `PBKDF2`:

- `PBKDF2` with `SHA-256`
- 600,000 iterations
- 32-byte random salt

This derived key (wrapping key) is used to encrypt your master key.

---

### Flows

#### Primary device

- Generate master key via `crypto.subtle.generateKey`
- Derive wrapping key via `crypto.subtle.deriveKey`
- Encrypt master key using `crypto.subtle.encrypt`

#### Secondary device

- Download encrypted master key
- Derive wrapping key again from password
- Decrypt master key locally

---

### Privacy properties

- Only your password can derive the wrapping key  
- Only the wrapping key can decrypt the master key  
- Only the master key can decrypt your files  

---

## File encryption

### Upload flow

- Generate IV via `crypto.getRandomValues`
- Read file into `ArrayBuffer`
- Encrypt using `AES-256-GCM`
- Upload ciphertext

### Download flow

- Download ciphertext
- Restore master key
- Decrypt via `crypto.subtle.decrypt`

---

### Security properties

- Unique IV per file  
- `AES-GCM` provides integrity + confidentiality  
- Only your master key can decrypt data  

---

## Threat model

This system is designed to protect your data against the following threats:

- Unauthorized access to stored data on our servers  
- Server breaches or database leaks  
- Insider access to stored files  
- Network interception during upload/download  

In all of these cases, attackers only gain access to encrypted data (ciphertext), not usable files.

---

## What we do NOT protect against

End-to-end encryption does not protect against all threats.

- If your device is compromised (malware, spyware)  
- If someone gains access to your unlocked device  
- If your password or recovery key is exposed  
- If you decrypt and export files outside the encrypted environment  

Security depends on keeping your device and credentials secure.

---

## Password and recovery model

- Your password is never stored  
- We cannot reset your password  
- Recovery requires your recovery key  

---

## Implementation details

- `crypto.subtle.generateKey` for key generation  
- `crypto.subtle.deriveKey` for PBKDF2  
- `crypto.subtle.encrypt` / `crypto.subtle.decrypt`  
- `crypto.getRandomValues` for randomness  

---

## Data ownership and guarantees

- Only you can decrypt your files  
- We store only encrypted data  
- Encryption happens before upload  

If Megatech Photos shuts down, your encrypted files remain decryptable using your password and recovery key.

---

## In short

- Client-side encryption using `AES-256-GCM`  
- Password-based key derivation using `PBKDF2`  
- Master key encrypts all files  
- Only encrypted data is stored  

**Only you can see your files.**
