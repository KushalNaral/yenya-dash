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
      data-type="District Populations"
      :columns="districtPopulationColumns"
      :actions="districtPopulationActions"
      :fetch-data="fetchDistrictPopulations"
      :use-pagination="true"
      :filters-config="filtersConfig"
      data-key="data"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <div class="flex gap-2">
          <PermissionGuard permission="districtpopulation-export">
            <Button
              size="sm"
              title="Export Excel"
              class="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all duration-200 hover:scale-105 cursor-pointer"
              @click="handleExportExcel"
            >
              <Iconify icon="bytesize:export" class="w-4 h-4" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="districtpopulation-import">
            <Button
              size="sm"
              title="Import Excel"
              class="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all duration-200 hover:scale-105 cursor-pointer"
              @click="showUploadDialog = true"
            >
              <Iconify icon="uil:import" class="w-4 h-4" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="districtpopulation-create">
            <Button
              size="sm"
              class="shrink-0 hover:bg-primary/20 hover:text-primary cursor-pointer transition-all duration-300"
              @click="handleCreate"
            >
              Create New
            </Button>
          </PermissionGuard>
        </div>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editDistrictPopulation ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editDistrictPopulation"
      :loading="isLoading"
      formId="district-population-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <!-- Upload Excel Dialog -->
    <Dialog :open="showUploadDialog" @update:open="showUploadDialog = $event">
      <FormWrapper
        mode="upload"
        @submit="handleExcelUpload"
        @cancel="showUploadDialog = false"
        :editTag="false"
      >
        <Button
          class="px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 hover:scale-105 cursor-pointer"
          @click="downloadSampleExcel"
        >
          Download Sample Excel
        </Button>
        <div class="space-y-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileChange"
            class="block w-full border rounded p-2"
            required
          />
        </div>
      </FormWrapper>
    </Dialog>
    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="districtPopulationToDelete?.district_name"
      deletableDescription="This action cannot be undone. This will permanently delete the districtPopulation and its related data."
      @confirm="confirmDeleteDistrictPopulation"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { downloadExcel } from "@/helpers/excelHelper";
import { emitter } from "@/events/eventBus";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import { districtPopulationService } from "@/services/districtPopulationService";
import type {
  DistrictPopulation,
  DistrictPopulationCreate,
  DistrictPopulationUpdate,
} from "@/types/districtPopulations/districtPopulation";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import { useDistrictPopulationForm } from "@/composables/useDistrictPopulationForm";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const editDistrictPopulation = ref<DistrictPopulation | null>(null);
const districtPopulationToDelete = ref<DistrictPopulation | null>(null);
const error = ref<string | null>("");
const isLoading = ref(false);

const TRIGGER_REFRESH = "refresh-district-population";

const { formConfig, fetchDistricts, fetchYears } =
  useDistrictPopulationForm(editDistrictPopulation);

watch(
  () => showCreateDialog.value,
  async (isOpen) => {
    if (isOpen) {
      await fetchDistricts();
      await fetchYears();
    }
  },
);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage districtPopulations effectively.",
    steps: [
      "Use the search bar to filter districtPopulations by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete districtPopulations.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const districtPopulationColumns: DataTableColumn<DistrictPopulation>[] = [
  { accessorKey: "district_name", header: "DISTRICT", sortable: true },
  { accessorKey: "total_population", header: "TOTAL POPULATION", sortable: true },
  { accessorKey: "under_1", header: "UNDER 1 POPULATION", sortable: true },
  { accessorKey: "under_5", header: "UNDER 5 POPULATION", sortable: true },
  { accessorKey: "under_15", header: "UNDER 15 POPULATION", sortable: true },
  { accessorKey: "year_name", header: "YEAR", sortable: true },
];

const districtPopulationActions: DataTableAction<DistrictPopulation>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (districtPopulation: DistrictPopulation) => {
      editDistrictPopulation.value = districtPopulation;
      showCreateDialog.value = true;
    },
    partition: 1,
    permission: "districtpopulation-update",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (districtPopulation: DistrictPopulation) => {
      districtPopulationToDelete.value = districtPopulation;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    partition: 2,
    permission: "districtpopulation-delete",
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

const fetchDistrictPopulations = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<DistrictPopulation>> => {
  try {
    const response = await districtPopulationService.list(params);
    console.log("response", response);
    error.value = "";
    return response;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch districtPopulations";
    return createEmptyPaginatedResponse<DistrictPopulation>();
  }
};

const handleCreate = () => {
  editDistrictPopulation.value = null;
  showCreateDialog.value = true;
};

const handleSubmit = async (data: DistrictPopulationCreate | DistrictPopulationUpdate) => {
  isLoading.value = true;
  try {
    const updId = editDistrictPopulation.value?.id;
    if (typeof updId === "number") {
      await districtPopulationService.update(updId, data);
    } else {
      await districtPopulationService.create(data as DistrictPopulationCreate);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editDistrictPopulation.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save districtPopulation";
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  showCreateDialog.value = false;
  editDistrictPopulation.value = null;
};

const confirmDeleteDistrictPopulation = async () => {
  if (!districtPopulationToDelete.value) return;

  try {
    const delId = districtPopulationToDelete.value.id;
    if (typeof delId === "number") {
      await districtPopulationService.delete(delId);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
  } catch (err: any) {
    error.value = err.message || "Failed to delete districtPopulation";
  } finally {
    showDeleteDialog.value = false;
    districtPopulationToDelete.value = null;
  }
};

const showUploadDialog = ref(false);
const uploadFile = ref<File | null>(null);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    uploadFile.value = target.files[0];
  }
};

const handleExcelUpload = async () => {
  if (!uploadFile.value) {
    error.value = "Please select a file before uploading.";
    return;
  }

  const formData = new FormData();
  formData.append("file", uploadFile.value);

  try {
    await districtPopulationService.uploadExcel(formData);
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showUploadDialog.value = false;
    uploadFile.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to upload Excel file";
  }
};

const retryFunction = () => {
  error.value = null;
  fetchDistrictPopulations({});
};

const contactSupport = () => {
  // Implement contact support logic
};

const downloadSampleExcel = () => {
  const data = [
    ["DISTRICT", "TOTAL_POPULATION", "UNDER_1", "UNDER_5", "UNDER_15", "YEAR"],
    ["ACHHAM", 4000, 40, 40, 50, 2019],
    ["BHOJPUR", 5000, 30, 50, 60, 2019],
  ];

  downloadExcel(data, "who_district_population_sample.xlsx");
};
const handleExportExcel = async () => {
  try {
    await districtPopulationService.exportExcel();
  } catch (err: any) {
    error.value = err.message || "Failed to export Excel file";
  }
};
</script>
