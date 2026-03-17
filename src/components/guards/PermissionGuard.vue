<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

const props = withDefaults(
  defineProps<{
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
  }>(),
  {
    requireAll: false,
  },
);

const authStore = useAuthStore();

const hasAccess = computed(() => {
  if (props.permission) {
    return authStore.hasPermission(props.permission);
  }

  if (props.permissions && props.permissions.length > 0) {
    if (props.requireAll) {
      return authStore.hasAllPermissions(props.permissions);
    }
    return authStore.hasAnyPermission(props.permissions);
  }

  return true;
});
</script>

<template>
  <div v-if="hasAccess">
    <slot />
  </div>
</template>
