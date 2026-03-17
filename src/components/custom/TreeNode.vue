<script lang="ts">
import { PropType } from "vue";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Folder, FolderOpen, File, Check } from "lucide-vue-next";

interface Option {
  value: any;
  label: string;
  children?: Option[];
  disabled?: boolean;
}

export default {
  name: "TreeNode",
  components: {
    Checkbox,
    ChevronRight,
    Folder,
    FolderOpen,
    File,
    Check,
  },
  props: {
    options: { type: Array as PropType<Option[]>, required: true },
    level: { type: Number, required: true },
    isSelected: { type: Function as PropType<(value: any) => boolean>, required: true },
    toggleSelect: { type: Function as PropType<(opt: Option) => void>, required: true },
    expanded: { type: Set as PropType<Set<any>>, required: true },
    toggleExpand: { type: Function as PropType<(value: any) => void>, required: true },
    multiple: { type: Boolean, required: true },
    disableBranchNodes: { type: Boolean, required: true },
  },
};
</script>

<template>
  <div>
    <div v-for="opt in options" :key="opt.value" class="group">
      <div
        class="flex items-center gap-2 py-2.5 px-3 hover:bg-accent/60 cursor-pointer transition-all duration-150 border-l-2 border-transparent hover:border-primary/30 relative"
        :class="{
          'bg-accent/40 border-primary/50': isSelected(opt.value),
          'opacity-50 cursor-not-allowed hover:bg-transparent': opt.disabled,
          'hover:bg-muted/30': opt.disabled,
        }"
        :style="{ paddingLeft: `${0.75 + level * 1.25}rem` }"
      >
        <!-- Expand/Collapse Button for Branch Nodes -->
        <button
          v-if="opt.children?.length"
          type="button"
          class="flex items-center justify-center w-5 h-5 rounded hover:bg-background/80 transition-colors duration-150 flex-shrink-0"
          @click.stop="toggleExpand(opt.value)"
        >
          <ChevronRight
            class="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
            :class="{ 'rotate-90': expanded.has(opt.value) }"
          />
        </button>

        <!-- Spacing for leaf nodes -->
        <!-- <div v-else class="w-5 flex-shrink-0" /> -->

        <!-- Icon -->
        <div class="flex items-center justify-center w-4 h-4 flex-shrink-0">
          <Folder
            v-if="opt.children?.length && !expanded.has(opt.value)"
            class="h-4 w-4 text-blue-500/70"
          />
          <FolderOpen
            v-else-if="opt.children?.length && expanded.has(opt.value)"
            class="h-4 w-4 text-blue-600"
          />
          <CircleArrowRight v-else class="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>

        <!-- Selection Area -->
        <div
          class="flex items-center gap-3 flex-1 min-w-0"
          @click="
            !opt.disabled && !(disableBranchNodes && opt.children?.length) && toggleSelect(opt)
          "
        >
          <!-- Checkbox for Multiple Selection -->
          <Checkbox
            v-if="multiple && (!disableBranchNodes || !opt.children?.length)"
            :modelValue="isSelected(opt.value)"
            :disabled="opt.disabled"
            class="flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />

          <!-- Check Icon for Single Selection -->
          <div v-else-if="!multiple" class="flex items-center justify-center w-4 h-4 flex-shrink-0">
            <Check v-if="isSelected(opt.value)" class="h-3.5 w-3.5 text-primary font-semibold" />
          </div>

          <!-- Label -->
          <span
            class="text-sm truncate flex-1 transition-colors duration-150"
            :class="{
              'font-medium text-foreground': isSelected(opt.value),
              'text-foreground': !isSelected(opt.value) && !opt.disabled,
              'text-muted-foreground': opt.disabled,
              'font-medium': opt.children?.length,
            }"
          >
            {{ opt.label }}
          </span>

          <!-- Selection Indicator -->
          <div
            v-if="isSelected(opt.value)"
            class="w-2 h-2 rounded-full bg-primary flex-shrink-0 opacity-60"
          />
        </div>

        <!-- Hover Effect Overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          :class="{ 'opacity-20': isSelected(opt.value) }"
        />
      </div>

      <!-- Children Nodes with Animation -->
      <div v-if="opt.children && expanded.has(opt.value)" class="overflow-hidden">
        <TreeNode
          :options="opt.children"
          :level="level + 1"
          :is-selected="isSelected"
          :toggle-select="toggleSelect"
          :expanded="expanded"
          :toggle-expand="toggleExpand"
          :multiple="multiple"
          :disable-branch-nodes="disableBranchNodes"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>
