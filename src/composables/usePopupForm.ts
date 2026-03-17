import { computed, type Ref, type ComputedRef } from "vue";
import type { Popup, CreatePopupData } from "@/types/popups/popup";
import type { FormConfig } from "@/types/form";

export function usePopupForm(editData?: Ref<Popup | null> | Popup | null) {
  const editPopup = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Popup | null;
  });

  const formConfig: ComputedRef<FormConfig<CreatePopupData>> = computed(() => ({
    submitLabel: editPopup.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Enter popup name",
        required: true,
        maxLength: 255,
        helpText: "The name/title of the popup.",
      },
      {
        type: "text",
        name: "title",
        label: "Title",
        placeholder: "Enter popup title (optional)",
        maxLength: 255,
        helpText: "The display title for the popup.",
      },
      {
        type: "text",
        name: "link_title",
        label: "Link Title",
        placeholder: "Enter link title (optional)",
        maxLength: 255,
        helpText: "The text for the popup link button.",
      },
      {
        type: "text",
        name: "link_url",
        label: "Link URL",
        placeholder: "Enter link URL (optional)",
        maxLength: 255,
        helpText: "The URL the popup link points to.",
      },
      {
        type: "text",
        name: "link",
        label: "Link",
        placeholder: "Enter link (optional)",
        maxLength: 255,
        helpText: "Alternative link field.",
      },
      {
        type: "number",
        name: "order",
        label: "Order",
        placeholder: "Enter display order",
        min: 0,
        helpText: "The order in which the popup appears.",
      },
      {
        type: "datetime-local",
        name: "start_time",
        label: "Start Time",
        placeholder: "Select start time",
        helpText: "When the popup should start showing.",
      },
      {
        type: "datetime-local",
        name: "end_time",
        label: "End Time",
        placeholder: "Select end time",
        helpText: "When the popup should stop showing.",
      },
      {
        type: "file",
        name: "assets",
        label: "Popup Image",
        accept: "image/*",
        helpText: "Upload an image for this popup.",
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
        helpText: "The current status of the popup.",
      },
    ],
    initialValues: editPopup.value
      ? {
          name: editPopup.value.name,
          title: editPopup.value.title || "",
          link_title: editPopup.value.link_title || "",
          link_url: editPopup.value.link_url || "",
          link: editPopup.value.link || "",
          order: editPopup.value.order || 0,
          start_time: editPopup.value.start_time
            ? new Date(editPopup.value.start_time).toISOString().slice(0, 16)
            : "",
          end_time: editPopup.value.end_time
            ? new Date(editPopup.value.end_time).toISOString().slice(0, 16)
            : "",
          status: editPopup.value.status,
          assets: editPopup.value.primary_image?.url || null,
        }
      : {
          name: "",
          title: "",
          link_title: "",
          link_url: "",
          link: "",
          order: 0,
          start_time: "",
          end_time: "",
          status: 0,
          assets: null,
        },
  }));

  return { formConfig };
}
