<template>
  <div class="space-y-6" :class="containerClassName">
    <!-- Header with title, help, and controls -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-primary tracking-tight">
          {{ dataType.charAt(0).toUpperCase() + dataType.slice(1) }} Management
        </h2>
        <Button
          v-if="helpContent"
          variant="ghost"
          size="sm"
          class="rounded-full p-2 cursor-pointer"
          @click="showHelp = true"
        >
          <Iconify
            icon="lucide:help-circle"
            class="size-4 text-muted-foreground hover:text-primary"
          />
        </Button>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button
          v-if="draggableConfig?.enabled"
          variant="outline"
          size="sm"
          class="shrink-0 transition-all cursor-pointer"
          :class="
            isDragModeActive
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'hover:bg-primary hover:text-white'
          "
          @click="toggleDragMode"
          :disabled="isLoading || isReordering"
          :title="isDragModeActive ? 'Disable Ordering' : 'Enable Ordering'"
        >
          <Iconify
            :icon="isDragModeActive ? 'lucide:lock' : 'lucide:grip-vertical'"
            class="size-4 mr-1"
          />
          {{ isDragModeActive ? "Disable Ordering" : "Enable Ordering" }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
          @click="fetchData"
          :disabled="isLoading"
          title="Refresh"
        >
          <Iconify icon="lucide:refresh-cw" class="size-4" :class="{ 'animate-spin': isLoading }" />
        </Button>
        <slot name="headerActions" />
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-card rounded-lg p-4 shadow-sm border" :class="filterContainerClassName">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="relative w-full md:w-auto md:min-w-[300px]">
          <Iconify
            icon="lucide:search"
            class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            class="bg-background p-2.5 border-primary/50 pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            :placeholder="`Search ${dataType}...`"
            :class="searchInputClassName"
            @input="debouncedFetchData"
          />
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto">
          <!-- Filters Dropdown -->
          <DropdownMenu v-if="filtersConfig">
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                class="gap-2 transition-all duration-200 hover:bg-primary hover:text-white cursor-pointer"
                :class="filterButtonClassName"
              >
                <Iconify icon="lucide:filter" class="size-4" />
                Filters
                <Badge
                  v-if="activeFilterCount > 0"
                  variant="default"
                  class="ml-1 bg-primary/90 text-white"
                >
                  {{ activeFilterCount }}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-[300px] p-4" :class="filterDropdownClassName">
              <div class="space-y-4">
                <div v-for="filter in filtersConfig" :key="filter.key" class="space-y-2">
                  <Label class="font-medium flex items-center gap-2">
                    {{ filter.label }}
                    <TooltipProvider v-if="filter.tooltip">
                      <Tooltip>
                        <TooltipTrigger>
                          <Iconify icon="lucide:help-circle" class="size-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {{ filter.tooltip }}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>

                  <!-- Select Filter -->
                  <Select
                    v-if="filter.type === 'select' || !filter.type"
                    v-model="filters[filter.key]"
                    @update:modelValue="debouncedFetchData"
                    class="cursor-pointer"
                    :class="filter.className"
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue :placeholder="filter.placeholder || `Select ${filter.label}`" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="null">All {{ filter.label }}</SelectItem>
                      <SelectItem
                        v-for="option in filter.options"
                        :key="option.value"
                        :value="option.value"
                        class="cursor-pointer"
                        :disabled="option.disabled"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <!-- Multiselect Filter -->
                  <Select
                    v-else-if="filter.type === 'multiselect'"
                    v-model="filters[filter.key]"
                    multiple
                    @update:modelValue="debouncedFetchData"
                    class="cursor-pointer"
                    :class="filter.className"
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue :placeholder="filter.placeholder || `Select ${filter.label}`" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in filter.options"
                        :key="option.value"
                        :value="option.value"
                        class="cursor-pointer"
                        :disabled="option.disabled"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <!-- Date Range Filter -->
                  <div v-else-if="filter.type === 'date-range'" class="space-y-2">
                    <div class="flex gap-2">
                      <Input
                        type="date"
                        v-model="filters[filter.key].start"
                        :placeholder="`Start ${filter.label}`"
                        class="w-full"
                        :class="filter.className"
                        :max="filters[filter.key].end"
                        @change="
                          validateDateRange(filter.key);
                          debouncedFetchData();
                        "
                      />
                      <Input
                        type="date"
                        v-model="filters[filter.key].end"
                        :placeholder="`End ${filter.label}`"
                        class="w-full"
                        :class="filter.className"
                        :min="filters[filter.key].start"
                        @change="
                          validateDateRange(filter.key);
                          debouncedFetchData();
                        "
                      />
                    </div>
                  </div>

                  <!-- Single Date Filter -->
                  <div v-else-if="filter.type === 'date'" class="space-y-2">
                    <Input
                      type="date"
                      v-model="filters[filter.key]"
                      :placeholder="filter.placeholder || `Select ${filter.label}`"
                      class="w-full"
                      :class="filter.className"
                      @change="debouncedFetchData"
                    />
                  </div>

                  <!-- Number Range Filter -->
                  <div v-else-if="filter.type === 'number-range'" class="space-y-2">
                    <div class="flex gap-2">
                      <Input
                        type="number"
                        v-model.number="filters[filter.key].min"
                        :placeholder="`Min ${filter.label}`"
                        class="w-full"
                        :class="filter.className"
                        :min="filter.min"
                        :max="filters[filter.key].max"
                        @input="
                          validateNumberRange(filter.key);
                          debouncedFetchData();
                        "
                      />
                      <Input
                        type="number"
                        v-model.number="filters[filter.key].max"
                        :placeholder="`Max ${filter.label}`"
                        class="w-full"
                        :class="filter.className"
                        :min="filters[filter.key].min"
                        :max="filter.max"
                        @input="
                          validateNumberRange(filter.key);
                          debouncedFetchData();
                        "
                      />
                    </div>
                  </div>

                  <!-- Custom Filter Component -->
                  <component
                    v-else-if="filter.component"
                    :is="filter.component"
                    :filter="filter"
                    :value="filters[filter.key]"
                    :class="filter.className"
                    @update:value="updateCustomFilter(filter.key, $event)"
                  />
                </div>
              </div>
              <div class="flex justify-between mt-4">
                <Button variant="outline" size="sm" class="cursor-pointer" @click="applyFilters">
                  Apply Filters
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  class="cursor-pointer"
                  @click="resetFilters"
                >
                  Reset Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Columns Visibility -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                class="gap-2 transition-all duration-200 hover:bg-primary hover:text-white cursor-pointer"
                :class="columnsButtonClassName"
              >
                <Iconify icon="lucide:columns" class="size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-[200px]">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                v-for="column in columns"
                :key="column.accessorKey"
                v-model="columnVisibility[column.accessorKey]"
                class="capitalize cursor-pointer"
                @update:modelValue="debouncedFetchData"
              >
                {{ column.header.toLowerCase() }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Actions Display Toggle -->
          <DropdownMenu v-if="actions && showHeaderActions">
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                class="gap-2 transition-all duration-200 hover:bg-secondary"
                :class="actionsButtonClassName"
              >
                <Iconify icon="lucide:settings" class="size-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Action Display</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                :checked="actionDisplayMode === 'horizontal'"
                @update:checked="
                  actionDisplayMode = actionDisplayMode === 'horizontal' ? 'dropdown' : 'horizontal'
                "
              >
                Horizontal Buttons
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                v-model="partitionActions"
                class="ml-2"
                :disabled="actionDisplayMode === 'dropdown'"
              >
                Partition Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div
      class="rounded-lg border shadow-sm overflow-hidden relative"
      :class="tableContainerClassName"
    >
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20"
      >
        <div class="flex flex-col items-center gap-2">
          <Iconify icon="lucide:loader-circle" class="size-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">Loading {{ dataType }}...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!isLoading && displayData.length === 0 && !showTableWhenEmpty"
        class="flex flex-col items-center justify-center py-16 gap-4"
      >
        <Iconify icon="lucide:folder-search" class="size-12 text-muted-foreground" />
        <div class="text-center">
          <h3 class="text-lg font-medium">No {{ dataType }} found</h3>
          <p class="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
        <Button
          variant="outline"
          @click="resetFilters"
          class="transition-all duration-200 hover:bg-primary hover:text-white cursor-pointer"
        >
          Reset Filters
        </Button>
      </div>

      <!-- Table -->
      <div v-if="displayData.length > 0 || showTableWhenEmpty" class="overflow-x-auto">
        <Table :class="cn(tableClassName, 'text-left whitespace-nowrap')">
          <TableHeader class="sticky top-0 z-10 bg-background">
            <slot name="header" :visible-columns="visibleColumns">
              <TableRow>
                <!-- Drag Handle Header -->
                <TableHead v-if="isDragModeActive && draggableConfig?.enabled" class="w-10">
                  <span class="sr-only">Drag</span>
                </TableHead>
                <TableHead
                  v-for="column in visibleColumns"
                  :key="column.accessorKey"
                  class="font-medium text-foreground whitespace-nowrap"
                  :class="[column.className, column.resizable ? 'resize-x' : '']"
                  :style="{ minWidth: column.minWidth, maxWidth: column.maxWidth }"
                >
                  <div class="flex items-start gap-4">
                    <slot :name="`thead-${column.accessorKey}`" :column="column">
                      {{ column.header }}
                    </slot>
                    <Button
                      v-if="column.sortable"
                      variant="ghost"
                      size="sm"
                      class="h-6 w-6 p-0 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                      @click="toggleSort(column.accessorKey)"
                    >
                      <Iconify
                        icon="lucide:arrow-up-down"
                        class="size-3.5 transition-colors"
                        :class="
                          sortKey === column.accessorKey ? 'text-primary' : 'text-muted-foreground'
                        "
                      />
                    </Button>
                    <Button
                      v-if="column.icon"
                      variant="ghost"
                      size="sm"
                      class="h-6 w-6 p-0 rounded-full hover:bg-secondary transition-colors"
                      @click="column.onIconClick?.()"
                    >
                      <Iconify :icon="column.icon" class="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead v-if="actions" :class="getActionsColumnWidth()">
                  <span class="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </slot>
          </TableHeader>

          <VueDraggable
            v-if="isDragModeActive && draggableConfig?.enabled"
            v-model="displayData"
            tag="tbody"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            drag-class="bg-muted/80"
            :animation="200"
            :disabled="isReordering"
            @end="handleDragEnd"
          >
            <template #item="{ element: row, index }">
              <DataTableDataRow
                :row="row"
                :level="0"
                :row-index="index"
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
                :update-data="updateData"
                :show-drag-handle="true"
                :is-expanded="expandedRows.has(row.id?.toString())"
                :has-children="row.children && row.children.length > 0"
                @row-click="emit('row-click', $event, index)"
                @row-double-click="emit('row-double-click', $event, index)"
                @toggle-row="toggleRow"
                @handle-action="handleAction"
              >
                <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
                  <slot :name="slotName" v-bind="slotProps" />
                </template>
              </DataTableDataRow>
            </template>
          </VueDraggable>

          <TableBody v-else>
            <RowRenderer
              v-for="(row, index) in displayData"
              :key="row.id || row.name || index"
              :row="row"
              :level="0"
              :row-index="index"
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
              :update-data="updateData"
              :show-drag-handle="false"
              @row-click="emit('row-click', $event, index)"
              @row-double-click="emit('row-double-click', $event, index)"
              @toggle-row="toggleRow"
              @handle-action="handleAction"
            >
              <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps">
                <slot :name="slotName" v-bind="slotProps" />
              </template>
            </RowRenderer>

            <TableRow v-if="!isLoading && displayData.length === 0 && showTableWhenEmpty">
              <TableCell
                :colspan="visibleColumns.length + (actions ? 1 : 0)"
                class="h-24 text-center text-muted-foreground"
              >
                <slot name="empty"> No data found </slot>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="usePagination && displayData.length > 0 && !hierarchy"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card rounded-lg p-4 border shadow-sm"
      :class="paginationClassName"
    >
      <div class="text-sm text-muted-foreground">
        Showing
        <span class="font-medium text-foreground">{{ (currentPage - 1) * perPage + 1 }}</span>
        to
        <span class="font-medium text-foreground">{{
          Math.min(currentPage * perPage, total)
        }}</span>
        of <span class="font-medium text-foreground">{{ total }}</span>
        {{ dataType }}
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 text-sm">
          <span>Rows per page:</span>
          <Select v-model="perPageString">
            <SelectTrigger class="h-8 w-[70px] cursor-pointer" :class="pageSizeSelectClassName">
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="cursor-pointer">
              <SelectItem
                v-for="option in pageSizeOptions"
                :key="option"
                :value="option.toString()"
                class="cursor-pointer"
              >
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            class="h-8 w-8 p-0 transition-all duration-200 cursor-pointer hover:bg-primary hover:text-white"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <Iconify icon="lucide:chevron-left" class="h-4 w-4" />
          </Button>

          <div class="flex items-center gap-1">
            <Button
              v-for="page in visiblePages"
              :key="page"
              variant="outline"
              size="sm"
              class="h-8 w-8 p-0 transition-all duration-200"
              :class="{
                'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white cursor-pointer':
                  currentPage === page,
                'hover:bg-primary hover:text-white cursor-pointer': currentPage !== page,
              }"
              @click="changePage(page)"
            >
              {{ page }}
            </Button>
            <span v-if="showEllipsis" class="px-2 text-sm">...</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            class="h-8 w-8 p-0 transition-all duration-200 hover:bg-primary hover:text-white cursor-pointer"
            :disabled="currentPage === lastPage"
            @click="changePage(currentPage + 1)"
          >
            <Iconify icon="lucide:chevron-right" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Help Overlay -->
    <Dialog v-model:open="showHelp" v-if="helpContent">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Iconify icon="lucide:help-circle" class="size-5" />
            How to use {{ dataType.charAt(0).toUpperCase() + dataType.slice(1) }} Management
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4 text-sm">
          <div v-for="(section, index) in helpContent" :key="index">
            <h4 class="font-semibold text-base mb-2 flex items-center gap-2">
              <Iconify :icon="section.icon" v-if="section.icon" class="size-4" />
              {{ section.title }}
            </h4>
            <p class="text-muted-foreground mb-2">{{ section.description }}</p>
            <ul v-if="section.steps" class="list-disc list-inside space-y-1 ml-4">
              <li v-for="step in section.steps" :key="step" class="text-muted-foreground">
                {{ step }}
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button @click="showHelp = false" class="cursor-pointer">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog for Actions -->
    <Dialog v-model:open="showConfirmDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
        </DialogHeader>
        <p>{{ confirmMessage }}</p>
        <DialogFooter>
          <Button variant="outline" @click="showConfirmDialog = false">Cancel</Button>
          <Button @click="executeConfirmedAction">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { debounce } from "lodash";
import { emitter } from "@/events/eventBus";
import RowRenderer from "./RowRenderer.vue";
import DataTableDataRow from "./DataTableDataRow.vue";
import VueDraggable from "vuedraggable";

import type {
  DataTableColumn,
  DataTableAction,
  DataTableFilterConfig,
  DataTableHelpSection,
  ActionDisplayMode,
  PaginatedResponse,
  DataTableFetchParams,
  ColumnVisibility,
  FilterState,
  DraggableConfig,
  ReorderItem,
} from "@/types/datatable";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    dataType: string;
    columns: DataTableColumn[];
    actions?: DataTableAction[];
    updateData?: (id: string, key: string, value: any) => void;
    fetchData: (params: DataTableFetchParams) => Promise<PaginatedResponse<any> | any[]>;
    usePagination?: boolean;
    filtersConfig?: DataTableFilterConfig[];
    dataKey?: string;
    refreshKey: string;
    helpContent?: DataTableHelpSection[];
    defaultActionDisplay?: ActionDisplayMode;
    enableActionPartitioning?: boolean;
    showHeaderActions?: boolean;
    showSN?: boolean;
    pageSizeOptions?: number[];
    defaultPageSize?: number;
    showRowHover?: boolean;
    alternatingRows?: boolean;
    draggableConfig?: DraggableConfig;
    hierarchy?: boolean;
    showTableWhenEmpty?: boolean;
    containerClassName?: string;
    tableContainerClassName?: string;
    tableClassName?: string;
    filterContainerClassName?: string;
    filterButtonClassName?: string;
    filterDropdownClassName?: string;
    columnsButtonClassName?: string;
    actionsButtonClassName?: string;
    searchInputClassName?: string;
    paginationClassName?: string;
    pageSizeSelectClassName?: string;
  }>(),
  {
    showHeaderActions: false,
    showSN: true,
    usePagination: true,
    defaultActionDisplay: "dropdown",
    enableActionPartitioning: false,
    pageSizeOptions: () => [10, 20, 50, 100],
    defaultPageSize: 10,
    showRowHover: true,
    alternatingRows: true,
    hierarchy: false,
    showTableWhenEmpty: false,
    containerClassName: "",
    tableContainerClassName: "",
    tableClassName: "",
    filterContainerClassName: "",
    filterButtonClassName: "",
    filterDropdownClassName: "",
    columnsButtonClassName: "",
    actionsButtonClassName: "",
    searchInputClassName: "",
    paginationClassName: "",
    pageSizeSelectClassName: "",
  },
);

const emit = defineEmits<{
  (e: "row-click", row: any, index: number): void;
  (e: "row-double-click", row: any, index: number): void;
  (e: "sort-change", sortConfig: { key: string; order: "asc" | "desc" }): void;
  (e: "filter-change", filters: FilterState): void;
  (e: "page-change", page: number): void;
  (e: "page-size-change", pageSize: number): void;
  (e: "reorder-end", items: ReorderItem[]): void;
}>();

const searchQuery = ref<string>("");
const isDragModeActive = ref<boolean>(false);
const isReordering = ref<boolean>(false);
const sortKey = ref<string>("");
const sortOrder = ref<"asc" | "desc">("asc");
const currentPage = ref<number>(1);
const perPage = ref<number>(props.defaultPageSize);
const perPageString = computed({
  get: () => perPage.value.toString(),
  set: (val: string) => {
    perPage.value = Number(val);
    debouncedFetchData();
  },
});
const columnVisibility = ref<ColumnVisibility>({});
const displayData = ref<any[]>([]);
const total = ref<number>(0);
const lastPage = ref<number>(1);
const filters = ref<FilterState>({});
const isLoading = ref<boolean>(false);
const showHelp = ref<boolean>(false);
const actionDisplayMode = ref<ActionDisplayMode>(props.defaultActionDisplay);
const partitionActions = ref<boolean>(props.enableActionPartitioning);
const showConfirmDialog = ref<boolean>(false);
const confirmMessage = ref<string>("");
const pendingAction = ref<{ action: DataTableAction; row: any } | null>(null);
const expandedRows = ref<Set<string>>(new Set());

const visibleColumns = computed(() => {
  let vCols = props.columns.filter(
    (column) => columnVisibility.value[column.accessorKey] !== false,
  );
  if (props.showSN) {
    vCols.unshift({ accessorKey: "sn", header: "S.N." });
  }
  return vCols;
});

const activeFilterCount = computed(() => {
  if (!props.filtersConfig) return 0;
  return Object.values(filters.value).reduce((count, value) => {
    if (value === null || value === undefined || value === "") return count;
    if (Array.isArray(value)) return value.length > 0 ? count + 1 : count;
    if (typeof value === "object") {
      return Object.values(value).some((v) => v !== null && v !== undefined && v !== "")
        ? count + 1
        : count;
    }
    return count + 1;
  }, 0);
});

const actionPartitions = computed(() => {
  if (!props.actions || !partitionActions.value) return [props.actions || []];
  const partitioned: DataTableAction[][] = [];
  const maxPartition = Math.max(...props.actions.map((a) => a.partition || 0));
  for (let i = 0; i <= maxPartition; i++) {
    partitioned[i] = props.actions.filter((a) => (a.partition || 0) === i);
  }
  return partitioned.filter((p) => p.length > 0);
});

const visiblePages = computed(() => {
  const total = lastPage.value;
  const current = currentPage.value;
  const maxVisible = 5;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total]);
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 3) {
    end = 4;
  } else if (current >= total - 2) {
    start = total - 3;
  }

  for (let i = start; i <= end; i++) {
    pages.add(i);
  }

  return Array.from(pages).sort((a, b) => a - b);
});

const showEllipsis = computed(
  () =>
    lastPage.value > 5 &&
    !visiblePages.value.includes(lastPage.value - 1) &&
    !visiblePages.value.includes(2),
);

const buildFetchParams = () => {
  const params: DataTableFetchParams = {
    page: props.usePagination && !props.hierarchy ? currentPage.value : undefined,
    per_page: props.usePagination && !props.hierarchy ? perPage.value : undefined,
    search: searchQuery.value || undefined,
    sort_by: sortKey.value || undefined,
    sort_order: sortOrder.value || undefined,
    hierarchy: props.hierarchy ? true : undefined,
    parent_id: props.hierarchy ? filters.value.parent_id : undefined,
  };

  Object.entries(filters.value).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) {
      params[key] = value.join(",");
    } else if (typeof value === "object" && value !== null) {
      if ("start" in value) params[`${key}_start`] = (value as any).start;
      if ("end" in value) params[`${key}_end`] = (value as any).end;
      if ("min" in value) params[`${key}_min`] = (value as any).min;
      if ("max" in value) params[`${key}_max`] = (value as any).max;
    } else {
      params[key] = value;
    }
  });

  return params;
};

const processResponseData = (response: PaginatedResponse<any> | any[]) => {
  let data: any[] = [];
  let meta = { total: 0, last_page: 1, current_page: 1, per_page: 10 };

  if (Array.isArray(response)) {
    data = response;
    meta.total = response.length;
    meta.per_page = response.length || 10;
  } else {
    const dynamicData = (response as any)[props.dataKey || props.dataType];
    data = response.data || dynamicData || [];

    const responseMeta = response.meta || (response as any);
    meta.total = responseMeta.total || 0;
    meta.last_page = responseMeta.last_page || 1;
    meta.current_page = responseMeta.current_page || 1;
    meta.per_page = responseMeta.per_page || 10;
  }

  return { data, meta };
};

const fetchData = async () => {
  try {
    isLoading.value = true;
    const params = buildFetchParams();
    const response = await props.fetchData(params);
    const { data, meta } = processResponseData(response);

    if (props.hierarchy) {
      displayData.value = data;
      total.value = flattenData(data).length;
      lastPage.value = 1;
    } else if (props.usePagination) {
      displayData.value = data;
      total.value = meta.total;
      lastPage.value = meta.last_page;
      currentPage.value = meta.current_page;
      perPage.value = meta.per_page;
    } else {
      displayData.value = data;
      total.value = data.length;
      lastPage.value = 1;
    }
  } catch (err) {
    console.error(`Failed to fetch ${props.dataType}:`, err);
    displayData.value = [];
    total.value = 0;
    lastPage.value = 1;
  } finally {
    isLoading.value = false;
  }
};

const flattenData = (data: any[], level: number = 0): any[] => {
  const result: any[] = [];
  data.forEach((item) => {
    result.push({ ...item, level });
    if (item.children && item.children.length > 0) {
      result.push(...flattenData(item.children, level + 1));
    }
  });
  return result;
};

const debouncedFetchData = debounce(fetchData, 300);

const resetFilters = () => {
  if (props.filtersConfig) {
    filters.value = props.filtersConfig.reduce(
      (acc, filter) => ({
        ...acc,
        [filter.key]:
          filter.type === "date-range" || filter.type === "number-range"
            ? { start: null, end: null, min: null, max: null }
            : filter.type === "multiselect"
              ? []
              : null,
      }),
      {},
    );
  }
  searchQuery.value = "";
  currentPage.value = 1;
  sortKey.value = "";
  sortOrder.value = "asc";
  expandedRows.value.clear();
  debouncedFetchData();
};

const applyFilters = () => debouncedFetchData();

const updateCustomFilter = (key: string, value: any) => {
  filters.value[key] = value;
  debouncedFetchData();
};

const validateDateRange = (key: string) => {
  const filter = filters.value[key];
  if (filter.start && filter.end && filter.start > filter.end) filter.end = null;
};

const validateNumberRange = (key: string) => {
  const filter = filters.value[key];
  if (filter.min && filter.max && filter.min > filter.max) filter.max = null;
};

const handleAction = ({ action, row }: { action: DataTableAction; row: any }) => {
  if (action.requiresConfirmation) {
    confirmMessage.value =
      action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()}?`;
    pendingAction.value = { action, row };
    showConfirmDialog.value = true;
  } else {
    action.handler(row);
  }
};

const executeConfirmedAction = () => {
  if (pendingAction.value) {
    pendingAction.value.action.handler(pendingAction.value.row);
    showConfirmDialog.value = false;
    pendingAction.value = null;
    confirmMessage.value = "";
  }
};

const toggleSort = (key: string) => {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
  debouncedFetchData();
  emit("sort-change", { key: sortKey.value, order: sortOrder.value });
};

const changePage = (page: number) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page;
    debouncedFetchData();
    emit("page-change", page);
  }
};

const toggleRow = (row: any) => {
  const id = row.id.toString();
  if (expandedRows.value.has(id)) expandedRows.value.delete(id);
  else expandedRows.value.add(id);
};

const getActionsColumnWidth = () => {
  if (!props.actions) return "w-[50px]";
  if (actionDisplayMode.value === "horizontal") {
    const actionCount = props.actions.length;
    const partitionCount = partitionActions.value ? actionPartitions.value.length : 1;
    const separatorWidth = partitionActions.value ? (partitionCount - 1) * 16 : 0;
    const buttonWidth = actionCount * 36 + separatorWidth;
    return `w-[${Math.max(buttonWidth, 120)}px]`;
  }
  return "w-[50px]";
};

/**
 * Handles drag end event - computes new order and calls API
 */
const handleDragEnd = async () => {
  if (!props.draggableConfig?.onReorder) return;

  const orderField = props.draggableConfig.orderField || "order";
  const idField = props.draggableConfig.idField || "id";

  // Build reorder items with new order values
  const items: ReorderItem[] = displayData.value.map((row, index) => ({
    id: row[idField],
    order: index + 1,
  }));

  try {
    isReordering.value = true;
    await props.draggableConfig.onReorder(items);
    emit("reorder-end", items);

    // Update local data with new order values
    displayData.value.forEach((row, index) => {
      row[orderField] = index + 1;
    });
  } catch {
    // Revert to original order on failure - refetch data
    await fetchData();
  } finally {
    isReordering.value = false;
  }
};

/**
 * Toggle drag mode active state
 */
const toggleDragMode = () => {
  isDragModeActive.value = !isDragModeActive.value;
};

watch(
  () => props.columns,
  (columns) => {
    columnVisibility.value = columns.reduce(
      (acc, column) => ({ ...acc, [column.accessorKey]: true }),
      {},
    );
  },
  { immediate: true },
);

watch(
  () => props.filtersConfig,
  (config) => {
    if (config) {
      filters.value = config.reduce(
        (acc, filter) => ({
          ...acc,
          [filter.key]:
            filter.type === "date-range" || filter.type === "number-range"
              ? { start: null, end: null, min: null, max: null }
              : filter.type === "multiselect"
                ? []
                : null,
        }),
        {},
      );
    }
  },
  { immediate: true },
);

watch(filters, () => emit("filter-change", filters.value), { deep: true });

watch(perPage, (newSize) => emit("page-size-change", Number(newSize)));

onMounted(() => {
  fetchData();
  emitter.on(props.refreshKey, fetchData);
});

onBeforeUnmount(() => emitter.off(props.refreshKey));
</script>

<style scoped>
.transition-all {
  transition-property: all;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
.resize-x {
  resize: horizontal;
  position: relative;
}
.resize-x::after {
  content: "";
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
}
.resize-x:hover::after {
  background: rgba(0, 0, 0, 0.1);
}
</style>
