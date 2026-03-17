<script setup lang="ts">
import type { CrsCase } from "@/types/crs/crsCase";
import { computed } from "vue";

import { getCrsSourceLabel } from "@/constants";

const props = defineProps<{
  value?: number | string;
  row?: { original: CrsCase };
  column?: {
    sourceMap?: Record<number | string, string>;
  };
}>();

const label = computed(() => {
  if (props.value === undefined || props.value === null) return "-";
  return getCrsSourceLabel(props.value);
});
</script>

<template>
  <span class="font-medium text-foreground">
    {{ label }}
  </span>
</template>
