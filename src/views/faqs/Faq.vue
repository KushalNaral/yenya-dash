<template>
  <div>
    <DataTable
      :data-type="'faq'"
      :columns="faqColumns"
      :actions="faqActions"
      :fetch-data="fetchFaqs"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-faqs">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create FAQ
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editFaq ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editFaq"
      :loading="isLoading"
      formId="faq-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="faqToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the FAQ and its related data."
      @confirm="confirmDeleteFaq"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { faqService } from "@/services/faqService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type { Faq, CreateFaqData, UpdateFaqData } from "@/types/faqs/faq";
import { useFaqForm } from "@/composables/useFaqForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const faqToDelete = ref<Faq | null>(null);
const editFaq = ref<Faq | null>(null);
const TRIGGER_REFRESH = "refresh-faqs";
const error = ref("");
const isLoading = ref(false);

const { formConfig } = useFaqForm(editFaq);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage FAQs effectively.",
    steps: [
      "Use the search bar to filter FAQs by name or question.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete FAQs.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const faqColumns: DataTableColumn<Faq>[] = [
  { accessorKey: "name", header: "Name", sortable: true },
  {
    accessorKey: "faq_category.name",
    header: "Category",
    sortable: false,
    cell: ({ row }: any) => row.faq_category?.name || "N/A",
  },
  {
    accessorKey: "question",
    header: "Question",
    sortable: true,
    cell: ({ value }: any) => {
      if (!value) return "N/A";
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    },
  },
  {
    accessorKey: "answer",
    header: "Answer",
    sortable: false,
    cell: ({ value }: any) => {
      if (!value) return "N/A";
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
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
        faqService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const faqActions: DataTableAction<Faq>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (faq: Faq) => {
      editFaq.value = faq;
      showCreateDialog.value = true;
    },
    permission: "update-faqs",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (faq: Faq) => {
      faqToDelete.value = faq;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-faqs",
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

const fetchFaqs = async (params: Record<string, any>): Promise<PaginatedResponse<Faq>> => {
  try {
    const response = await faqService.list(params);
    error.value = "";
    return response as PaginatedResponse<Faq>;
  } catch (err: any) {
    error.value = err.message || "Failed to fetch FAQs";
    return createEmptyPaginatedResponse<Faq>();
  }
};

const handleCreate = () => {
  editFaq.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editFaq.value = null;
};

const handleSubmit = async (data: CreateFaqData | UpdateFaqData) => {
  isLoading.value = true;
  try {
    if (editFaq.value && editFaq.value.id) {
      await faqService.update(editFaq.value.id, data);
    } else {
      await faqService.create(data as CreateFaqData);
    }
    error.value = "";
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editFaq.value = null;
  } catch (err: any) {
    error.value = err.message || "Failed to save FAQ";
    // Keep dialog open on error so user can fix and retry
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteFaq = async () => {
  if (!faqToDelete.value) return;

  try {
    if (faqToDelete.value.id) {
      await faqService.delete(faqToDelete.value.id);
      error.value = "";
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    error.value = err.message || "Failed to delete FAQ";
  } finally {
    showDeleteDialog.value = false;
    faqToDelete.value = null;
  }
};
</script>
