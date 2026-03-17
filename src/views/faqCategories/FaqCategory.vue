<template>
  <div>
    <DataTable
      :data-type="'faq-category'"
      :columns="faqCategoryColumns"
      :actions="faqCategoryActions"
      :fetch-data="fetchFaqCategories"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-faq-categories">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create FAQ Category
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editFaqCategory ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editFaqCategory"
      :loading="isLoading"
      formId="faq-category-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="faqCategoryToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the FAQ category and its related data."
      @confirm="confirmDeleteFaqCategory"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { faqCategoryService } from "@/services/faqCategoryService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type {
  FaqCategory,
  CreateFaqCategoryData,
  UpdateFaqCategoryData,
} from "@/types/faqCategories/faqCategory";
import { useFaqCategoryForm } from "@/composables/useFaqCategoryForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const faqCategoryToDelete = ref<FaqCategory | null>(null);
const editFaqCategory = ref<FaqCategory | null>(null);
const TRIGGER_REFRESH = "refresh-faq-categories";
const error = ref("");
const isLoading = ref(false);

const { formConfig } = useFaqCategoryForm(editFaqCategory);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage FAQ categories effectively.",
    steps: [
      "Use the search bar to filter categories by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete categories.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const faqCategoryColumns: DataTableColumn<FaqCategory>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  {
    accessorKey: "description",
    header: "Description",
    sortable: false,
    cell: ({ value }: any) => {
      if (!value) return "N/A";
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
    },
  },
  { accessorKey: "order", header: "Order", sortable: true },
  {
    accessorKey: "status",
    header: "Status",
    sortable: true,
    cell: StatusSwitch,
    statusSwitchConfig: {
      onChangeStatus: (id: number | string, status: number) =>
        faqCategoryService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const faqCategoryActions: DataTableAction<FaqCategory>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (faqCategory: FaqCategory) => {
      editFaqCategory.value = faqCategory;
      showCreateDialog.value = true;
    },
    permission: "update-faq-categories",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (faqCategory: FaqCategory) => {
      faqCategoryToDelete.value = faqCategory;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-faq-categories",
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

const fetchFaqCategories = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<FaqCategory>> => {
  try {
    const response = await faqCategoryService.list(params);
    error.value = "";
    return response as PaginatedResponse<FaqCategory>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch FAQ categories";
    return createEmptyPaginatedResponse<FaqCategory>();
  }
};

const handleCreate = () => {
  editFaqCategory.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editFaqCategory.value = null;
};

const handleSubmit = async (data: CreateFaqCategoryData | UpdateFaqCategoryData) => {
  isLoading.value = true;
  try {
    if (editFaqCategory.value && editFaqCategory.value.id) {
      await faqCategoryService.update(editFaqCategory.value.id, data);
    } else {
      await faqCategoryService.create(data as CreateFaqCategoryData);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editFaqCategory.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save FAQ category";
    // Keep dialog open on error so user can fix and retry
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteFaqCategory = async () => {
  if (!faqCategoryToDelete.value) return;

  try {
    if (faqCategoryToDelete.value.id) {
      await faqCategoryService.delete(faqCategoryToDelete.value.id);
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete FAQ category";
  } finally {
    showDeleteDialog.value = false;
    faqCategoryToDelete.value = null;
  }
};
</script>
