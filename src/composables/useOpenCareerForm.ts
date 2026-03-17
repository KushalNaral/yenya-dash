import { computed, type Ref, type ComputedRef } from "vue";
import type { OpenCareer, CreateOpenCareerData } from "@/types/openCareers/openCareer";
import type { FormConfig } from "@/types/form";

export function useOpenCareerForm(editData?: Ref<OpenCareer | null> | OpenCareer | null) {
  const editOpenCareer = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as OpenCareer | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateOpenCareerData>> = computed(() => ({
    submitLabel: editOpenCareer.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "full_name",
        label: "Full Name",
        placeholder: "Enter full name",
        required: true,
        maxLength: 255,
        helpText: "Applicant's full name.",
      },
      {
        type: "text",
        name: "phone_number",
        label: "Phone Number",
        placeholder: "Enter phone number",
        maxLength: 50,
        helpText: "Contact phone number.",
      },
      {
        type: "email",
        name: "email",
        label: "Email",
        placeholder: "Enter email address",
        maxLength: 255,
        helpText: "Contact email address.",
      },
      {
        type: "textarea",
        name: "cover_letter",
        label: "Cover Letter",
        placeholder: "Enter cover letter",
        maxLength: 2000,
        helpText: "Applicant's cover letter.",
      },
      {
        type: "text",
        name: "position_applied",
        label: "Position Applied",
        placeholder: "Enter position applied for",
        maxLength: 255,
        helpText: "The position the applicant is applying for.",
      },
      {
        type: "textarea",
        name: "experience",
        label: "Experience",
        placeholder: "Enter experience details",
        maxLength: 2000,
        helpText: "Applicant's work experience.",
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
        helpText: "The current status of the application.",
      },
      {
        type: "file",
        name: "assets",
        label: "Resume/CV",
        accept: "*/*",
        helpText: "Upload resume or CV document.",
      },
    ],
    initialValues: editOpenCareer.value
      ? {
          full_name: editOpenCareer.value.full_name,
          phone_number: editOpenCareer.value.phone_number || "",
          email: editOpenCareer.value.email || "",
          cover_letter: editOpenCareer.value.cover_letter || "",
          position_applied: editOpenCareer.value.position_applied || "",
          experience: editOpenCareer.value.experience || "",
          status: editOpenCareer.value.status,
          assets: editOpenCareer.value.primary_file?.url || null,
        }
      : {
          full_name: "",
          phone_number: "",
          email: "",
          cover_letter: "",
          position_applied: "",
          experience: "",
          status: 1,
          assets: null,
        },
  }));

  return { formConfig };
}
