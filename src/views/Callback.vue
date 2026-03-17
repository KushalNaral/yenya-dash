<template>
  <div>Loading...</div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  const queryParams = Object.fromEntries(new URLSearchParams(window.location.search)) as Record<
    string,
    string
  >;

  // Basic keycloak usage are of 2 types
  // 1) backend redirected with token: using it directly
  if (queryParams.token) {
    const token = queryParams.token;
    authStore.token = token;
    authStore.isAuthenticated = true;
    localStorage.setItem("token", token);

    try {
      await authStore.initialize();
      router.push({ name: "Home" });
    } catch {
      router.push({ name: "Login" });
    }
    return;
  }

  // 2) SPA got code+state (Keycloak -> frontend). Exchange code+state via XHR to backend:
  if (queryParams.code && queryParams.state) {
    try {
      await authStore.handleCallback(queryParams);
      router.push({ name: "Home" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Callback error:", error.message);
      } else {
        console.error("Callback error:", String(error));
      }
      router.push({ name: "Login" });
    }
    return;
  }

  // nothing useful in query => fallback
  router.push({ name: "Login" });
});
</script>
