<template>
  <div>
    <DataTable
      data-type="News Notices"
      :columns="newsNoticeColumns"
      :actions="newsNoticeActions"
      :fetch-data="fetchNewsNotices"
      :use-pagination="true"
      data-key="data"
      :refresh-key="TRIGGER_REFRESH"
      default-action-display="dialog"
      :enable-action-partitioning="false"
      :filters-config="filtersConfig"
      :draggable-config="{
        enabled: true,
        orderField: 'order',
        onReorder: (items) => newsNoticeService.reorder(items as { id: number; order: number }[]),
        idField: 'id',
      }"
    >
      <template #headerActions>
        <PermissionGuard permission="create-news-notices">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create News Notice
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="newsNoticeToEdit ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="newsNoticeToEdit"
      :loading="isLoading"
      :server-errors="errors"
      formId="news-notice-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="newsNoticeToDelete?.name"
      deletableDescription="This action cannot be undone. This will permanently delete the news/notice and its related data."
      @confirm="confirmDeleteNewsNotice"
      @cancel="showDeleteDialog = false"
      mode="delete"
    />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import DataTable from "@/components/builders/DataTable.vue";
import type { DataTableColumn, DataTableAction, PaginatedResponse } from "@/types/datatable";
import type {
  CreateNewsNoticeData,
  NewsNotice,
  UpdateNewsNoticeData,
} from "@/types/NewsNotice/newsnotice";
import { newsNoticeService } from "@/services/newsNoticeService";
import { createEmptyPaginatedResponse } from "@/types/pagination/pagination";
import { emitter } from "@/events/eventBus";
import { useNewsNoticeForm } from "@/composables/useNewsNoticeForm";
import { useToast } from "@/composables/useToast";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const newsNoticeToEdit = ref<NewsNotice | null>(null);
const newsNoticeToDelete = ref<NewsNotice | null>(null);
const TRIGGER_REFRESH = "refresh-news-notices";
const isLoading = ref(false);
const errors = ref<Record<string, string[]>>({});
const { showToast } = useToast();
const { formConfig } = useNewsNoticeForm(newsNoticeToEdit);

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

const newsNoticeActions: DataTableAction<NewsNotice>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (newsNotice: NewsNotice) => {
      newsNoticeToEdit.value = newsNotice;
      showCreateDialog.value = true;
    },
    permission: "update-news-notices",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (newsNotice: NewsNotice) => {
      newsNoticeToDelete.value = newsNotice;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-news-notices",
  },
];

const newsNoticeColumns: DataTableColumn<NewsNotice>[] = [
  {
    header: "Image",
    accessorKey: "primary_asset.url",
    cell: ({ value }: any) => {
      const url = value;
      return url
        ? `<img src="${url}" class="w-12 h-12 object-cover rounded shadow-sm" />`
        : '<div class="w-12 h-12 bg-muted flex items-center justify-center rounded text-[10px] text-muted-foreground">No Image</div>';
    },
  },
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Order",
    accessorKey: "order",
    sortable: true,
  },
  {
    header: "Type",
    accessorKey: "type",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ value }: any) => {
      return value ? "Active" : "Inactive";
    },
  },
];
const handleCreate = () => {
  newsNoticeToEdit.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  newsNoticeToEdit.value = null;
};

const fetchNewsNotices = async (
  params: Record<string, any>,
): Promise<PaginatedResponse<NewsNotice>> => {
  try {
    const response = await newsNoticeService.list(params);
    errors.value = {};
    console.log(response, "from Slider module");
    return response as PaginatedResponse<NewsNotice>;
  } catch (err: any) {
    errors.value = err.cause.errors;
    return createEmptyPaginatedResponse<NewsNotice>();
  }
};

const handleSubmit = async (data: CreateNewsNoticeData | UpdateNewsNoticeData) => {
  isLoading.value = true;
  try {
    if (newsNoticeToEdit.value && newsNoticeToEdit.value.id) {
      await newsNoticeService.update(newsNoticeToEdit.value.id, data as UpdateNewsNoticeData);
    } else {
      await newsNoticeService.create(data as CreateNewsNoticeData);
    }
    errors.value = {};
    showToast(newsNoticeToEdit.value ? "Successfully Updated" : "Successfully Created", "success");
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    newsNoticeToEdit.value = null;
  } catch (err: any) {
    errors.value = err.cause.errors;
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteNewsNotice = async () => {
  if (!newsNoticeToDelete.value) return;

  try {
    if (newsNoticeToDelete.value.id) {
      await newsNoticeService.delete(newsNoticeToDelete.value.id);
      errors.value = {};
      showToast("Successfully Deleted", "success");
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    errors.value = err.cause.errors;
  } finally {
    showDeleteDialog.value = false;
    newsNoticeToDelete.value = null;
  }
};
</script>
