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
      data-type="Districts"
      :columns="districtColumns"
      :actions="districtActions"
      :fetch-data="fetchDistricts"
      :use-pagination="true"
      :filters-config="filtersConfig"
      data-key="data"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="district-create">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary/20 hover:text-primary cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create District
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showDialog"
      :mode="editDistrict ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editDistrict"
      :loading="isLoading"
      formId="district-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="districtToDelete?.NAME"
      deletableDescription="This action cannot be undone. This will permanently delete the district and its related data."
      @confirm="confirmDeleteDistrict"
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
import { Button } from "@/components/ui/button";
import { districtService } from "@/services/districtService";
import type { District } from "@/types/districts/district";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { CreateDistrictData, UpdateDistrictData } from "@/types/districts/district";
import { useDistrictForm } from "@/composables/useDistrictForm";

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const editDistrict = ref<District | null>(null);
const districtToDelete = ref<District | null>(null);
const error = ref<string | null>("");
const isLoading = ref(false);

const TRIGGER_REFRESH = "refresh-district";

const { formConfig, fetchProvinces: fetchProvinceOptions } = useDistrictForm(editDistrict);

watch(
  () => showDialog.value,
  async (isOpen) => {
    if (isOpen) {
      await fetchProvinceOptions();
    }
  },
);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage districts effectively.",
    steps: [
      "Use the search bar to filter districts by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete districts.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const districtColumns: DataTableColumn<District>[] = [
  { accessorKey: "PROVINCE_ID", header: "PROVINCE ID", sortable: true },
  { accessorKey: "PROVINCE_NAME", header: "PROVINCE NAME", sortable: true },
  { accessorKey: "NAME", header: "NAME", sortable: true },
  { accessorKey: "CODE", header: "CODE", sortable: true },
];

const districtActions: DataTableAction<District>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (district: District) => {
      editDistrict.value = district;
      showDialog.value = true;
    },
    partition: 1,
    permission: "district-update",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (district: District) => {
      districtToDelete.value = district;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "district-delete",
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

const fetchDistricts = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<District>> => {
  try {
    const response = await districtService.list(params);
    error.value = null;
    return response as PaginatedResponse<District>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch districts";
    return createEmptyPaginatedResponse<District>();
  }
};

const handleCreate = () => {
  editDistrict.value = null;
  showDialog.value = true;
};

const handleSubmit = async (data: CreateDistrictData | UpdateDistrictData) => {
  isLoading.value = true;
  try {
    if (editDistrict.value && editDistrict.value.ID) {
      await districtService.update(editDistrict.value.ID, data);
    } else {
      await districtService.create(data as CreateDistrictData);
    }
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
    showDialog.value = false;
    editDistrict.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save district";
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  showDialog.value = false;
  editDistrict.value = null;
};

const confirmDeleteDistrict = async () => {
  if (!districtToDelete.value || !districtToDelete.value.ID) return;

  try {
    if (districtToDelete.value.ID) {
      await districtService.delete(districtToDelete.value.ID);
    } else {
      throw new Error("Invalid district id");
    }
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
  } catch (err: any) {
    error.value = err.message || "Failed to delete district";
  } finally {
    showDeleteDialog.value = false;
    districtToDelete.value = null;
  }
};

const retryFunction = () => {
  error.value = "";
  fetchDistricts({});
};

const contactSupport = () => {
  // Implement contact support logic
};
</script>
