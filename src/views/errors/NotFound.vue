<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="text-center bg-card rounded-lg shadow-md p-8 max-w-md w-full animate-table-row">
      <h1 class="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
      <p class="text-muted-foreground mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="flex gap-4 justify-center">
        <Button
          as-child
          class="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        >
          <router-link to="/dashboard">Back to Dashboard</router-link>
        </Button>
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
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";

const router = useRouter();
</script>

<style scoped></style>
