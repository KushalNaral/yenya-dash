import { computed, type Ref, type ComputedRef } from "vue";
import type {
  DownloadCategory,
  CreateDownloadCategoryData,
} from "@/types/downloadCategories/downloadCategory";
import type { FormConfig } from "@/types/form";

export function useDownloadCategoryForm(
  editData?: Ref<DownloadCategory | null> | DownloadCategory | null,
) {
  const editDownloadCategory = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as DownloadCategory | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateDownloadCategoryData>> = computed(() => ({
    submitLabel: editDownloadCategory.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Enter category name",
        required: true,
        maxLength: 255,
        helpText: "The name of the download category.",
      },
      {
        type: "number",
        name: "order",
        label: "Order",
        placeholder: "Enter display order",
        min: 0,
        helpText: "The order in which the category appears.",
      },
      {
        type: "select",
        name: "status",
        label: "Status",
        required: true,
        options: [
          { value: 1, label: "Active" },
          { value: 0, label: "Inactive" },
        ],
        placeholder: "Select status",
        helpText: "The current status of the category.",
      },
    ],
    initialValues: editDownloadCategory.value
      ? {
          name: editDownloadCategory.value.name,
          order: editDownloadCategory.value.order || 0,
          status: editDownloadCategory.value.status,
        }
      : {
          name: "",
          order: 0,
          status: 0,
        },
  }));

  return { formConfig };
}
