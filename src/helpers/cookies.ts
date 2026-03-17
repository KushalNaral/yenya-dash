import type { CookieOptions } from "@/types/cookiesType";
import encryption from "./Encryption";

const defaultOptions: CookieOptions = {
  path: "/",
  secure: false,
};

class Cookies {
  /**
   * Set a cookie
   * @param name - Cookie name
   * @param value - Cookie value
   * @param options - Cookie options
   */
  set<T>(name: string, value: T, options: Partial<CookieOptions> = {}): void {
    const opts = { ...defaultOptions, ...options };
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(stringValue)}`;

    if (opts.expires) {
      cookie += `; expires=${new Date(opts.expires).toUTCString()}`;
    }
    if (opts.path) {
      cookie += `; path=${opts.path}`;
    }
    if (opts.domain) {
      cookie += `; domain=${opts.domain}`;
    }
    if (opts.secure) {
      cookie += "; secure";
    }
    if (opts.sameSite) {
      cookie += `; samesite=${opts.sameSite}`;
    }
    if (opts.httpOnly) {
      cookie += "; httponly";
    }

    document.cookie = cookie;
  }

  /**
   * Set an encrypted cookie
   * @param name - Cookie name
   * @param value - Cookie value
   * @param options - Cookie options
   */
  setEncrypted<T>(name: string, value: T, options: Partial<CookieOptions> = {}): void {
    try {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      const encryptedValue = encryption.encrypt(stringValue);
      this.set(name, encryptedValue, options);
    } catch (error) {
      console.error("Failed to encrypt and set cookie:", error);
      throw new Error("Failed to set encrypted cookie");
    }
  }

  /**
   * Get a cookie value
   * @param name - Cookie name
   * @returns Cookie value or null if not found
   */
  get<T>(name: string): T | null {
    const nameEQ = encodeURIComponent(name) + "=";
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        const value = decodeURIComponent(cookie.substring(nameEQ.length));

        if (value === "") {
          return "" as T;
        }

        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
    }
    return null;
  }

  /**
   * Get and decrypt a cookie value
   * @param name - Cookie name
   * @returns Decrypted cookie value or null if not found
   */
  getEncrypted<T>(name: string): T | null {
    const encryptedValue = this.get<string>(name);
    if (!encryptedValue) {
      return null;
    }

    try {
      const decryptedValue = encryption.decrypt(encryptedValue);

      if (decryptedValue === "") {
        return "" as T;
      }

      try {
        return JSON.parse(decryptedValue) as T;
      } catch {
        return decryptedValue as T;
      }
    } catch (error) {
      console.error("Failed to decrypt cookie:", error);
      this.remove(name);
      return null;
    }
  }

  /**
   * Remove a cookie
   * @param name - Cookie name
   * @param options - Cookie options
   */
  remove(name: string, options: Partial<CookieOptions> = {}): void {
    this.set(name, "", {
      ...options,
      expires: new Date(0),
    });
  }

  /**
   * Check if a cookie exists
   * @param name - Cookie name
   * @returns True if cookie exists
   */
  has(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Get all cookies
   * @returns Object containing all cookies
   */
  getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};

    if (!document.cookie) {
      return cookies;
    }

    document.cookie.split(";").forEach((cookie) => {
      const trimmedCookie = cookie.trim();
      if (!trimmedCookie) return;

      const equalIndex = trimmedCookie.indexOf("=");
      if (equalIndex === -1) return;

      const name = decodeURIComponent(trimmedCookie.substring(0, equalIndex));
      const value = decodeURIComponent(trimmedCookie.substring(equalIndex + 1));

      if (name) {
        cookies[name] = value;
      }
    });

    return cookies;
  }

  /**
   * Clear all cookies (best effort - can only clear cookies with default path)
   * @param options - Options to apply when clearing (mainly for path/domain)
   */
  clearAll(options: CookieOptions = {}): void {
    const allCookies = this.getAll();
    Object.keys(allCookies).forEach((name) => {
      this.remove(name, options);
    });
  }
}

const cookies = new Cookies();

export default cookies;
