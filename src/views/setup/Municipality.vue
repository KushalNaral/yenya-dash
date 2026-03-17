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
      data-type="Municipalities"
      :columns="municipalityColumns"
      :actions="municipalityActions"
      :fetch-data="fetchMunicipalitys"
      :use-pagination="true"
      :filters-config="filtersConfig"
      data-key="data"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="municipality-create">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary/20 hover:text-primary cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Municipality
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showDialog"
      :mode="editMunicipality ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editMunicipality"
      :loading="isLoading"
      formId="municipality-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="municipalityToDelete?.NAME"
      deletableDescription="This action cannot be undone. This will permanently delete the municipality and its related data."
      @confirm="confirmDeleteMunicipality"
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
import { municipalityService } from "@/services/municipalityService";
import type { Municipality } from "@/types/municipalitys/municipality";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type {
  CreateMunicipalityData,
  UpdateMunicipalityData,
} from "@/types/municipalitys/municipality";
import { useMunicipalityForm } from "@/composables/useMunicipalityForm";

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const editMunicipality = ref<Municipality | null>(null);
const municipalityToDelete = ref<Municipality | null>(null);
const error = ref<string | null>("");
const isLoading = ref(false);

const TRIGGER_REFRESH = "refresh-municipality";

const { formConfig, fetchDistricts: fetchDistrictOptions } = useMunicipalityForm(editMunicipality);

watch(
  () => showDialog.value,
  async (isOpen) => {
    if (isOpen) {
      await fetchDistrictOptions();
    }
  },
);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage municipalitys effectively.",
    steps: [
      "Use the search bar to filter municipalitys by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete municipalitys.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const municipalityColumns: DataTableColumn<Municipality>[] = [
  { accessorKey: "DISTRICT_ID", header: "DISTRICT ID", sortable: true },
  { accessorKey: "DISTRICT_NAME", header: "DISTRICT NAME", sortable: true },
  { accessorKey: "NAME", header: "NAME", sortable: true },
];

const municipalityActions: DataTableAction<Municipality>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (municipality: Municipality) => {
      editMunicipality.value = municipality;
      showDialog.value = true;
    },
    partition: 1,
    permission: "municipality-update",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (municipality: Municipality) => {
      municipalityToDelete.value = municipality;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "municipality-delete",
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

const fetchMunicipalitys = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<Municipality>> => {
  try {
    const response = await municipalityService.list(params);
    error.value = null;
    return response as PaginatedResponse<Municipality>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch municipalitys";
    return createEmptyPaginatedResponse<Municipality>();
  }
};

const handleCreate = () => {
  editMunicipality.value = null;
  showDialog.value = true;
};

const handleSubmit = async (data: CreateMunicipalityData | UpdateMunicipalityData) => {
  isLoading.value = true;
  try {
    if (editMunicipality.value && editMunicipality.value.ID) {
      await municipalityService.update(editMunicipality.value.ID, data);
    } else {
      await municipalityService.create(data as CreateMunicipalityData);
    }
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
    showDialog.value = false;
    editMunicipality.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save municipality";
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  showDialog.value = false;
  editMunicipality.value = null;
};

const confirmDeleteMunicipality = async () => {
  if (!municipalityToDelete.value || !municipalityToDelete.value.ID) return;

  try {
    await municipalityService.delete(municipalityToDelete.value.ID);
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
  } catch (err: any) {
    error.value = err.message || "Failed to delete municipality";
  } finally {
    showDeleteDialog.value = false;
    municipalityToDelete.value = null;
  }
};

const retryFunction = () => {
  error.value = "";
  fetchMunicipalitys({});
};

const contactSupport = () => {
  // Implement contact support logic
};
</script>
