import { computed, type Ref, type ComputedRef } from "vue";
import type { FaqCategory, CreateFaqCategoryData } from "@/types/faqCategories/faqCategory";
import type { FormConfig } from "@/types/form";

export function useFaqCategoryForm(editData?: Ref<FaqCategory | null> | FaqCategory | null) {
  const editFaqCategory = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as FaqCategory | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateFaqCategoryData>> = computed(() => ({
    submitLabel: editFaqCategory.value ? "Update" : "Create",
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
        helpText: "The name of the FAQ category.",
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter description (optional)",
        rows: 3,
        helpText: "Description of the FAQ category.",
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
    initialValues: editFaqCategory.value
      ? {
          name: editFaqCategory.value.name,
          description: editFaqCategory.value.description || "",
          order: editFaqCategory.value.order || 0,
          status: editFaqCategory.value.status,
        }
      : {
          name: "",
          description: "",
          order: 0,
          status: 0,
        },
  }));

  return { formConfig };
}
