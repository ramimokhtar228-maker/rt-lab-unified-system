/**
 * Security, Privacy, and End-to-End Cryptography Engine
 * Implements client-side AES-GCM 256-bit encryption (Web Crypto API),
 * SHA-256 integrity checksums, HIPAA Safe Harbor de-identification,
 * and GDPR Article 9 healthcare privacy standards.
 */

import { LabReport, Patient } from '../types/lab';

export interface EncryptedVaultPayload {
  version: '2.0-AES-GCM';
  algorithm: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64
  checksumSha256: string; // Hex
  encryptedAt: string;
  reportCount: number;
}

export interface SecurityAuditRecord {
  id: string;
  action: 'ENCRYPT' | 'DECRYPT' | 'DE_IDENTIFY' | 'EXPORT_VAULT' | 'VIEW_SENSITIVE';
  performedAt: string;
  targetPatientName: string;
  targetLabNumber: string;
  operatorUsername: string;
  complianceStandard: 'HIPAA_SAFE_HARBOR' | 'GDPR_ARTICLE_9' | 'ISO_27001';
  details: string;
}

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculates cryptographic SHA-256 integrity hash of any string.
 */
export async function calculateSha256(data: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return bufferToHex(digest);
}

/**
 * Derives AES-GCM key from passphrase using PBKDF2 with SHA-256.
 */
async function deriveKey(passphrase: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary medical data payload using AES-GCM 256-bit.
 */
export async function encryptMedicalData(data: any, passphrase: string): Promise<EncryptedVaultPayload> {
  const jsonString = JSON.stringify(data);
  const checksum = await calculateSha256(jsonString);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for GCM

  const key = await deriveKey(passphrase, salt);
  const encodedData = new TextEncoder().encode(jsonString);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encodedData
  );

  return {
    version: '2.0-AES-GCM',
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: 100000,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
    checksumSha256: checksum,
    encryptedAt: new Date().toISOString(),
    reportCount: Array.isArray(data) ? data.length : 1
  };
}

/**
 * Decrypts AES-GCM encrypted vault payload back to object.
 */
export async function decryptMedicalData(vault: EncryptedVaultPayload, passphrase: string): Promise<any> {
  const salt = new Uint8Array(base64ToBuffer(vault.salt));
  const iv = new Uint8Array(base64ToBuffer(vault.iv));
  const ciphertext = base64ToBuffer(vault.ciphertext);

  const key = await deriveKey(passphrase, salt, vault.iterations || 100000);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );

  const jsonString = new TextDecoder().decode(decryptedBuffer);
  const verifyChecksum = await calculateSha256(jsonString);

  if (vault.checksumSha256 && vault.checksumSha256 !== verifyChecksum) {
    throw new Error('Integrity check failed: Checksum mismatch. Data may have been tampered with.');
  }

  return JSON.parse(jsonString);
}

/**
 * HIPAA Safe Harbor De-identification:
 * Removes direct identifiers to create a privacy-preserved research/sharing dataset.
 */
export function deIdentifyReportForResearch(report: LabReport): LabReport {
  const pseudonym = `PT-${Math.abs(report.patient.fullName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 9000 + 1000}`;

  return {
    ...report,
    patient: {
      ...report.patient,
      fullName: `مريض غير مُعرَّف (${pseudonym})`,
      phone: '010-XXXX-XXXX',
      nationalId: undefined,
      emergencyContact: undefined,
      homeAddress: undefined,
      homeContactPhone: undefined,
      deliveryNotes: undefined,
      loyaltyCardNumber: undefined,
      branchAddress: undefined
    },
    reportNumber: `RESEARCH-${report.id.slice(-6)}`
  };
}
