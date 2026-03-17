<template>
  <header
    class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 px-6 sm:px-8 shadow-md backdrop-blur-lg animate-slide-in-down"
    role="banner"
  >
    <div class="flex flex-row gap-1">
      <SidebarTrigger
        class="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors duration-200"
        aria-label="Toggle sidebar"
      >
      </SidebarTrigger>
      <h1 class="text-2xl font-bold tracking-tight text-primary">
        YenyaSoft Dashboard
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400"></p>
    </div>

    <div v-if="authStore.isAuthenticated" class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        class="relative text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
        aria-label="Notifications"
      >
        <Iconify icon="lucide:bell" class="size-5" />
        <span
          v-if="unreadNotifications > 0"
          class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center"
        >
          {{ unreadNotifications }}
        </span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        @click="toggleTheme"
        class="text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
        aria-label="Toggle theme"
      >
        <Iconify :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="size-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            class="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-white text-sm font-medium shadow-sm"
              :title="authStore.user?.username"
            >
              {{ authStore.user?.username?.charAt(0)?.toUpperCase() || "U" }}
            </div>
            <span
              class="hidden sm:block text-sm font-medium truncate max-w-[120px]"
            >
              {{ authStore.user?.username }}
            </span>
            <Iconify icon="lucide:chevron-down" class="size-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-56 p-2">
          <div class="flex flex-col space-y-1 p-2">
            <p class="text-sm font-medium">{{ authStore.user?.username }}</p>
            <p class="text-xs text-muted-foreground">
              {{ authStore.user?.email }}
            </p>
          </div>

          <DropdownMenuSeparator />

          <div
            v-if="authStore.user?.roles?.length"
            class="flex flex-wrap gap-1 p-2"
          >
            <Badge
              v-for="role in authStore.user?.roles"
              :key="role"
              variant="outline"
              class="text-xs whitespace-nowrap"
            >
              {{ role }}
            </Badge>
          </div>

          <DropdownMenuSeparator v-if="authStore.user?.roles?.length" />

          <DropdownMenuItem class="cursor-pointer">
            <Iconify icon="lucide:user" class="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem class="cursor-pointer">
            <Iconify icon="lucide:settings" class="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            @click="logout"
            class="cursor-pointer text-destructive focus:text-destructive"
          >
            <Iconify icon="lucide:log-out" class="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const isDark = ref(document.documentElement.classList.contains("dark"));
const unreadNotifications = ref(3); // Placeholder for notification count

async function logout() {
  try {
    await authStore.logout();
    router.push({ name: "Login" });
  } catch (error) {
    console.error(
      "Logout failed:",
      error instanceof Error ? error.message : String(error),
    );
    router.push({ name: "Login" });
  }
}

function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark");
}
</script>
