<template>
  <div>
    <DataTable
      :data-type="'career'"
      :columns="careerColumns"
      :actions="careerActions"
      :fetch-data="fetchCareers"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-careers">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Career
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editCareer ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editCareer"
      :loading="isLoading"
      :server-errors="errors"
      formId="career-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="careerToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the career and its related data."
      @confirm="confirmDeleteCareer"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { careerService } from "@/services/careerService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type { Career, CreateCareerData, UpdateCareerData } from "@/types/careers/career";
import { useCareerForm } from "@/composables/useCareerForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const careerToDelete = ref<Career | null>(null);
const editCareer = ref<Career | null>(null);
const TRIGGER_REFRESH = "refresh-careers";
const errors = ref<Record<string, string[]>>({});
const isLoading = ref(false);

const { formConfig } = useCareerForm(editCareer);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "Manage career openings and job postings.",
    steps: [
      "Use the search bar to filter careers by job title.",
      "Apply status filters to narrow down the list.",
      "Use action buttons to edit, activate/deactivate, or delete careers.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const careerColumns: DataTableColumn<Career>[] = [
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
  { accessorKey: "name", header: "Job Title", sortable: true },
  { accessorKey: "position", header: "Position", sortable: true },
  { accessorKey: "level", header: "Level", sortable: true },
  { accessorKey: "required_no", header: "Positions", sortable: false },
  { accessorKey: "validity", header: "Validity", sortable: false },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        careerService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const careerActions: DataTableAction<Career>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (career: Career) => {
      editCareer.value = career;
      showCreateDialog.value = true;
    },
    permission: "update-careers",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (career: Career) => {
      careerToDelete.value = career;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-careers",
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

const fetchCareers = async (params: Record<string, any>): Promise<PaginatedResponse<Career>> => {
  try {
    const response = await careerService.list(params);
    errors.value = {};
    return response as PaginatedResponse<Career>;
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
    return createEmptyPaginatedResponse<Career>();
  }
};

const handleCreate = () => {
  editCareer.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editCareer.value = null;
};

const handleSubmit = async (data: CreateCareerData | UpdateCareerData) => {
  isLoading.value = true;
  try {
    if (editCareer.value && editCareer.value.id) {
      await careerService.update(editCareer.value.id, data);
    } else {
      await careerService.create(data as CreateCareerData);
    }
    errors.value = {};
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editCareer.value = null;
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteCareer = async () => {
  if (!careerToDelete.value) return;

  try {
    if (careerToDelete.value.id) {
      await careerService.delete(careerToDelete.value.id);
      errors.value = {};
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    errors.value = (err?.cause as { errors?: Record<string, string[]> } | undefined)?.errors || {};
  } finally {
    showDeleteDialog.value = false;
    careerToDelete.value = null;
  }
};
</script>
