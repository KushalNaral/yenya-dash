<template>
  <div class="">
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
      data-type="reporting Units"
      :columns="reportingUnitColumns"
      :actions="reportingUnitActions"
      :fetch-data="fetchReportingUnits"
      :use-pagination="true"
      :filters-config="filtersConfig"
      data-key="data"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="reportingunit-create">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Reporting Unit
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editReportingUnit ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editReportingUnit"
      :loading="isLoading"
      formId="reporting-unit-form"
      @submit="handleSubmit"
      @field-update="handleFieldUpdate"
      @cancel="
        () => {
          showCreateDialog = false;
          resetForm();
        }
      "
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="reportingUnitToDelete?.unit"
      deletableDescription="This action cannot be undone. This will permanently delete the user and remove their data."
      @confirm="confirmDeleteReportingUnit"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { reportingUnitService } from "@/services/reportingUnitService";
import DataTable from "@/components/builders/DataTable.vue";
import UnifiedFormDialog from "@/components/custom/UnifiedFormDialog.vue";
import { Button } from "@/components/ui/button";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type {
  DataTableColumn,
  DataTableAction,
  DataTableHelpSection,
  BadgeVariant,
} from "@/types/datatable";
import type { ReportingUnit } from "@/types/reportingUnit/reportingUnit";
import type {
  CreateReportingUnitData,
  UpdateReportingUnitData,
} from "@/types/reportingUnit/reportingUnit";
import { useReportingUnitForm } from "@/composables/useReportingUnitForm";
import { toISODateString } from "@/lib/utils";
import StatusCell from "@/components/custom/jsx/global/StatusCell";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const reportingUnitToDelete = ref<ReportingUnit | null>(null);
const editReportingUnit = ref<ReportingUnit | null>(null);
const TRIGGER_REFRESH = "refresh-reporting-unit";
const error = ref<string | null>("");
const isLoading = ref(false);

const { formConfig, fetchAllOptions, handleFieldUpdate } = useReportingUnitForm(editReportingUnit);

const optionsLoaded = ref(false);
watch(
  () => showCreateDialog.value,
  async (isOpen) => {
    if (isOpen && !optionsLoaded.value) {
      await fetchAllOptions();
      optionsLoaded.value = true;
    }
  },
);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage user accounts effectively.",
    steps: [
      "Use the search bar to filter users by name or email.",
      "Apply role or status filters to narrow down the list.",
      "Use action buttons to edit, activate/deactivate, reset password, or delete users.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const reportingUnitColumns: DataTableColumn<ReportingUnit>[] = [
  { accessorKey: "field_office_id", header: "Field Office ", sortable: true },
  { accessorKey: "province_name", header: "Province", sortable: true },
  { accessorKey: "district_name", header: "District", sortable: true },
  { accessorKey: "municipality_name", header: "Municipality", sortable: true },
  { accessorKey: "ward", header: "Ward", sortable: true },
  { accessorKey: "unit", header: "Name of unit", sortable: true },
  { accessorKey: "institution_code", header: "Institution Code", sortable: true },
  { accessorKey: "ownership", header: "Ownership", sortable: true },
  { accessorKey: "focal_person", header: "Name of focal person", sortable: true },
  { accessorKey: "phone_no", header: "Phone No", sortable: true },
  { accessorKey: "category", header: "Category", sortable: true },
  { accessorKey: "frequency_of_visit", header: "Frequency of Visit", sortable: true },
  { accessorKey: "date_of_establishment", header: "Date of Establishment", sortable: true },
  { accessorKey: "date_of_update", header: "Date of Update", sortable: true },
  { accessorKey: "case_based_measles_site", header: "Case Based Measles Site", sortable: true },
  { accessorKey: "aes_sentinel_sites", header: "AES Sentinel Sites", sortable: true },
  { accessorKey: "a_s", header: "A/S", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusCell,
    statusMap: {
      1: { label: "Functional", variant: "success" as BadgeVariant },
      2: { label: "Dropped", variant: "destructive" as BadgeVariant },
      3: { label: "On Trial", variant: "secondary" as BadgeVariant },
    },
  },
];

const reportingUnitActions: DataTableAction<ReportingUnit>[] = [
  {
    label: "Edit",
    icon: "mdi-pencil",
    handler: (reportingUnit: ReportingUnit) => {
      editReportingUnit.value = reportingUnit;
      showCreateDialog.value = true;
    },
    permission: "reportingunit-update",
  },
  {
    label: "Delete",
    icon: "mdi-trash-can",
    handler: (reportingunit: ReportingUnit) => {
      reportingUnitToDelete.value = reportingunit;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "reportingunit-delete",
  },
];

const filtersConfig = ref([
  {
    key: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
]);

const fetchReportingUnits = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<ReportingUnit>> => {
  try {
    const response = await reportingUnitService.list(params);
    error.value = null;
    return response as PaginatedResponse<ReportingUnit>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch reporting units";
    return createEmptyPaginatedResponse<ReportingUnit>();
  }
};

const handleCreate = () => {
  editReportingUnit.value = null;
  showCreateDialog.value = true;
};

const handleSubmit = async (data: CreateReportingUnitData | UpdateReportingUnitData) => {
  isLoading.value = true;
  const payload = {
    ...data,
    date_of_establishment: data.date_of_establishment
      ? toISODateString(data.date_of_establishment || null)
      : null,
    date_of_update: data.date_of_update ? toISODateString(data.date_of_update || null) : null,
  };
  try {
    if (editReportingUnit.value && editReportingUnit.value.id !== undefined) {
      await reportingUnitService.update(editReportingUnit.value.id, data);
    } else {
      await reportingUnitService.create(payload as CreateReportingUnitData);
    }

    resetForm();
    editReportingUnit.value = null;
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
  } catch (err: any) {
    error.value = err.message || "Failed to save user";
    showCreateDialog.value = true;
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  // no-op here; dialog closes and initialValues reset by composable on open
};

const retryFunction = () => {
  error.value = "";
  fetchReportingUnits({});
};

const confirmDeleteReportingUnit = async () => {
  if (!reportingUnitToDelete.value || reportingUnitToDelete.value.id === undefined) return;

  try {
    await reportingUnitService.delete(reportingUnitToDelete.value.id);
    error.value = null;
    emitter.emit(TRIGGER_REFRESH);
  } catch (err: any) {
    error.value = err.message || "Failed to delete user";
  } finally {
    showDeleteDialog.value = false;
    reportingUnitToDelete.value = null;
  }
};

const contactSupport = () => {
  window.location.href = "mailto:support@example.com";
};
</script>
