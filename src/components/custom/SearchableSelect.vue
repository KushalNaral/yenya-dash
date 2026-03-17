<script setup lang="ts">
import { computed } from "vue";

interface Option {
  value: string;
  label: string;
}
interface Props {
  options: Option[];
  modelValue?: string;
  placeholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "Select an option…",
  emptyText: "No results found.",
  loading: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();

const selectedOption = computed({
  get: () => props.options.find((o) => o.value === props.modelValue) || null,
  set: (option: Option | null) => {
    emit("update:modelValue", option?.value ?? "");
  },
});
</script>

<template>
  <div class="relative w-full">
    <Combobox
      v-model="selectedOption"
      :open-on-click="true"
      :reset-search-term-on-select="true"
      by="label"
      class="w-full"
    >
      <ComboboxAnchor class="w-full border border-input rounded-md relative">
        <div class="relative items-center">
          <ComboboxInput
            class="outline-none placeholder:text-muted-foreground"
            :display-value="(option: Option | null) => option?.label ?? ''"
            :placeholder="placeholder"
            :disabled="disabled"
          />
        </div>

        <ComboboxList class="relative">
          <ComboboxViewport>
            <template v-if="loading">
              <ComboboxEmpty>
                <div class="flex items-center justify-center gap-2 py-2">
                  <div
                    class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"
                  ></div>
                  <span class="text-muted-foreground">Loading…</span>
                </div>
              </ComboboxEmpty>
            </template>
            <template v-else-if="!options.length">
              <ComboboxEmpty> {{ emptyText }} </ComboboxEmpty>
            </template>

            <ComboboxGroup>
              <ComboboxItem v-for="opt in options" :key="opt.value" :value="opt">
                {{ opt.label }}
                <ComboboxItemIndicator>
                  <Iconify icon="mdi-check" class="size-4 text-muted-foreground" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxViewport>
        </ComboboxList>
      </ComboboxAnchor>
    </Combobox>
  </div>
</template>
