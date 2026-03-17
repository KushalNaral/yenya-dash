<template>
  <div>
    <DataTable
      :data-type="'download'"
      :columns="downloadColumns"
      :actions="downloadActions"
      :fetch-data="fetchDownloads"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-downloads">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Download
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editDownload ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editDownload"
      :loading="isLoading"
      formId="download-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="downloadToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the download and its related data."
      @confirm="confirmDeleteDownload"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { downloadService } from "@/services/downloadService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type { Download, CreateDownloadData, UpdateDownloadData } from "@/types/downloads/download";
import { useDownloadForm } from "@/composables/useDownloadForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const downloadToDelete = ref<Download | null>(null);
const editDownload = ref<Download | null>(null);
const TRIGGER_REFRESH = "refresh-downloads";
const error = ref("");
const isLoading = ref(false);

const { formConfig } = useDownloadForm(editDownload);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage downloads effectively.",
    steps: [
      "Use the search bar to filter downloads by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete downloads.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const downloadColumns: DataTableColumn<Download>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  {
    accessorKey: "category.name",
    header: "Category",
    sortable: false,
    cell: ({ row }: any) => row.category?.name || "N/A",
  },
  {
    accessorKey: "primary_file.url",
    header: "File",
    cell: ({ value }: any) => {
      const url = value;
      return url
        ? `<a href="${url}" target="_blank" class="text-primary hover:underline">View File</a>`
        : '<span class="text-muted-foreground">No File</span>';
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        downloadService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const downloadActions: DataTableAction<Download>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (download: Download) => {
      editDownload.value = download;
      showCreateDialog.value = true;
    },
    permission: "update-downloads",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (download: Download) => {
      downloadToDelete.value = download;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-downloads",
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

const fetchDownloads = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<Download>> => {
  try {
    const response = await downloadService.list(params);
    error.value = "";
    return response as PaginatedResponse<Download>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch downloads";
    return createEmptyPaginatedResponse<Download>();
  }
};

const handleCreate = () => {
  editDownload.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editDownload.value = null;
};

const handleSubmit = async (data: CreateDownloadData | UpdateDownloadData) => {
  isLoading.value = true;
  try {
    if (editDownload.value && editDownload.value.id) {
      await downloadService.update(editDownload.value.id, data);
    } else {
      await downloadService.create(data as CreateDownloadData);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editDownload.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save download";
    // Keep dialog open on error so user can fix and retry
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteDownload = async () => {
  if (!downloadToDelete.value) return;

  try {
    if (downloadToDelete.value.id) {
      await downloadService.delete(downloadToDelete.value.id);
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete download";
  } finally {
    showDeleteDialog.value = false;
    downloadToDelete.value = null;
  }
};
</script>
