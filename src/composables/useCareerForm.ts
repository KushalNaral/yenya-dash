import { computed, type Ref, type ComputedRef } from "vue";
import type { Career, CreateCareerData } from "@/types/careers/career";
import type { FormConfig } from "@/types/form";

export function useCareerForm(editData?: Ref<Career | null> | Career | null) {
  const editCareer = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Career | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateCareerData>> = computed(() => ({
    submitLabel: editCareer.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Job Title",
        placeholder: "Enter job title",
        required: true,
        maxLength: 255,
        helpText: "The name/title of the career position.",
      },
      {
        type: "text",
        name: "slug",
        label: "Slug",
        placeholder: "Enter slug (auto-generated if empty)",
        maxLength: 255,
        helpText: "URL-friendly identifier. Leave empty to auto-generate from name.",
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter job description",
        maxLength: 2000,
        helpText: "Detailed description of the position.",
      },
      {
        type: "textarea",
        name: "requirements",
        label: "Requirements",
        placeholder: "Enter job requirements",
        maxLength: 2000,
        helpText: "Required qualifications and skills.",
      },
      {
        type: "text",
        name: "required_no",
        label: "Number of Positions",
        placeholder: "Enter number of positions",
        maxLength: 50,
        helpText: "Number of positions available.",
      },
      {
        type: "text",
        name: "position",
        label: "Position",
        placeholder: "Enter position type",
        maxLength: 255,
        helpText: "Type of position (e.g., Full-time, Part-time).",
      },
      {
        type: "text",
        name: "level",
        label: "Level",
        placeholder: "Enter experience level",
        maxLength: 255,
        helpText: "Experience level required (e.g., Entry, Mid, Senior).",
      },
      {
        type: "text",
        name: "validity",
        label: "Validity",
        placeholder: "Enter validity period",
        maxLength: 255,
        helpText: "Application deadline or validity period.",
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
        helpText: "The current status of the career posting.",
      },
      {
        type: "file",
        name: "assets",
        label: "Career Image",
        accept: "image/*",
        helpText: "Upload an image for this career posting.",
      },
    ],
    initialValues: editCareer.value
      ? {
          name: editCareer.value.name,
          slug: editCareer.value.slug || "",
          description: editCareer.value.description || "",
          requirements: editCareer.value.requirements || "",
          required_no: editCareer.value.required_no || "",
          position: editCareer.value.position || "",
          level: editCareer.value.level || "",
          validity: editCareer.value.validity || "",
          status: editCareer.value.status,
          assets: editCareer.value.primary_image?.url || null,
        }
      : {
          name: "",
          slug: "",
          description: "",
          requirements: "",
          required_no: "",
          position: "",
          level: "",
          validity: "",
          status: 1,
          assets: null,
        },
  }));

  return { formConfig };
}
