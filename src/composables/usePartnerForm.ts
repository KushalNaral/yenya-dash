import { computed, type Ref, type ComputedRef } from "vue";
import type { Partner, CreatePartnerData } from "@/types/partners/partner";
import type { FormConfig } from "@/types/form";

export function usePartnerForm(
  editData?: Ref<Partner | null> | Partner | null,
) {
  const editPartner = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Partner | null;
  });

  const formConfig: ComputedRef<FormConfig<CreatePartnerData>> = computed(
    () => ({
      submitLabel: editPartner.value ? "Update" : "Create",
      resetLabel: "Reset",
      showReset: true,
      layout: "grid",
      columns: 2,
      fields: [
        {
          type: "text",
          name: "title",
          label: "Title",
          placeholder: "Enter partner title",
          required: true,
          maxLength: 100,
          helpText: "The unique name of the partner.",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          placeholder: "Enter partner description",
          required: true,
          maxLength: 500,
          helpText: "The unique name of the partner.",
        },
        {
          type: "text",
          name: "link",
          label: "Link",
          placeholder: "Enter partner link (optional)",
          maxLength: 255,
          helpText: "An optional URL the partner links to.",
        },
        {
          type: "number",
          name: "order",
          label: "Order",
          placeholder: "Enter display order",
          required: true,
          min: 0,
          helpText: "The order in which the partner appears.",
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
          helpText: "The current status of the partner.",
        },
        {
          type: "file",
          name: "assets",
          label: "Partner Image",
          accept: "image/*",
          helpText: "Upload an image for this partner.",
        },
      ],
      initialValues: editPartner.value
        ? {
            title: editPartner.value.title,
            description: editPartner.value.description || "",
            link: editPartner.value.link || "",
            order: editPartner.value.order,
            status: editPartner.value.status,
            assets: editPartner.value.primary_image?.url || null,
          }
        : {
            title: "",
            description: "",
            link: "",
            order: 0,
            status: 0,
            assets: null,
          },
    }),
  );

  return { formConfig };
}
