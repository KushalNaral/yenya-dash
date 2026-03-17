<template>
  <div>
    <DataTable
      :data-type="'slider'"
      :columns="sliderColumns"
      :actions="sliderActions"
      :fetch-data="fetchSliders"
      :use-pagination="true"
      :filters-config="filtersConfig"
      :data-key="'data'"
      :refresh-key="TRIGGER_REFRESH"
      :help-content="helpContent"
      default-action-display="dialog"
      :enable-action-partitioning="true"
    >
      <template #headerActions>
        <PermissionGuard permission="create-sliders">
          <Button
            size="sm"
            class="shrink-0 hover:bg-primary hover:text-white cursor-pointer transition-all"
            @click="handleCreate"
          >
            Create Slider
          </Button>
        </PermissionGuard>
      </template>
    </DataTable>

    <UnifiedFormDialog
      v-model:open="showCreateDialog"
      :mode="editSlider ? 'edit' : 'create'"
      :form-config="formConfig"
      :edit-data="editSlider"
      :loading="isLoading"
      :server-errors="errors"
      formId="slider-form"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteConfirmDialog
      :model-value="showDeleteDialog"
      :deletableTitle="sliderToDelete?.title"
      deletableDescription="This action cannot be undone. This will permanently delete the slider and its related data."
      @confirm="confirmDeleteSlider"
      @cancel="showDeleteDialog = false"
      mode="delete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { sliderService } from "@/services/sliderService";
import { emitter } from "@/events/eventBus";
import {
  createEmptyPaginatedResponse,
  type PaginatedResponse,
} from "@/types/pagination/pagination";
import type { DataTableColumn, DataTableAction, DataTableHelpSection } from "@/types/datatable";
import type { Slider, CreateSliderData, UpdateSliderData } from "@/types/sliders/slider";
import { useSliderForm } from "@/composables/useSliderForm";
import StatusSwitch from "@/components/custom/jsx/global/StatusSwitch.vue";

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const sliderToDelete = ref<Slider | null>(null);
const editSlider = ref<Slider | null>(null);
const TRIGGER_REFRESH = "refresh-sliders";
const errors = ref<Record<string, string[]>>({});
const isLoading = ref(false);
const { formConfig } = useSliderForm(editSlider);

const helpContent: DataTableHelpSection[] = [
  {
    title: "Overview",
    description: "This section allows you to manage sliders effectively.",
    steps: [
      "Use the search bar to filter sliders by name.",
      "Apply status filters to narrow down the list.",
      "Toggle column visibility using the columns dropdown.",
      "Use action buttons to edit, activate/deactivate, or delete sliders.",
      "Navigate through pages or adjust rows per page using pagination controls.",
    ],
  },
];

const sliderColumns: DataTableColumn<Slider>[] = [
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
        sliderService.changeStatus(Number(id), { status }),
      refreshKey: TRIGGER_REFRESH,
      activeValue: 1,
      inactiveValue: 0,
    },
  },
];

const sliderActions: DataTableAction<Slider>[] = [
  {
    label: "Edit",
    icon: "lucide:edit",
    handler: (slider: Slider) => {
      editSlider.value = slider;
      showCreateDialog.value = true;
    },
    permission: "update-sliders",
  },
  {
    label: "Delete",
    icon: "lucide:trash",
    handler: (slider: Slider) => {
      sliderToDelete.value = slider;
      showDeleteDialog.value = true;
    },
    variant: "destructive",
    permission: "delete-sliders",
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

const fetchSliders = async (params: Record<string, any>): Promise<PaginatedResponse<Slider>> => {
  try {
    const response = await sliderService.list(params);
    errors.value = {};
    return response as PaginatedResponse<Slider>;
  } catch (err: any) {
    errors.value = err.cause.errors;
    return createEmptyPaginatedResponse<Slider>();
  }
};

const handleCreate = () => {
  editSlider.value = null;
  showCreateDialog.value = true;
};

const handleCancel = () => {
  editSlider.value = null;
};

const handleSubmit = async (data: CreateSliderData | UpdateSliderData) => {
  isLoading.value = true;
  try {
    if (editSlider.value && editSlider.value.id) {
      await sliderService.update(editSlider.value.id, data);
    } else {
      await sliderService.create(data as CreateSliderData);
    }
    errors.value = {};
    emitter.emit(TRIGGER_REFRESH);
    showCreateDialog.value = false;
    editSlider.value = null;
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in slider");
  } finally {
    isLoading.value = false;
  }
};

const confirmDeleteSlider = async () => {
  if (!sliderToDelete.value) return;

  try {
    if (sliderToDelete.value.id) {
      await sliderService.delete(sliderToDelete.value.id);
      errors.value = {};
      emitter.emit(TRIGGER_REFRESH);
    }
  } catch (err: any) {
    errors.value = err.cause.errors;
    console.log(errors.value, "errors in slider");
  } finally {
    showDeleteDialog.value = false;
    sliderToDelete.value = null;
  }
};
</script>
