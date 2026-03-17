<template>
  <SidebarProvider>
    <div
      class="flex min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100"
    >
      <!-- Sidebar -->
      <AppSidebar
        class="flex-shrink-0 h-screen overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
      />

      <!-- Main Content -->
      <div class="flex flex-1 flex-col h-screen overflow-hidden">
        <Header />
        <!-- Main Content Area -->
        <main
          class="flex-1 overflow-y-auto p-2 sm:p-4 bg-white dark:bg-gray-800 shadow transition-opacity duration-300 animate-fade-in"
        >
          <router-view />
        </main>

        <!-- Footer -->
        <footer
          class="p-2 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-t from-gray-50 to-white dark:from-gray-800 dark:to-gray-700"
        >
          YenyaSoft © {{ new Date().getFullYear() }}
          <span>Content Management System</span>
        </footer>
      </div>
    </div>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar.vue";
import Header from "@/components/Header.vue";
</script>

<style>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-left {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-down {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s ease-in-out;
}

.animate-slide-in-down {
  animation: slide-in-down 0.3s ease-in-out;
}
</style>
```
