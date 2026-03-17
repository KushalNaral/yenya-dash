<template>
  <div>
    <DataTable
      :data-type="'popup'"
      :columns="popupColumns"
      :actions="popupActions"
      :fetch-data="fetchPopups"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-popups">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Popup
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editPopup ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editPopup"
      :loading="isLoading"
      formId="popup-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="popupToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the popup and its related data."
      @confirm="confirmDeletePopup"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { popupService } from "@/services/popupService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type { Popup, CreatePopupData, UpdatePopupData } from "@/types/popups/popup";
import { usePopupForm } from "@/composables/usePopupForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const popupToDelete = ref<Popup | null>(null);
const editPopup = ref<Popup | null>(null);
const TRIGGER_REFRESH = "refresh-popups";
const error = ref("");
const isLoading = ref(false);

const { formConfig } = usePopupForm(editPopup);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage popups effectively.",
    steps: [
      "Use the search bar to filter popups by name or title.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete popups.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const popupColumns: DataTableColumn<Popup>[] = [
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
  { accessorKey: "name", header: "Name", sortable: true },
  { accessorKey: "title", header: "Title", sortable: true },
  {
    accessorKey: "link_title",
    header: "Link Title",
    sortable: false,
  },
  {
    accessorKey: "link_url",
    header: "Link URL",
    sortable: false,
    cell: ({ value }: any) => {
      if (!value) return "N/A";
      return `<a href="${value}" target="_blank" class="text-primary hover:underline">${value.length > 30 ? value.substring(0, 30) + "..." : value}</a>`;
    },
  },
  { accessorKey: "order", header: "Order", sortable: true },
  {
    accessorKey: "start_time",
    header: "Start Time",
    sortable: true,
    cell: ({ value }: any) => {
      if (!value) return "N/A";
      return new Date(value).toLocaleString();
    },
  },
  {
    accessorKey: "end_time",
    header: "End Time",
    sortable: true,
    cell: ({ value }: any) => {
      if (!value) return "N/A";
      return new Date(value).toLocaleString();
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        popupService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const popupActions: DataTableAction<Popup>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (popup: Popup) => {
      editPopup.value = popup;
      showCreateDialog.value = true;
    },
    permission: "update-popups",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (popup: Popup) => {
      popupToDelete.value = popup;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-popups",
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

const fetchPopups = async (params: Record<string, any>): Promise<PaginatedResponse<Popup>> => {
  try {
    const response = await popupService.list(params);
    error.value = "";
    return response as PaginatedResponse<Popup>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch popups";
    return createEmptyPaginatedResponse<Popup>();
  }
};

const handleCreate = () => {
  editPopup.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editPopup.value = null;
};

const handleSubmit = async (data: CreatePopupData | UpdatePopupData) => {
  isLoading.value = true;
  try {
    if (editPopup.value && editPopup.value.id) {
      await popupService.update(editPopup.value.id, data);
    } else {
      await popupService.create(data as CreatePopupData);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editPopup.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save popup";
    // Keep dialog open on error so user can fix and retry
  } finally {
    isLoading.value = false;
  }
};

const confirmDeletePopup = async () => {
  if (!popupToDelete.value) return;

  try {
    if (popupToDelete.value.id) {
      await popupService.delete(popupToDelete.value.id);
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete popup";
  } finally {
    showDeleteDialog.value = false;
    popupToDelete.value = null;
  }
};
</script>
