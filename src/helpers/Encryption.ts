import type { EncryptionConfig } from "@/types/encryptionConfig";
import CryptoJS from "crypto-js";

class Encryption {
  private readonly config: EncryptionConfig;

  constructor() {
    // The key should be the same as Laravel's APP_KEY
    this.config = {
      key: import.meta.env.VITE_API_APP_KEY ?? "",
      cipher: "AES-256-CBC",
    };
  }

  /**
   * Encrypt a value
   * @param value - The value to encrypt
   * @returns The encrypted value
   */
  encrypt(value: string): string {
    try {
      const key = this.getKey();
      const iv = CryptoJS.lib.WordArray.random(16);

      const encrypted = CryptoJS.AES.encrypt(value, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const combined = iv.concat(encrypted.ciphertext);

      return combined.toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Encryption failed");
    }
  }

  /**
   * Decrypt a value
   * @param value - The value to decrypt
   * @returns The decrypted value
   */
  decrypt(value: string): string {
    try {
      const key = this.getKey();
      const combined = CryptoJS.enc.Base64.parse(value);

      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));

      const decrypted = CryptoJS.AES.decrypt(ciphertext.toString(CryptoJS.enc.Base64), key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const result = decrypted.toString(CryptoJS.enc.Utf8);

      if (!result) {
        throw new Error("Decryption produced empty result");
      }

      return result;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Decryption failed");
    }
  }

  /**
   * Get the encryption key, handling Laravel's base64: prefix
   * @returns The encryption key
   */
  private getKey(): CryptoJS.lib.WordArray {
    if (!this.config.key) {
      throw new Error("Encryption key is not set");
    }

    let keyString = this.config.key;

    // Handle Laravel's base64: prefix
    if (keyString.startsWith("base64:")) {
      keyString = keyString.substring(7); // Remove 'base64:' prefix
      return CryptoJS.enc.Base64.parse(keyString);
    }

    // If no base64: prefix, treat as raw string and convert to base64
    // This is for backward compatibility or custom key formats
    return CryptoJS.enc.Utf8.parse(keyString);
  }

  /**
   * Validate that the key is properly formatted
   * @returns True if key is valid
   */
  validateKey(): boolean {
    try {
      const key = this.getKey();

      // AES-256 requires a 32-byte (256-bit) key
      return key.sigBytes === 32;
    } catch (error) {
      console.error("Key validation failed:", error);
      return false;
    }
  }
}

const encryption = new Encryption();

export default encryption;
