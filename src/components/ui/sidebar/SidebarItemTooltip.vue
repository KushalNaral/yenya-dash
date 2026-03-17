<script setup lang="ts">
import { computed } from "vue";
import { useSidebar } from "@/components/ui/sidebar/utils";

const props = withDefaults(
  defineProps<{
    label: string;
    side?: "top" | "right" | "bottom" | "left";
    disabled?: boolean;
  }>(),
  {
    side: "right",
    disabled: false,
  },
);

const { state } = useSidebar();
const isCollapsed = computed(() => state.value === "collapsed");
</script>

<template>
  <template v-if="disabled || !isCollapsed">
    <slot />
  </template>
  <template v-else>
    <TooltipProvider :delay-duration="0">
      <Tooltip>
        <TooltipTrigger as-child>
          <slot />
        </TooltipTrigger>
        <TooltipContent :side="side">{{ label }}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </template>
</template>
