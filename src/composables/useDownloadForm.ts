import { computed, type Ref, type ComputedRef } from "vue";
import type { Download, CreateDownloadData } from "@/types/downloads/download";
import type { FormConfig } from "@/types/form";
import { downloadCategoryService } from "@/services/downloadCategoryService";
import { ref } from "vue";

export function useDownloadForm(editData?: Ref<Download | null> | Download | null) {
  const editDownload = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Download | null;
  });

  const downloadCategories = ref<Array<{ value: number; label: string }>>([]);

  // Fetch Download categories for dropdown
  const fetchDownloadCategories = async () => {
    try {
      const response = await downloadCategoryService.getAll();
      downloadCategories.value = response.map((cat) => ({
        value: cat.id!,
        label: cat.name,
      }));
    } catch (error) {
      console.error("Failed to fetch Download categories:", error);
      downloadCategories.value = [];
    }
  };

  // Fetch categories on initialization
  fetchDownloadCategories();

  const formConfig: ComputedRef<FormConfig<CreateDownloadData>> = computed(() => ({
    submitLabel: editDownload.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Enter download name",
        required: true,
        maxLength: 255,
        helpText: "The name/title of the download.",
      },
      {
        type: "select",
        name: "category_id",
        label: "Category",
        placeholder: "Select download category",
        required: true,
        options: downloadCategories.value,
        helpText: "Select the category for this download.",
      },
      {
        type: "file",
        name: "assets",
        label: "File",
        accept: "*/*",
        helpText: "Upload a file for this download.",
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
        helpText: "The current status of the download.",
      },
    ],
    initialValues: editDownload.value
      ? {
          name: editDownload.value.name,
          category_id: editDownload.value.category_id,
          status: editDownload.value.status,
          assets: editDownload.value.primary_file?.url || null,
        }
      : {
          name: "",
          category_id: undefined,
          status: 0,
          assets: null,
        },
  }));

  return { formConfig };
}
