<script setup lang="ts">
import type {
  ActionDisplayMode,
  DataTableAction,
  DataTableColumn,
} from "@/types/datatable";
import { computed, useSlots } from "vue";

defineSlots<{ [key: string]: (props: Record<string, unknown>) => any }>();
const slots = useSlots();

import DataTableDataRow from "./DataTableDataRow.vue";

const props = withDefaults(
  defineProps<{
    row: any;
    level: number;
    rowIndex: number;
    visibleColumns: DataTableColumn<any>[];
    actions: DataTableAction<any>[] | undefined;
    actionDisplayMode: ActionDisplayMode;
    partitionActions: boolean;
    actionPartitions: DataTableAction<any>[][];
    showSN: boolean;
    showRowHover: boolean;
    alternatingRows: boolean;
    currentPage: number;
    perPage: number;
    expandedRows: Set<string>;
    updateData: ((id: string, key: string, value: any) => void) | undefined;
    showDragHandle?: boolean;
  }>(),
  {
    row: () => ({}),
    level: 0,
    rowIndex: 0,
    visibleColumns: () => [],
    actions: () => [],
    actionDisplayMode: "dropdown",
    partitionActions: false,
    actionPartitions: () => [],
    showSN: true,
    showRowHover: true,
    alternatingRows: true,
    currentPage: 1,
    perPage: 10,
    expandedRows: () => new Set(),
    updateData: undefined,
    showDragHandle: false,
  },
);

const emit = defineEmits([
  "row-click",
  "row-double-click",
  "toggle-row",
  "handle-action",
]);

const isExpanded = computed(() =>
  props.expandedRows.has(props.row.id?.toString()),
);
const hasChildren = computed(
  () => props.row.children && props.row.children.length > 0,
);
</script>

<template>
  <DataTableDataRow
    v-bind="props"
    :has-children="hasChildren"
    :is-expanded="isExpanded"
    @row-click="emit('row-click', $event, rowIndex)"
    @row-double-click="emit('row-double-click', $event, rowIndex)"
    @toggle-row="emit('toggle-row', $event)"
    @handle-action="emit('handle-action', $event)"
  >
    <template
      v-for="(_, slotName) in slots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps" />
    </template>
  </DataTableDataRow>

  <!-- Recursive Children -->
  <RowRenderer
    v-if="isExpanded && hasChildren"
    v-for="(child, childIndex) in row.children"
    :key="child.id || child.name || childIndex"
    :row="child"
    :update-data="updateData"
    :level="level + 1"
    :row-index="rowIndex * 100 + (childIndex as number) + 1"
    :visible-columns="visibleColumns"
    :actions="actions"
    :action-display-mode="actionDisplayMode"
    :partition-actions="partitionActions"
    :action-partitions="actionPartitions"
    :show-s-n="showSN"
    :show-row-hover="showRowHover"
    :alternating-rows="alternatingRows"
    :current-page="currentPage"
    :per-page="perPage"
    :expanded-rows="expandedRows"
    @row-click="
      emit('row-click', $event, rowIndex + (childIndex as number) + 1)
    "
    @row-double-click="
      emit('row-double-click', $event, rowIndex + (childIndex as number) + 1)
    "
    @toggle-row="emit('toggle-row', $event)"
    @handle-action="emit('handle-action', $event)"
  >
    <template
      v-for="(_, slotName) in slots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps" />
    </template>
  </RowRenderer>
</template>
