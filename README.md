# Megatech Photos Cryptography Specification
**Version:** v1.0  
**Last updated:** May 2, 2026  

---

## Overview

Megatech Photos uses end-to-end encryption.

Your data is encrypted on your device before it leaves it, using keys that only you control.

Only encrypted data (ciphertext) is stored on our servers. Decryption is only possible on your device.

This document describes the architecture and cryptographic design used to achieve this.

---

## Architecture

Your data is encrypted locally in your browser using the `Web Crypto API` before upload.

All encryption keys are derived or generated on your device and never leave your device in plain form.

Only encrypted data and encrypted keys are stored on our servers.

<p align="center">
  <img src="https://assets.codepen.io/9358497/architecture_diagram.png" width="450">
</p>

Data flow:

```
Client → Encrypt → Upload ciphertext → Store → Download → Decrypt → Client
```

---

## Cryptographic Primitives

| Purpose          | Algorithm              |
|-----------------|------------------------|
| File encryption | AES-256-GCM            |
| Key derivation  | PBKDF2 (SHA-256)       |
| Randomness      | crypto.getRandomValues |

---

## Key Encryption

### Fundamentals

#### Master Key

When you create an account, your client generates a random 256-bit `AES-GCM` key using `crypto.subtle.generateKey`.

This master key is used to encrypt all your files.

This key never leaves your device unencrypted.

#### Key Derivation (Wrapping Key)

Your password is used to derive a key using `PBKDF2`:

- `PBKDF2` with `SHA-256`  
- 600,000 iterations  
- 32-byte random salt  

This derived key (wrapping key) is used to encrypt your master key.

---

### Flows

#### Primary Device (Registration)

1. Generate master key  
2. Derive wrapping key from password using `crypto.subtle.deriveKey`  
3. Encrypt master key using `crypto.subtle.encrypt`  
4. Upload:
   - Encrypted master key  
   - Salt  
   - IV  

#### Secondary Device (Login)

1. Download encrypted master key  
2. Derive wrapping key again from password  
3. Decrypt master key locally using `crypto.subtle.decrypt`  

If decryption fails, the password is incorrect.

---

### Security Properties

- Only your password can derive the wrapping key  
- Only the wrapping key can decrypt the master key  
- Only the master key can decrypt your files  

---

## File Encryption

### Upload Flow

1. Generate IV using `crypto.getRandomValues`  
2. Read file into memory (`ArrayBuffer`)  
3. Encrypt using `AES-256-GCM` via `crypto.subtle.encrypt`  
4. Upload ciphertext  

### Download Flow

1. Download ciphertext  
2. Restore master key locally  
3. Decrypt using `crypto.subtle.decrypt`  
4. Reconstruct original file  

---

### Security Properties

- Each encryption uses a unique IV  
- `AES-GCM` provides confidentiality and integrity  
- Only your master key can decrypt your files  

---

## Threat Model

This system is designed to protect against:

- Unauthorized access to stored data on our servers  
- Server breaches or database leaks  
- Insider access to stored files  
- Network interception during upload and download  

In all of these cases, attackers only gain access to encrypted data (ciphertext), not usable files.

---

## What This Does NOT Protect Against

End-to-end encryption does not protect against all threats:

- Compromised devices (malware, spyware)  
- Access to an unlocked device  
- Exposure of your password or recovery key  
- Files that have been decrypted and exported  

Security depends on keeping your device and credentials secure.

---

## Password and Recovery Model

- Your password is never stored  
- Your password is never transmitted  
- We cannot reset your encryption  

Recovery is only possible using your recovery key.

Without your password or recovery key, your data cannot be decrypted.

---

## Implementation Details

Megatech Photos uses the browser's native cryptographic APIs:

- `crypto.subtle.generateKey` for key generation  
- `crypto.subtle.deriveKey` for PBKDF2  
- `crypto.subtle.encrypt` and `crypto.subtle.decrypt`  
- `crypto.getRandomValues` for randomness  

All keys, salts, and IVs are generated using secure random values.

---

## Data Ownership and Guarantees

- Only you can decrypt your files  
- We store only encrypted data  
- Encryption happens before upload  

If Megatech Photos shuts down, your encrypted files remain decryptable using your password and recovery key.

---

## In Short

- Files are encrypted locally using `AES-256-GCM`  
- Your password derives a key using `PBKDF2`  
- Your master key encrypts all files  
- Only encrypted data is stored  
- Only your device can decrypt your data  

**Only you can see your files.**

