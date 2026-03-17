<template>
  <div>
    <ErrorViewer :isOpen="!!error" :message="error" @close="error = ''" />

    <DataTable
      :data-type="'year'"
      :columns="yearColumns"
      :actions="yearActions"
      :fetch-data="fetchYears"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="year-create">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary/20 hover:text-primary cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Year
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showDialog"
      :mode="editYear ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editYear"
      :loading="isLoading"
      formId="year-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="yearToDelete?.year"
      deletableDescription="This action cannot be undone. This will permanently delete the year and its related data."
      @confirm="confirmDeleteYear"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { emitter } from "@/events/eventBus";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import { yearService } from "@/services/yearService";
import type { Year, CreateYearData, UpdateYearData } from "@/types/years/year";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import { useYearForm } from "@/composables/useYearForm";
import StatusCell from "@/components/custom/jsx/global/StatusCell";

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const editYear = ref<Year | null>(null);
const yearToDelete = ref<Year | null>(null);
const error = ref("");
const isLoading = ref(false);

const TRIGGER_REFRESH = "refresh-years";

const { formConfig } = useYearForm(editYear);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage years effectively.",
    steps: [
      "Use the search bar to filter years by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete years.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const yearColumns: DataTableColumn<Year>[] = [
  { accessorKey: "year", header: "Year", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusCell,
  },
];

const yearActions: DataTableAction<Year>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (year: Year) => {
      editYear.value = year;
      showDialog.value = true;
    },
    partition: 1,
    permission: "year-update",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (year: Year) => {
      yearToDelete.value = year;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "year-delete",
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

const fetchYears = async (params: Record<string, any>): Promise<PaginatedResponse<Year>> => {
  try {
    const response = await yearService.list(params);
    error.value = "";
    console.log("actual response", response);
    return response;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch years";
    return createEmptyPaginatedResponse<Year>();
  }
};

const handleCreate = () => {
  editYear.value = null;
  showDialog.value = true;
};

const handleCancel = () => {
  editYear.value = null;
};

const handleSubmit = async (data: CreateYearData | UpdateYearData) => {
  isLoading.value = true;
  try {
    if (editYear.value && editYear.value.id) {
      await yearService.update(editYear.value.id, data);
    } else {
      await yearService.create(data as CreateYearData);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showDialog.value = false;
    editYear.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save year";
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteYear = async () => {
  if (!yearToDelete.value) return;

  try {
    if (yearToDelete.value.id) {
      await yearService.delete(yearToDelete.value.id);
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete year";
  } finally {
    showDeleteDialog.value = false;
    yearToDelete.value = null;
  }
};
</script>
