import { computed, type Ref, type ComputedRef } from "vue";
import type { Stats, CreateStatsData } from "@/types/stats/stats";
import type { FormConfig } from "@/types/form";

export function useStatsForm(editData?: Ref<Stats | null> | Stats | null) {
  const editStats = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Stats | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateStatsData>> = computed(() => ({
    submitLabel: editStats.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "title",
        label: "Title",
        placeholder: "Enter stats title",
        required: true,
        maxLength: 100,
        helpText: "The unique name of the stats.",
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter stats description",
        required: true,
        maxLength: 500,
        helpText: "The unique name of the stats.",
      },
      {
        type: "text",
        name: "link",
        label: "Link",
        placeholder: "Enter stats link (optional)",
        maxLength: 255,
        helpText: "An optional URL the stats links to.",
      },
      {
        type: "number",
        name: "order",
        label: "Order",
        placeholder: "Enter display order",
        required: true,
        min: 0,
        helpText: "The order in which the stats appears.",
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
        helpText: "The current status of the stats.",
      },
      {
        type: "file",
        name: "assets",
        label: "Stats Image",
        accept: "image/*",
        helpText: "Upload an image for this stats.",
      },
    ],
    initialValues: editStats.value
      ? {
          title: editStats.value.title,
          description: editStats.value.description || "",
          link: editStats.value.link || "",
          order: editStats.value.order,
          status: editStats.value.status,
          assets: editStats.value.primary_image?.url || null,
        }
      : {
          title: "",
          description: "",
          link: "",
          order: 0,
          status: 0,
          assets: null,
        },
  }));

  return { formConfig };
}
