<template>
  <div>
    <ErrorViewer
      :isOpen="!!error"
      :message="error"
      :furtherSteps="[
        { label: 'Retry', action: retryFunction },
        { label: 'Contact Support', action: contactSupport },
      ]"
      @close="error = ''"
    />
    <DataTable
      data-type="Aefis"
      data-key="data"
      :columns="aefiColumns"
      :actions="aefiActions"
      :fetch-data="fetchAefis"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="aefi-create">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary/20 hover:text-primary cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Aefi
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editAefi ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editAefi"
      :loading="isLoading"
      formId="aefi-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="`${aefiToDelete?.year_name || ''} ${aefiToDelete?.month_name || ''}`.trim()"
      deletableDescription="This action cannot be undone. This will permanently delete the aefi and its related data."
      @confirm="confirmDeleteAefi"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import DataTable from "@/components/builders/DataTable.vue";
import UnifiedFormDialog from "@/components/custom/UnifiedFormDialog.vue";
import { emitter } from "@/events/eventBus";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import StatusCell from "@/components/custom/jsx/global/StatusCell";
import { Button } from "@/components/ui/button";
import { aefiService } from "@/services/aefiService";
import type { Aefi } from "@/types/aefis/aefi";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { CreateAefiData, UpdateAefiData } from "@/types/aefis/aefi";
import { useAefiForm } from "@/composables/useAefiForm";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const editAefi = ref<Aefi | null>(null);
const aefiToDelete = ref<Aefi | null>(null);
const error = ref<string | null>("");
const isLoading = ref(false);

const TRIGGER_REFRESH = "refresh-aefi";

const { formConfig, fetchYears } = useAefiForm(editAefi);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage aefis effectively.",
    steps: [
      "Use the search bar to filter aefis by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete aefis.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const aefiColumns: DataTableColumn<Aefi>[] = [
  { accessorKey: "year_name", header: "Year", sortable: true },
  { accessorKey: "month_name", header: "Month", sortable: true },
  { accessorKey: "no_of_case", header: "No. of Cases", sortable: true },
  { accessorKey: "no_of_hospitalized", header: "No. of Hospitalized", sortable: true },
  { accessorKey: "no_of_death", header: "No. of Death", sortable: true },
  { accessorKey: "no_of_investigated", header: "No. of Investigated", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusCell,
  },
];

watch(
  () => showCreateDialog.value,
  async (isOpen) => {
    if (isOpen) {
      await fetchYears();
    }
  },
);

const aefiActions: DataTableAction<Aefi>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (aefi: Aefi) => {
      editAefi.value = aefi;
      showCreateDialog.value = true;
    },
    partition: 1,
    permission: "update-aefi",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (aefi: Aefi) => {
      aefiToDelete.value = aefi;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "delete-aefi",
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

const fetchAefis = async (params: Record<string, any>): Promise<PaginatedResponse<Aefi>> => {
  try {
    const response = await aefiService.list(params);
    error.value = null;
    return response as PaginatedResponse<Aefi>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch aefis";
    return createEmptyPaginatedResponse<Aefi>();
  }
};

const handleCreate = () => {
  editAefi.value = null;
  showCreateDialog.value = true;
};

const handleSubmit = async (data: CreateAefiData | UpdateAefiData) => {
  isLoading.value = true;
  try {
    const updateId = editAefi.value?.id;
    if (typeof updateId === "number") {
      await aefiService.update(updateId, data);
    } else {
      await aefiService.create(data as CreateAefiData);
    }
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editAefi.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save aefi";
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  showCreateDialog.value = false;
  editAefi.value = null;
};

const confirmDeleteAefi = async () => {
  if (!aefiToDelete.value || !aefiToDelete.value.id) return;

  try {
    await aefiService.delete(aefiToDelete.value.id);
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
  } catch (err: any) {
    error.value = err.message || "Failed to delete aefi";
  } finally {
    showDeleteDialog.value = false;
    aefiToDelete.value = null;
  }
};

const retryFunction = () => {
  error.value = "";
  fetchAefis({});
};

const contactSupport = () => {
  // Implement contact support logic
};
</script>
