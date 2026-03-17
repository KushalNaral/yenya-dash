import { computed, type Ref, type ComputedRef } from "vue";
import type { Faq, CreateFaqData } from "@/types/faqs/faq";
import type { FormConfig } from "@/types/form";
import { faqCategoryService } from "@/services/faqCategoryService";
import { ref } from "vue";

export function useFaqForm(editData?: Ref<Faq | null> | Faq | null) {
  const editFaq = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Faq | null;
  });

  const faqCategories = ref<Array<{ value: number; label: string }>>([]);

  // Fetch FAQ categories for dropdown
  const fetchFaqCategories = async () => {
    try {
      const response = await faqCategoryService.getAll();
      faqCategories.value = response.map((cat) => ({
        value: cat.id!,
        label: cat.name,
      }));
    } catch (error) {
      console.error("Failed to fetch FAQ categories:", error);
      faqCategories.value = [];
    }
  };

  // Fetch categories on initialization
  fetchFaqCategories();

  const formConfig: ComputedRef<FormConfig<CreateFaqData>> = computed(() => ({
    submitLabel: editFaq.value ? "Update" : "Create",
    resetLabel: "Reset",
    showReset: true,
    layout: "grid",
    columns: 2,
    fields: [
      {
        type: "text",
        name: "name",
        label: "Name",
        placeholder: "Enter FAQ name",
        required: true,
        maxLength: 255,
        helpText: "The name/title of the FAQ.",
      },
      {
        type: "select",
        name: "faq_category_id",
        label: "Category",
        placeholder: "Select FAQ category",
        options: faqCategories.value,
        helpText: "Select the category for this FAQ.",
      },
      {
        type: "textarea",
        name: "question",
        label: "Question",
        placeholder: "Enter the question",
        rows: 3,
        helpText: "The question for this FAQ.",
      },
      {
        type: "textarea",
        name: "answer",
        label: "Answer",
        placeholder: "Enter the answer",
        rows: 5,
        helpText: "The answer to the question.",
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Enter description (optional)",
        rows: 3,
        helpText: "Additional description for this FAQ.",
      },
      {
        type: "number",
        name: "order",
        label: "Order",
        placeholder: "Enter display order",
        min: 0,
        helpText: "The order in which the FAQ appears.",
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
        helpText: "The current status of the FAQ.",
      },
    ],
    initialValues: editFaq.value
      ? {
          name: editFaq.value.name,
          description: editFaq.value.description || "",
          question: editFaq.value.question || "",
          answer: editFaq.value.answer || "",
          order: editFaq.value.order || 0,
          status: editFaq.value.status,
          faq_category_id: editFaq.value.faq_category_id,
        }
      : {
          name: "",
          description: "",
          question: "",
          answer: "",
          order: 0,
          status: 0,
          faq_category_id: undefined,
        },
  }));

  return { formConfig };
}
