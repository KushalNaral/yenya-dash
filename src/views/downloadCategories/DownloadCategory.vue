<template>
  <div>
    <DataTable
      :data-type="'download-category'"
      :columns="downloadCategoryColumns"
      :actions="downloadCategoryActions"
      :fetch-data="fetchDownloadCategories"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-download-categories">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Download Category
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editDownloadCategory ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editDownloadCategory"
      :loading="isLoading"
      formId="download-category-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="downloadCategoryToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the download category and its related data."
      @confirm="confirmDeleteDownloadCategory"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { downloadCategoryService } from "@/services/downloadCategoryService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type {
  DownloadCategory,
  CreateDownloadCategoryData,
  UpdateDownloadCategoryData,
} from "@/types/downloadCategories/downloadCategory";
import { useDownloadCategoryForm } from "@/composables/useDownloadCategoryForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const downloadCategoryToDelete = ref<DownloadCategory | null>(null);
const editDownloadCategory = ref<DownloadCategory | null>(null);
const TRIGGER_REFRESH = "refresh-download-categories";
const error = ref("");
const isLoading = ref(false);

const { formConfig } = useDownloadCategoryForm(editDownloadCategory);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage download categories effectively.",
    steps: [
      "Use the search bar to filter categories by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete categories.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const downloadCategoryColumns: DataTableColumn<DownloadCategory>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "slug", header: "Slug", sortable: false },
  { accessorKey: "order", header: "Order", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        downloadCategoryService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const downloadCategoryActions: DataTableAction<DownloadCategory>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (downloadCategory: DownloadCategory) => {
      editDownloadCategory.value = downloadCategory;
      showCreateDialog.value = true;
    },
    permission: "update-download-categories",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (downloadCategory: DownloadCategory) => {
      downloadCategoryToDelete.value = downloadCategory;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-download-categories",
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

const fetchDownloadCategories = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<DownloadCategory>> => {
  try {
    const response = await downloadCategoryService.list(params);
    error.value = "";
    return response as PaginatedResponse<DownloadCategory>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch download categories";
    return createEmptyPaginatedResponse<DownloadCategory>();
  }
};

const handleCreate = () => {
  editDownloadCategory.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editDownloadCategory.value = null;
};

const handleSubmit = async (data: CreateDownloadCategoryData | UpdateDownloadCategoryData) => {
  isLoading.value = true;
  try {
    if (editDownloadCategory.value && editDownloadCategory.value.id) {
      await downloadCategoryService.update(editDownloadCategory.value.id, data);
    } else {
      await downloadCategoryService.create(data as CreateDownloadCategoryData);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editDownloadCategory.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save download category";
    // Keep dialog open on error so user can fix and retry
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteDownloadCategory = async () => {
  if (!downloadCategoryToDelete.value) return;

  try {
    if (downloadCategoryToDelete.value.id) {
      await downloadCategoryService.delete(downloadCategoryToDelete.value.id);
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete download category";
  } finally {
    showDeleteDialog.value = false;
    downloadCategoryToDelete.value = null;
  }
};
</script>
