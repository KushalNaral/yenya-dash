<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { ActionDisplayMode, DataTableAction, DataTableColumn } from "@/types/datatable";
import { useSlots } from "vue";

const slots = useSlots();

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
    updateData: ((id: string, key: string, value: any) => void) | undefined;
    showDragHandle?: boolean;
    hasChildren?: boolean;
    isExpanded?: boolean;
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
    updateData: undefined,
    showDragHandle: false,
    hasChildren: false,
    isExpanded: false,
  },
);

const emit = defineEmits(["row-click", "row-double-click", "toggle-row", "handle-action"]);

const getNestedValue = (obj: any, key: string) =>
  key.split(".").reduce((o, k) => (o ? o[k] : ""), obj);

const formatCellValue = (row: any, column: any) => {
  const value = getNestedValue(row, column.accessorKey);
  return column.formatter ? column.formatter(value, row) : value;
};

const getBadgeVariant = (row: any, column: any) =>
  column.badgeVariant ? column.badgeVariant(row) : "default";

const getActionButtonClass = (action: any) => {
  switch (action.variant) {
    case "destructive":
      return "bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground";
    case "secondary":
      return "bg-secondary hover:bg-secondary/80 hover:text-secondary-foreground";
    case "ghost":
      return "bg-ghost hover:bg-ghost/80 hover:text-ghost-foreground";
    case "link":
      return "bg-link hover:bg-link/80 hover:text-link-foreground";
    default:
      return "bg-primary text-primary-foreground hover:bg-primary/80";
  }
};

const getActionMenuItemClass = (action: any) => {
  switch (action.variant) {
    case "destructive":
      return "bg-destructive/80 text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground";
    case "secondary":
      return "text-secondary hover:bg-secondary/50 hover:text-secondary-foreground";
    case "ghost":
      return "text-ghost hover:bg-ghost/50 hover:text-ghost-foreground";
    case "link":
      return "text-link hover:bg-link/50 hover:text-link-foreground";
    default:
      return "text-primary hover:bg-primary/50 hover:text-primary-foreground";
  }
};

const handleToggle = () => {
  emit("toggle-row", props.row);
};

const handleRowClick = (e: Event) => {
  e.stopPropagation();
  emit("row-click", props.row, props.rowIndex);
};

const handleRowDoubleClick = (e: Event) => {
  e.stopPropagation();
  emit("row-double-click", props.row, props.rowIndex);
};

const handleActionClick = (a: any, r: any) => {
  emit("handle-action", {
    action: a,
    row: r,
  });
};
</script>

<template>
  <TableRow
    class="transition-all duration-200 cursor-pointer"
    :class="{
      'hover:bg-muted/50': showRowHover,
      'bg-muted/10': alternatingRows && rowIndex % 2 === 0,
    }"
    @click="handleRowClick"
    @dblclick="handleRowDoubleClick"
  >
    <TableCell v-if="showDragHandle" class="w-10 p-2">
      <div class="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center">
        <Iconify
          icon="lucide:grip-vertical"
          class="size-4 text-muted-foreground hover:text-primary"
        />
      </div>
    </TableCell>

    <TableCell
      v-for="(column, colIndex) in visibleColumns"
      :key="column.accessorKey"
      class="p-2 transition-all duration-200"
      :class="column.cellClassName"
      :style="{ paddingLeft: colIndex === 0 ? `${level * 1.5 + 1}rem` : undefined }"
    >
      <div class="flex items-center">
        <!-- Expand/Collapse -->
        <Button
          v-if="colIndex === 0 && hasChildren"
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0 mr-2 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
          @click.stop="handleToggle"
        >
          <Iconify
            :icon="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
            class="size-4"
          />
        </Button>

        <!-- Serial Number -->
        <span v-if="showSN && column.accessorKey === 'sn'" class="text-foreground">
          {{ row.point_no || rowIndex + 1 + (currentPage - 1) * perPage }}
        </span>

        <slot
          v-else-if="slots[`cell-${column.accessorKey}`]"
          :name="`cell-${column.accessorKey}`"
          :item="row"
          :row="row"
          :value="getNestedValue(row, column.accessorKey)"
          :column="column"
          :rowIndex="rowIndex"
        />

        <component
          v-else-if="column.cell"
          :is="typeof column.cell === 'function' ? 'div' : column.cell"
          :row="row"
          :value="getNestedValue(row, column.accessorKey)"
          :column="column"
          :rowIndex="rowIndex"
          v-html="
            typeof column.cell === 'function'
              ? (column.cell as Function)({
                  row,
                  value: getNestedValue(row, column.accessorKey),
                  column,
                  rowIndex,
                })
              : null
          "
        />

        <!-- Badge -->
        <Badge
          v-else-if="column.badge"
          :variant="getBadgeVariant(row, column)"
          class="transition-all duration-200"
        >
          {{ formatCellValue(row, column) }}
        </Badge>

        <!-- Default -->
        <span v-else class="text-foreground">
          {{ formatCellValue(row, column) }}
        </span>
      </div>
    </TableCell>

    <!-- Actions -->
    <TableCell v-if="actions && actions.length" class="py-4">
      <div v-if="actionDisplayMode === 'horizontal'" class="flex items-center gap-1">
        <!-- Partitioned -->
        <template v-if="partitionActions">
          <div
            v-for="(partition, partitionIndex) in actionPartitions"
            :key="partitionIndex"
            class="flex items-center gap-1"
          >
            <template v-for="action in partition" :key="action.label">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 p-0 rounded-full bg-primary text-white hover:bg-primary/80 transition-all duration-200 cursor-pointer"
                      :class="getActionButtonClass(action)"
                      @click.stop="handleActionClick(action, row)"
                      :disabled="action.disabled?.(row) || false"
                    >
                      <Iconify :icon="action.icon" v-if="action.icon" class="size-4" />
                      <span v-else class="text-xs">{{ action.label.charAt(0) }}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {{ action.tooltip || action.label }}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </template>
            <Separator
              v-if="partitionIndex < actionPartitions.length - 1"
              orientation="vertical"
              class="size-4 mx-1"
            />
          </div>
        </template>

        <!-- Non-partitioned -->
        <template v-else>
          <template v-for="action in actions" :key="action.label">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0 rounded-full bg-primary text-white hover:bg-primary/80 transition-all duration-200 cursor-pointer"
                    :class="getActionButtonClass(action)"
                    @click.stop="handleActionClick(action, row)"
                    :disabled="action.disabled?.(row) || false"
                  >
                    <Iconify :icon="action.icon" v-if="action.icon" class="size-4" />
                    <span v-else class="text-xs">{{ action.label.charAt(0) }}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {{ action.tooltip || action.label }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </template>
        </template>
      </div>

      <!-- Dropdown -->
      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            class="size-8 p-0 rounded-full hover:bg-primary/20 cursor-pointer transition-all duration-200"
            @click.stop
          >
            <Iconify icon="lucide:more-vertical" class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-[160px]">
          <template v-if="partitionActions">
            <div v-for="(partition, partitionIndex) in actionPartitions" :key="partitionIndex">
              <template v-for="action in partition" :key="action.label">
                <PermissionGuard v-if="action.permission" :permission="action.permission">
                  <DropdownMenuItem
                    @click="handleActionClick(action, row)"
                    :variant="action.variant ?? 'default'"
                    :class="cn('gap-1 cursor-pointer duration-200', getActionMenuItemClass(action))"
                    :disabled="action.disabled?.(row) || false"
                  >
                    <Iconify :icon="action.icon" v-if="action.icon" class="size-4 mr-1" />
                    {{ action.label }}
                  </DropdownMenuItem>
                </PermissionGuard>
              </template>
              <DropdownMenuSeparator v-if="partitionIndex < actionPartitions.length - 1" />
            </div>
          </template>
          <template v-else>
            <template v-for="action in actions" :key="action.label">
              <DropdownMenuItem
                @click="handleActionClick(action, row)"
                :variant="action.variant ?? 'default'"
                :class="cn('gap-1 cursor-pointer duration-200', getActionMenuItemClass(action))"
                :disabled="action.disabled?.(row) || false"
              >
                <Iconify :icon="action.icon" v-if="action.icon" class="size-4 mr-1" />
                {{ action.label }}
              </DropdownMenuItem>
            </template>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
</template>
