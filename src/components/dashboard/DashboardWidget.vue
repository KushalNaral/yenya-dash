<template>
  <div
    class="bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden border border-gray-100 relative group transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5"
  >
    <!-- Professional Compact Header -->
    <div
      :class="[
        'px-4 py-3.5 text-sky-900 flex items-center justify-between relative border-b border-sky-100/50',
        headerBg,
      ]"
    >
      <slot name="header">
        <div
          :class="[
            'flex items-center gap-2.5 px-3 py-1.5 rounded-xl relative z-10 border shadow-sm backdrop-blur-sm',
            accentClass,
          ]"
        >
          <component :is="iconComponent" v-if="iconComponent" class="h-3.5 w-3.5 opacity-90" />
          <h3 class="font-bold text-[10px] tracking-wider uppercase">
            {{ title }}
          </h3>
        </div>
      </slot>
      <div
        class="relative z-10 opacity-20 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-90"
      >
        <ChevronRight class="h-3 w-3" />
      </div>

      <!-- Header Glow Accent -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"
      ></div>
    </div>

    <!-- Compact Content -->
    <div class="p-0 flex-1 relative min-h-[120px] bg-white">
      <ul class="divide-y divide-sky-50/50">
        <li
          v-for="(item, index) in items"
          :key="index"
          class="px-4 py-2 flex items-center justify-between hover:bg-sky-50/30 transition-all duration-300 relative group/row cursor-pointer border-b border-gray-50 last:border-0"
          @click="emit('item-click', item.link)"
        >
          <!-- Soft Row Accent -->
          <div
            :class="[
              'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover/row:h-2/3 rounded-r-full transition-all duration-500 opacity-40',
              item.noBadge ? 'hidden' : item.color,
            ]"
          ></div>

          <div class="flex items-center gap-3 relative z-10">
            <div
              :class="[
                'w-1.5 h-1.5 rounded-full ring-2 ring-offset-1 ring-transparent group-hover/row:ring-sky-100/50 transition-all duration-300',
                item.noBadge ? 'opacity-0' : item.color,
              ]"
            ></div>
            <span
              class="text-[11px] font-black text-gray-700 uppercase tracking-tight group-hover/row:text-sky-900 transition-colors duration-300"
              v-html="item.label"
            ></span>
          </div>

          <div class="flex items-center gap-2 relative z-10">
            <div
              v-if="item.subLabel"
              class="flex flex-col items-end mr-1 opacity-60 group-hover/row:opacity-100 transition-opacity"
            >
              <span class="text-[8px] uppercase font-bold text-gray-400 leading-none">
                {{ item.subLabel }}
              </span>
              <span class="text-[10px] font-extrabold text-gray-600 leading-tight">
                {{ item.subValue }}
              </span>
            </div>
            <div
              v-if="item.value !== ''"
              :class="[
                item.noBadge
                  ? 'flex items-center text-[11px] font-bold text-gray-500 whitespace-pre'
                  : 'flex items-center justify-center min-w-[38px] h-[24px] px-2 rounded-lg text-[11px] font-black text-white shadow-sm ring-1 ring-white/20 transition-all duration-500 group-hover/row:scale-110 group-hover/row:shadow-md whitespace-pre',
                item.noBadge ? '' : item.color,
                item.valueClass || '',
              ]"
              v-html="item.value"
            ></div>
          </div>
        </li>
      </ul>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-[2px] z-20"
      >
        <Loader2 class="h-6 w-6 text-[#008dc9] animate-spin" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import * as icons from "lucide-vue-next";

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: "Activity" },
  headerBg: { type: String, default: "bg-gradient-to-r from-sky-50 to-blue-50" },
  accentClass: { type: String, default: "bg-sky-100/50 border-sky-100/30 text-sky-900" },
  loading: { type: Boolean, default: false },
  items: {
    type: Array as () => Array<{
      label: string;
      value: string | number;
      subLabel?: string;
      subValue?: string | number;
      color: string;
      noBadge?: boolean;
      valueClass?: string;
      link?: string;
    }>,
    required: true,
  },
});

const emit = defineEmits(["item-click"]);

const iconComponent = computed(() => (icons as any)[props.icon] || icons.Activity);
const { Loader2, ChevronRight } = icons;
</script>

<style scoped>
:deep(*) {
  font-family: var(--font-sans, "Inter", "Work Sans", sans-serif);
}
</style>
