import { computed, type Ref, type ComputedRef } from "vue";
import type { Slider, CreateSliderData } from "@/types/sliders/slider";
import type { FormConfig } from "@/types/form";

export function useSliderForm(editData?: Ref<Slider | null> | Slider | null) {
  const editSlider = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Slider | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateSliderData>> = computed(() => ({
    submitLabel: editSlider.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "title",
        label: "Name",
        placeholder: "Enter slider name",
        required: true,
        maxLength: 100,
        helpText: "The unique name of the slider.",
      },
      {
        type: "text",
        name: "description",
        label: "Description",
        placeholder: "Enter slider description",
        required: true,
        maxLength: 100,
        helpText: "The display title for the slider.",
      },
      {
        type: "text",
        name: "link_title",
        label: "Link Title",
        placeholder: "Enter slider link title (optional)",
        maxLength: 255,
        helpText: "An optional URL the slider links to.",
      },
      {
        type: "text",
        name: "link_url",
        label: "Link URL",
        placeholder: "Enter slider link URL (optional)",
        maxLength: 255,
        helpText: "An optional URL the slider links to.",
      },
      {
        type: "number",
        name: "order",
        label: "Order",
        placeholder: "Enter display order",
        required: true,
        min: 0,
        helpText: "The order in which the slider appears.",
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
        helpText: "The current status of the slider.",
      },
      {
        type: "file",
        name: "assets",
        label: "Slider Image",
        accept: "image/*",
        helpText: "Upload an image for this slider.",
      },
    ],
    initialValues: editSlider.value
      ? {
          title: editSlider.value.title,
          description: editSlider.value.description,
          link_title: editSlider.value.link_title || "",
          link_url: editSlider.value.link_url || "",
          order: editSlider.value.order,
          status: editSlider.value.status,
          assets: editSlider.value.primary_image?.url || null,
        }
      : {
          title: "",
          description: "",
          link_title: "",
          link_url: "",
          order: 0,
          status: 0,
          assets: null,
        },
  }));

  return { formConfig };
}
