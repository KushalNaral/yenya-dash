import { computed, type Ref, type ComputedRef } from "vue";
import type {
  CommitteeMember,
  CreateCommitteeMemberData,
} from "@/types/committeeMembers/committeeMember";
import type { FormConfig } from "@/types/form";

export function useCommitteeMemberForm(
  editData?: Ref<CommitteeMember | null> | CommitteeMember | null,
) {
  const editMember = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as CommitteeMember | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateCommitteeMemberData>> = computed(() => ({
    submitLabel: editMember.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Enter committee member name",
        required: true,
        maxLength: 100,
        helpText: "The unique name of the committee member.",
      },
      {
        type: "text",
        name: "designation",
        label: "Designation",
        placeholder: "Enter committee member designation",
        required: true,
        maxLength: 255,
        helpText: "The designation or role of the committee member.",
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter committee member description",
        maxLength: 100,
        helpText: "The display title for the committee member.",
      },
      {
        type: "select",
        name: "type",
        label: "Type",
        required: true,
        options: [
          { value: "bod", label: "Board Of Directors" },
          { value: "management", label: "Management" },
          { value: "incharge", label: "Department Incharge" },
        ],
        placeholder: "Select type",
        helpText: "The current type of the committee member.",
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
        label: "Committee Member Image",
        accept: "image/*",
        helpText: "Upload an image for this committee member.",
      },
    ],
    initialValues: editMember.value
      ? {
          name: editMember.value.name,
          description: editMember.value.description,
          designation: editMember.value.designation,
          type: editMember.value.type,
          order: editMember.value.order,
          status: editMember.value.status,
          assets: editMember.value.primary_image?.url || null,
        }
      : {
          name: "",
          description: "",
          designation: "",
          type: "" as CommitteeMember["type"],
          order: 0,
          assets: null,
        },
  }));

  return { formConfig };
}
