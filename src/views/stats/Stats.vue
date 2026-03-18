<template>
  <div>
    <DataTable
      :data-type="'stats'"
      :columns="statsColumns"
      :actions="statsActions"
      :fetchData="fetchStats"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-stats">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Stats
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editStats ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editStats"
      :loading="isLoading"
      :server-errors="errors"
      formId="stats-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="statsToDelete?.title"
      deletableDescription="This action cannot be undone. This will permanently delete the stats and its related data."
      @confirm="confirmDeleteStats"
      @cancel="showDeleteDialog = false"
      mode="delete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { statsService } from "@/services/statsService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type {
  DataTableColumn,
  DataTableAction,
  DataTableHelpSection,
} from "@/types/datatable";
import type {
  Stats,
  CreateStatsData,
  UpdateStatsData,
} from "@/types/stats/stats";
import { useStatsForm } from "@/composables/useStatsForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const statsToDelete = ref<Stats | null>(null);
const editStats = ref<Stats | null>(null);
const TRIGGER_REFRESH = "refresh-stats";
const errors = ref<Record<string, string[]>>({});
const isLoading = ref(false);
const { formConfig } = useStatsForm(editStats);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage stats effectively.",
    steps: [
      "Use the search bar to filter stats by title.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete stats.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const statsColumns: DataTableColumn<Stats>[] = [
  {
    accessorKey: "primary_image.url",
    header: "Image",
    cell: ({ value }: any) => {
      const url = value;
      return url
        ? `<img src="${url}" class="w-12 h-12 object-cover rounded shadow-sm" />`
        : '<div class="w-12 h-12 bg-muted flex items-center justify-center rounded text-[10px] text-muted-foreground">No Image</div>';
    },
  },
  { accessorKey: "title", header: "Title", sortable: true },
  { accessorKey: "description", header: "Description", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        statsService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const statsActions: DataTableAction<Stats>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (stats: Stats) => {
      editStats.value = stats;
      showCreateDialog.value = true;
    },
    permission: "update-stats",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (stats: Stats) => {
      statsToDelete.value = stats;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-stats",
  },
];

const filtersConfig = ref([
  {
    key: "status",
    label: "Status",
    options: [
      { value: 1, label: "Active" },
      { value: 0, label: "Inactive" },
    ],
  },
]);

const fetchStats = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<Stats>> => {
  try {
    const response = await statsService.list(params);
    errors.value = {};
    return response as PaginatedResponse<Stats>;
  } catch (err: any) {
    errors.value = err.cause.errors;
    return createEmptyPaginatedResponse<Stats>();
  }
};

const handleCreate = () => {
  editStats.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editStats.value = null;
};

const handleSubmit = async (data: CreateStatsData | UpdateStatsData) => {
  isLoading.value = true;
  try {
    if (editStats.value && editStats.value.id) {
      await statsService.update(editStats.value.id, data);
    } else {
      await statsService.create(data as CreateStatsData);
    }
    errors.value = {};
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editStats.value = null;
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in stats");
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteStats = async () => {
  if (!statsToDelete.value) return;

  try {
    if (statsToDelete.value.id) {
      await statsService.delete(statsToDelete.value.id);
      errors.value = {};
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in stats");
  } finally {
    showDeleteDialog.value = false;
    statsToDelete.value = null;
  }
};
</script>
