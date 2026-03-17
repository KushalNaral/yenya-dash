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
      data-type="Provinces"
      :columns="provinceColumns"
      :actions="provinceActions"
      :fetch-data="fetchProvinces"
      :use-pagination="true"
      :filters-config="filtersConfig"
      data-key="data"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="province-create">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary/20 hover:text-primary cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Province
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showDialog"
      :mode="editProvince ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editProvince"
      :loading="isLoading"
      formId="province-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="provinceToDelete?.NAME"
      deletableDescription="This action cannot be undone. This will permanently delete the province and its related data."
      @confirm="confirmDeleteProvince"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DataTable from "@/components/builders/DataTable.vue";
import { emitter } from "@/events/eventBus";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import { provinceService } from "@/services/provinceService";
import type { Province } from "@/types/provinces/province";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { CreateProvinceData, UpdateProvinceData } from "@/types/provinces/province";
import { useProvinceForm } from "@/composables/useProvinceForm";

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const editProvince = ref<Province | null>(null);
const provinceToDelete = ref<Province | null>(null);
const error = ref<string | null>("");
const isLoading = ref(false);

const TRIGGER_REFRESH = "refresh-province";

const { formConfig } = useProvinceForm(editProvince);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage provinces effectively.",
    steps: [
      "Use the search bar to filter provinces by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete provinces.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const provinceColumns: DataTableColumn<Province>[] = [
  { accessorKey: "NAME", header: "NAME", sortable: true },
  { accessorKey: "CODE", header: "CODE", sortable: true },
];

const provinceActions: DataTableAction<Province>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (province: Province) => {
      editProvince.value = province;
      showDialog.value = true;
    },
    partition: 1,
    permission: "province-update",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (province: Province) => {
      provinceToDelete.value = province;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "delete-province",
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

const fetchProvinces = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<Province>> => {
  try {
    const response = await provinceService.list(params);
    error.value = null;
    return response as PaginatedResponse<Province>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch provinces";
    return createEmptyPaginatedResponse<Province>();
  }
};

const handleCreate = () => {
  editProvince.value = null;
  showDialog.value = true;
};

const handleSubmit = async (data: CreateProvinceData | UpdateProvinceData) => {
  isLoading.value = true;
  try {
    if (editProvince.value && editProvince.value.ID) {
      await provinceService.update(editProvince.value.ID, data);
    } else {
      await provinceService.create(data as CreateProvinceData);
    }
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
    showDialog.value = false;
    editProvince.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save province";
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  showDialog.value = false;
  editProvince.value = null;
};

const confirmDeleteProvince = async () => {
  if (!provinceToDelete.value) return;

  try {
    if (provinceToDelete.value.ID) {
      await provinceService.delete(provinceToDelete.value.ID);
      error.value = null;
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete province";
  } finally {
    showDeleteDialog.value = false;
    provinceToDelete.value = null;
  }
};

const retryFunction = () => {
  error.value = "";
  fetchProvinces({});
};

const contactSupport = () => {
  // Implement contact support logic
};
</script>
