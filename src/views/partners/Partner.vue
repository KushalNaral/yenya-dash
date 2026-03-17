<template>
  <div>
    <DataTable
      :data-type="'partner'"
      :columns="partnerColumns"
      :actions="partnerActions"
      :fetchData="fetchPartners"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-partners">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Partner
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editPartner ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editPartner"
      :loading="isLoading"
      :server-errors="errors"
      formId="partner-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="partnerToDelete?.title"
      deletableDescription="This action cannot be undone. This will permanently delete the partner and its related data."
      @confirm="confirmDeletePartner"
      @cancel="showDeleteDialog = false"
      mode="delete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { partnerService } from "@/services/partnerService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type {
  DataTableColumn,
  DataTableAction,
  DataTableHelpSection,
} from "@/types/datatable";
import type {
  Partner,
  CreatePartnerData,
  UpdatePartnerData,
} from "@/types/partners/partner";
import { usePartnerForm } from "@/composables/usePartnerForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const partnerToDelete = ref<Partner | null>(null);
const editPartner = ref<Partner | null>(null);
const TRIGGER_REFRESH = "refresh-partners";
const errors = ref<Record<string, string[]>>({});
const isLoading = ref(false);
const { formConfig } = usePartnerForm(editPartner);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage partners effectively.",
    steps: [
      "Use the search bar to filter partners by title.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete partners.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const partnerColumns: DataTableColumn<Partner>[] = [
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
  { accessorKey: "title", header: "Title", sortable: true },
  { accessorKey: "description", header: "Description", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        partnerService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const partnerActions: DataTableAction<Partner>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (partner: Partner) => {
      editPartner.value = partner;
      showCreateDialog.value = true;
    },
    permission: "update-partners",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (partner: Partner) => {
      partnerToDelete.value = partner;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-partners",
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

const fetchPartners = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<Partner>> => {
  try {
    const response = await partnerService.list(params);
    errors.value = {};
    return response as PaginatedResponse<Partner>;
  } catch (err: any) {
    errors.value = err.cause.errors;
    return createEmptyPaginatedResponse<Partner>();
  }
};

const handleCreate = () => {
  editPartner.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editPartner.value = null;
};

const handleSubmit = async (data: CreatePartnerData | UpdatePartnerData) => {
  isLoading.value = true;
  try {
    if (editPartner.value && editPartner.value.id) {
      await partnerService.update(editPartner.value.id, data);
    } else {
      await partnerService.create(data as CreatePartnerData);
    }
    errors.value = {};
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editPartner.value = null;
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in partner");
  } finally {
    isLoading.value = false;
  }
};

const confirmDeletePartner = async () => {
  if (!partnerToDelete.value) return;

  try {
    if (partnerToDelete.value.id) {
      await partnerService.delete(partnerToDelete.value.id);
      errors.value = {};
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in partner");
  } finally {
    showDeleteDialog.value = false;
    partnerToDelete.value = null;
  }
};
</script>
