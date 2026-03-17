<template>
  <TooltipProvider :delay-duration="delayDuration">
    <Tooltip>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipContent :side="side" class="max-w-xs">
        <div v-if="message">
          {{ message }}
        </div>
        <template v-else>
          <div v-if="items.length === 0">
            {{ emptyMessage }}
          </div>
          <div v-else-if="items.length === 1">
            {{ singleItemMessage }}
          </div>
          <div v-else>
            <div v-if="title" class="font-semibold mb-1">{{ title }}</div>
            <ul class="list-disc list-inside space-y-1">
              <li
                v-for="(item, index) in items"
                :key="getItemKey(item, index)"
                :class="itemClass"
              >
                <slot name="item" :item="item" :index="index">
                  {{ formatItem(item) }}
                </slot>
              </li>
            </ul>
            <div v-if="footerMessage" class="text-xs text-white/80 mt-2">
              {{ footerMessage }}
            </div>
          </div>
        </template>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
  items?: any[];
  emptyMessage?: string;
  singleItemMessage?: string;
  title?: string;
  footerMessage?: string;
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  itemClass?: string;
  formatItem?: (item: any) => string;
  getItemKey?: (item: any, index: number) => string | number;
}

withDefaults(defineProps<Props>(), {
  message: undefined,
  items: () => [],
  emptyMessage: "Click to assign",
  singleItemMessage: "Click to edit",
  title: "",
  footerMessage: "Click to edit",
  delayDuration: 0,
  side: "top",
  itemClass: "capitalize",
  formatItem: (item: any) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      return item.label || item.name || item.title || String(item);
    }
    return String(item);
  },
  getItemKey: (item: any, index: number) => {
    if (typeof item === "object" && item !== null && item.id !== undefined) {
      return item.id;
    }
    if (typeof item === "object" && item !== null && item.key !== undefined) {
      return item.key;
    }
    return index;
  },
});
</script>
