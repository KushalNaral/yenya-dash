<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="text-center bg-card rounded-lg shadow-md p-8 max-w-md w-full animate-table-row">
      <h1 class="text-6xl font-bold text-destructive mb-4">403</h1>
      <h2 class="text-2xl font-semibold text-foreground mb-4">Access Denied</h2>
      <p class="text-muted-foreground mb-6">
        You don't have permission to access this page. Please contact system administrator
      </p>
      <div class="flex gap-4 justify-center">
        <Button
          as-child
          class="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        >
          <router-link to="/dashboard">Back to Dashboard</router-link>
        </Button>
        <!-- {{ authStore.permissions }} -->
        <Button
          variant="outline"
          class="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
          @click="router.go(-1)"
        >
          Go Back
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const { showErrorToast } = useToast();

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push({ name: "Login" });
    return;
  }

  const fromPath = route.query.from as string | undefined;
  const requiredPermission = route.query.permission as string | undefined;

  if (!fromPath || !requiredPermission) {
    router.push({ name: "Dashboard" });
    return;
  }

  if (authStore.hasPermission(requiredPermission)) {
    router.push(fromPath);
    return;
  } else {
    showErrorToast({
      title: "Access Denied",
      message: "You don't have permission to access this page. Please contact system administrator",
      status: 403,
      duration: 5000,
    });
  }
});
</script>

<style scoped></style>
