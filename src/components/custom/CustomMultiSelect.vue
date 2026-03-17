<script setup lang="ts">
import { ref, computed, PropType } from "vue";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, X, Search } from "lucide-vue-next";
import TreeNode from "./TreeNode.vue";

interface Option {
  value: any;
  label: string;
  children?: Option[];
  disabled?: boolean;
}

const props = defineProps({
  modelValue: {
    type: [Array, String, Number, Object] as PropType<any[] | any>,
    default: () => [],
  },
  options: {
    type: Array as PropType<Option[]>,
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  searchable: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: "Select options...",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  max: {
    type: Number,
    default: Infinity,
  },
  closeOnSelect: {
    type: Boolean,
    default: false,
  },
  disableBranchNodes: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "select", "remove", "change", "clear", "search"]);

const open = ref(false);
const searchQuery = ref("");
const expanded = ref(new Set<any>());

const internalValue = computed<any>({
  get() {
    return props.multiple
      ? Array.isArray(props.modelValue)
        ? props.modelValue
        : []
      : props.modelValue;
  },
  set(val) {
    emit("update:modelValue", val);
    emit("change", val);
  },
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  emit("search", searchQuery.value);
  return filterOptions(props.options, searchQuery.value.toLowerCase());
});

function filterOptions(options: Option[], query: string): Option[] {
  return options.reduce((acc: Option[], opt: Option) => {
    const matches = opt.label.toLowerCase().includes(query);
    let children: Option[] = [];
    if (opt.children) {
      children = filterOptions(opt.children, query);
    }
    if (matches || children.length > 0) {
      acc.push({ ...opt, children });
    }
    return acc;
  }, []);
}

function flattenOptions(options: Option[]): Option[] {
  return options.reduce((acc: Option[], opt: Option) => {
    acc.push(opt);
    if (opt.children) {
      acc.push(...flattenOptions(opt.children));
    }
    return acc;
  }, []);
}

const flatOptions = computed(() => flattenOptions(props.options));

function getOptionByValue(value: any): Option | undefined {
  return flatOptions.value.find((o) => o.value === value);
}

function getLabel(value: any): string {
  const opt = getOptionByValue(value);
  return opt ? opt.label : value;
}

function isSelected(value: any): boolean {
  return props.multiple ? internalValue.value.includes(value) : internalValue.value === value;
}

function toggleSelect(opt: Option) {
  if (props.disabled || opt.disabled || (props.disableBranchNodes && opt.children?.length)) return;

  if (props.multiple) {
    const index = internalValue.value.indexOf(opt.value);
    if (index > -1) {
      internalValue.value = internalValue.value.filter((v: any) => v !== opt.value);
      emit("remove", opt);
    } else if (internalValue.value.length < props.max) {
      internalValue.value = [...internalValue.value, opt.value];
      emit("select", opt);
    }
  } else {
    internalValue.value = opt.value;
    emit("select", opt);
    if (props.closeOnSelect) open.value = false;
  }
}

function remove(value: any) {
  if (!props.multiple) return;
  const opt = getOptionByValue(value);
  if (opt) {
    internalValue.value = internalValue.value.filter((v: any) => v !== value);
    emit("remove", opt);
  }
}

function clear() {
  internalValue.value = props.multiple ? [] : null;
  emit("clear");
}

function toggleExpand(value: any) {
  if (expanded.value.has(value)) {
    expanded.value.delete(value);
  } else {
    expanded.value.add(value);
  }
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :class="[
          'w-full justify-between min-h-[2.75rem] py-2 px-3 text-left font-normal hover:bg-accent/50 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 border-input',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          open ? 'ring-2 ring-ring' : '',
          $attrs.class,
        ]"
        :disabled="disabled"
      >
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <div class="flex gap-1 items-center min-w-0 flex-1">
            <template v-if="multiple && internalValue?.length && internalValue.length < 2">
              <Badge
                v-for="val in internalValue"
                :key="val"
                variant="secondary"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-150"
              >
                <span class="truncate max-w-[200px]">{{ getLabel(val) }}</span>
                <X
                  class="h-3 w-3 cursor-pointer hover:text-destructive transition-colors duration-150"
                  @click.stop="remove(val)"
                />
              </Badge>
            </template>
            <template v-else-if="internalValue && internalValue.length > 1">
              <Badge
                variant="secondary"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-150"
              >
                <span class="truncate max-w-[200px]">{{ getLabel(internalValue[0]) }}</span>
                <X
                  class="h-3 w-3 cursor-pointer hover:text-destructive transition-colors duration-150"
                  @click.stop="remove(internalValue[0])"
                />
              </Badge>
              <Badge
                variant="secondary"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-150"
              >
                <span class="truncate max-w-[200px]">+{{ internalValue.length - 1 }} more</span>
              </Badge>
            </template>
            <span
              v-if="!internalValue || (multiple && !internalValue.length)"
              class="text-muted-foreground text-sm truncate"
            >
              {{ placeholder }}
            </span>
            <span v-else-if="!multiple" class="text-sm truncate">
              {{ getLabel(internalValue) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            v-if="clearable && internalValue && (multiple ? internalValue.length > 0 : true)"
            type="button"
            class="p-1 rounded-sm hover:bg-muted transition-colors duration-150 opacity-60 hover:opacity-100"
            @click.stop="clear"
          >
            <X class="h-3 w-3" />
          </button>
          <ChevronDown
            class="h-4 w-4 opacity-60 transition-transform duration-200"
            :class="{ 'rotate-180': open }"
          />
        </div>
      </Button>
    </PopoverTrigger>

    <PopoverContent
      class="z-[100] w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-border/40"
    >
      <div v-if="searchable" class="relative">
        <Search
          class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search options..."
          class="pl-9 border-0 border-b border-border/40 rounded-none focus-visible:ring-0 focus-visible:border-primary/50 bg-background/50"
        />
      </div>

      <ScrollArea class="w-full py-2 bg-white max-h-[300px]">
        <div
          v-if="!filteredOptions.length"
          class="flex flex-col items-center justify-center py-8 px-4"
        >
          <div class="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Search class="h-5 w-5 text-muted-foreground" />
          </div>
          <p class="text-sm text-muted-foreground text-center">No options found</p>
          <p class="text-xs text-muted-foreground/70 text-center mt-1">
            Try adjusting your search terms
          </p>
        </div>

        <TreeNode
          v-else
          :options="filteredOptions"
          :level="0"
          :is-selected="isSelected"
          :toggle-select="toggleSelect"
          :expanded="expanded"
          :toggle-expand="toggleExpand"
          :multiple="multiple"
          :disable-branch-nodes="disableBranchNodes"
        />
      </ScrollArea>
    </PopoverContent>
  </Popover>
</template>
