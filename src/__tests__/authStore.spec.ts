// tests/unit/authStore.spec.ts
import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth";
import * as authService from "@/services/authService";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Auth Store", () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAuthStore();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("login calls redirectToKeycloak and redirects window.location.href", async () => {
    const redirectUrl = "http://keycloak-redirect-url";
    vi.spyOn(authService.authService, "redirectToKeycloak").mockResolvedValue(redirectUrl);
    delete (window as any).location;
    (window as any).location = { href: "" };

    await store.login();

    expect(authService.authService.redirectToKeycloak).toHaveBeenCalled();
    expect(window.location.href).toBe(redirectUrl);
  });

  it("handleCallback stores token and user, sets isAuthenticated, and localStorage", async () => {
    const fakeToken = "fake-access-token";
    const fakeUser = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      roles: [],
      permissions: [],
    };

    vi.spyOn(authService.authService, "handleCallback").mockResolvedValue({
      access_token: fakeToken,
      user: fakeUser,
    });

    await store.handleCallback({ code: "123", state: "abc" });

    expect(store.token).toBe(fakeToken);
    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toEqual(fakeUser);
    expect(localStorage.getItem("token")).toBe(fakeToken);
  });

  it("handleCallback fetches user if not provided by callback", async () => {
    const fakeToken = "fake-access-token";
    const fakeUser = {
      id: 2,
      name: "Fetched User",
      email: "fetch@example.com",
    };

    vi.spyOn(authService.authService, "handleCallback").mockResolvedValue({
      access_token: fakeToken,
      user: null,
    });
    vi.spyOn(authService.authService, "getUser").mockResolvedValue(fakeUser);

    await store.handleCallback({ code: "123", state: "abc" });

    expect(store.user).toEqual(fakeUser);
  });

  it("logout resets state, clears localStorage, and redirects", async () => {
    const redirectUrl = "http://keycloak-logout-redirect";
    vi.spyOn(authService.authService, "logout").mockResolvedValue(redirectUrl);
    delete (window as any).location;
    (window as any).location = { href: "" };

    store.user = { id: 1, name: "Test", email: "t@example.com" };
    store.token = "token";
    store.isAuthenticated = true;
    localStorage.setItem("token", "token");

    await store.logout();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(window.location.href).toBe(redirectUrl);
  });

  it("initialize loads token and user if token exists", async () => {
    const fakeUser = { id: 3, name: "Init User", email: "init@example.com" };
    localStorage.setItem("token", "saved-token");

    vi.spyOn(authService.authService, "getUser").mockResolvedValue(fakeUser);

    await store.initialize();

    expect(store.token).toBe("saved-token");
    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toEqual(fakeUser);
  });

  it("initialize handles error fetching user gracefully", async () => {
    localStorage.setItem("token", "saved-token");

    vi.spyOn(authService.authService, "getUser").mockRejectedValue(new Error("Network error"));

    await store.initialize();

    expect(store.token).toBe("saved-token");
    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toBeNull();
  });
});
