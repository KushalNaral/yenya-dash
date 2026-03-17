import { computed, type Ref, type ComputedRef } from "vue";
import type { ContactUs, CreateContactUsData } from "@/types/contacts/contactUs";
import type { FormConfig } from "@/types/form";

export function useContactUsForm(editData?: Ref<ContactUs | null> | ContactUs | null) {
  const editContact = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as ContactUs | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateContactUsData>> = computed(() => ({
    submitLabel: editContact.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Office Name",
        placeholder: "Enter office name",
        required: true,
        maxLength: 255,
        helpText: "The name of the office shown on the website.",
      },
      {
        type: "textarea",
        name: "address",
        label: "Address",
        placeholder: "Enter office address",
        maxLength: 500,
        helpText: "Physical address of the office.",
      },
      {
        type: "text",
        name: "contact_number",
        label: "Contact Number",
        placeholder: "Enter contact number",
        maxLength: 50,
      },
      {
        type: "text",
        name: "email",
        label: "Email",
        placeholder: "Enter contact email",
        maxLength: 255,
      },
      {
        type: "text",
        name: "fax",
        label: "Fax",
        placeholder: "Enter fax number",
        maxLength: 50,
      },
      {
        type: "text",
        name: "map_location",
        label: "Map Embed / URL",
        placeholder: "Enter map embed URL or location info",
        maxLength: 500,
      },
      {
        type: "text",
        name: "focal_person",
        label: "Focal Person",
        placeholder: "Enter focal person name",
        maxLength: 255,
      },
      {
        type: "select",
        name: "is_head_office",
        label: "Is Head Office?",
        placeholder: "Select option",
        options: [
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ],
        helpText: "Mark this office as the head office.",
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
      },
    ],
    initialValues: editContact.value
      ? {
          name: editContact.value.name,
          address: editContact.value.address ?? "",
          contact_number: editContact.value.contact_number ?? "",
          email: editContact.value.email ?? "",
          fax: editContact.value.fax ?? "",
          map_location: editContact.value.map_location ?? "",
          focal_person: editContact.value.focal_person ?? "",
          is_head_office: editContact.value.is_head_office ?? false,
          status: editContact.value.status,
        }
      : {
          name: "",
          address: "",
          contact_number: "",
          email: "",
          fax: "",
          map_location: "",
          focal_person: "",
          is_head_office: false,
          status: 1,
        },
  }));

  return { formConfig };
}
