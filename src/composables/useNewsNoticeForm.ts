import { computed, type Ref, type ComputedRef } from "vue";
import type { NewsNotice, CreateNewsNoticeData } from "@/types/NewsNotice/newsnotice";
import type { FormConfig } from "@/types/form";

export function useNewsNoticeForm(editData?: Ref<NewsNotice | null> | NewsNotice | null) {
  const editNewsNotice = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as NewsNotice | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateNewsNoticeData>> = computed(() => ({
    submitLabel: editNewsNotice.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "select",
        name: "type",
        label: "Type",
        required: true,
        options: [
          { value: "notice", label: "Notice" },
          { value: "news", label: "News" },
        ],
        placeholder: "Select type",
        helpText: "Whether its a news or a notice",
      },
      {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Enter news notice name",
        required: true,
        maxLength: 100,
        helpText: "The unique name of the news notice.",
      },
      {
        type: "text",
        name: "slug",
        label: "Slug",
        required: true,
        helpText: "The unique slug of the news notice.",
        disabled: true,
        computedValue: (data: CreateNewsNoticeData) => {
          return data.name.toLowerCase().replace(/\s+/g, "-");
        },
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter news notice description",
        required: true,
        maxLength: 2000,
        helpText: "The display title for the news notice.",
      },
      {
        type: "number",
        name: "order",
        label: "Order",
        placeholder: "Enter display order",
        min: 0,
        helpText: "The order in which the news notice appears.",
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
        helpText: "The current status of the news notice.",
      },
      {
        type: "date",
        name: "published_date",
        label: "Published Date",
        required: true,
        helpText: "The date when the news notice is published.",
        computedValue: (data: CreateNewsNoticeData) => {
          if (!data.published_date) return null;

          const d = new Date(data.published_date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");

          return `${year}-${month}-${day}`;
        },
      },
      {
        type: "file",
        name: "assets",
        label: "News Notice Image",
        accept: "image/*",
        helpText: "Upload an image for this news notice.",
      },
    ],
    initialValues: editNewsNotice.value
      ? {
          type: editNewsNotice.value.type,
          name: editNewsNotice.value.name,
          slug: editNewsNotice.value.slug,
          description: editNewsNotice.value.description,
          order: editNewsNotice.value.order,
          status: editNewsNotice.value.status,
          published_date: editNewsNotice.value.published_date,
          assets: editNewsNotice.value.primary_asset?.url || null,
        }
      : {
          type: "notice",
          slug: "",
          name: "",
          description: "",
          order: 0,
          status: 0,
          published_date: "",
          assets: null,
        },
  }));

  return { formConfig };
}
