<script setup lang="ts">
import GlobalLoader from "@/components/GlobalLoader.vue";
import { Toaster } from "@/components/ui/sonner";
import "vue-sonner/style.css";
</script>

<template>
  <Toaster position="top-right" rich-colors close-button />
  <GlobalLoader />
  <RouterView />
</template>
