import { computed, type Ref } from "vue";
import type { Year } from "@/types/years/year";

export function useYearForm(editData?: Ref<Year | null>) {
  const yearOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 1950;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
      const y = currentYear - i;
      return { value: y.toString(), label: y.toString() };
    });
  });

  const formConfig = computed(() => {
    const year = editData?.value;

    return {
      submitLabel: year ? "Update" : "Create",
      resetLabel: "Reset",
      showReset: true,
      layout: "vertical" as const,
      fields: [
        {
          type: "select" as const,
          name: "year",
          label: "Year",
          placeholder: "Select year",
          required: true,
          options: yearOptions.value,
          helpText: "The unique year value.",
          disabled: !!year, // Disable year field when editing
        },
        {
          type: "select" as const,
          name: "status",
          label: "Status",
          required: true,
          options: [
            { value: 1, label: "Active" },
            { value: 0, label: "Inactive" },
          ],
          placeholder: "Select status",
          helpText: "The current status of the year.",
        },
      ],
      initialValues: year
        ? {
            year: year.year,
            status: year.status,
          }
        : {
            year: "",
            status: 0,
          },
    };
  });

  return { formConfig };
}
