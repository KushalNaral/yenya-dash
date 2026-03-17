<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div data-slot="table-container " class="relative w-full overflow-auto minimal-scrollbar-hover">
    <table data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.minimal-scrollbar-hover {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.minimal-scrollbar-hover:hover {
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
}

.minimal-scrollbar-hover::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.minimal-scrollbar-hover::-webkit-scrollbar-track {
  background: transparent;
}

.minimal-scrollbar-hover::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.minimal-scrollbar-hover:hover::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
}

.minimal-scrollbar-hover::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

.minimal-scrollbar-hover::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
