<template>
  <th :colspan="headerSpan ?? 1">{{ heading }}</th>
  <td
    v-for="(option, index) in options"
    :key="option.value"
    class="checkbox-cell"
    :colspan="index === options.length - 1 ? (lastTdSpan ?? 1) : 1"
  >
    <span class="cb" :class="{ checked: modelValue == option.value }"></span>
    {{ option.label }}
  </td>
</template>
<script setup lang="ts">
defineProps<{
  heading: string;
  options: { value: number | string; label: string }[];
  modelValue: any;
  lastTdSpan?: number;
  headerSpan?: number;
}>();
</script>
