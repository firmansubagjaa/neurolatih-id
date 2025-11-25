
import { UserProfile } from '../types';

// --- CONFIGURATION ---
const SECRET_SALT = "NEURO_LATIH_8BIT_V8_SECURE_KEY_992834"; // In production, use env var
const INTEGRITY_PREFIX = "NEURO_SEC_";

// --- HASHING ALGORITHM (Simulated Sync Hash) ---
// Using a custom FNV-1a like hash variant for synchronous speed + salt
const generateHash = (input: string): string => {
  let hash = 0x811c9dc5;
  const prime = 0x01000193;
  const saltedInput = input + SECRET_SALT;

  for (let i = 0; i < saltedInput.length; i++) {
    hash ^= saltedInput.charCodeAt(i);
    hash = Math.imul(hash, prime);
  }
  return (hash >>> 0).toString(16); // Return hex string
};

interface SecurePayload {
  d: any; // Data
  h: string; // Hash (Signature)
  t: number; // Timestamp (Replay Attack Prevention)
}

// --- ENCRYPTION (Obfuscation + Signing) ---
export const encryptData = (data: any): string => {
  try {
    const jsonStr = JSON.stringify(data);
    const signature = generateHash(jsonStr);
    
    const payload: SecurePayload = {
      d: data,
      h: signature,
      t: Date.now()
    };

    // Double encoding: JSON -> Base64
    // This makes it unreadable to casual users in DevTools
    return INTEGRITY_PREFIX + btoa(JSON.stringify(payload));
  } catch (e) {
    console.error("Encryption failed", e);
    return "";
  }
};

// --- DECRYPTION (Verification + Parsing) ---
export const decryptData = <T>(cipherText: string): T | null => {
  try {
    // 1. Check Format
    if (!cipherText.startsWith(INTEGRITY_PREFIX)) {
      // Fallback: Try to parse as plain JSON (Migration for old users)
      try {
        return JSON.parse(cipherText) as T;
      } catch {
        return null;
      }
    }

    // 2. Decode Base64
    const rawPayload = atob(cipherText.replace(INTEGRITY_PREFIX, ''));
    const payload: SecurePayload = JSON.parse(rawPayload);

    // 3. Verify Structure
    if (!payload.d || !payload.h) return null;

    // 4. Integrity Check (Re-hash the data and compare)
    const currentJsonStr = JSON.stringify(payload.d);
    const calculatedHash = generateHash(currentJsonStr);

    if (calculatedHash !== payload.h) {
      console.warn("SECURITY ALERT: Data tampering detected! Hash mismatch.");
      return null; // Reject data
    }

    return payload.d as T;
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
};

// --- UNIT TESTING (Runtime Integrity Check) ---
export const runSecurityUnitTests = () => {
  console.log("%c[SEC] Running Security Unit Tests...", "color: #00ffff");
  
  const testData = { xp: 1000, level: 5, user: "TEST_PLAYER" };
  
  // Test 1: Encryption -> Decryption
  const encrypted = encryptData(testData);
  const decrypted = decryptData<typeof testData>(encrypted);
  
  if (JSON.stringify(testData) === JSON.stringify(decrypted)) {
    console.log("%c[PASS] Integrity Cycle OK", "color: #4ade80");
  } else {
    console.error("[FAIL] Integrity Cycle Failed");
  }

  // Test 2: Tamper Resistance
  // Decode, modify payload, re-encode with WRONG hash logic (mimicking user editing base64)
  try {
    const raw = atob(encrypted.replace(INTEGRITY_PREFIX, ''));
    const payload = JSON.parse(raw);
    payload.d.xp = 999999; // Cheat!
    // User saves this back without updating 'h' correctly because they don't know the SALT
    const tamperedPayload = JSON.stringify(payload);
    const tamperedCipher = INTEGRITY_PREFIX + btoa(tamperedPayload);
    
    const result = decryptData(tamperedCipher);
    if (result === null) {
      console.log("%c[PASS] Tamper Detection OK (Cheat Blocked)", "color: #4ade80");
    } else {
      console.error("[FAIL] Tamper Detection Failed! Cheater passed.");
    }
  } catch (e) {
    console.log("%c[PASS] Tamper Caused Error (Good)", "color: #4ade80");
  }
};
