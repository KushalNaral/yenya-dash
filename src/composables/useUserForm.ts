import { computed, type Ref } from "vue";
import type { User } from "@/types/users/user";
import type { FormConfig } from "@/types/form";

export function useUserForm(editData?: Ref<User | null>) {
  const formConfig = computed<FormConfig>(() => {
    const user = editData?.value;
    const isEditMode = !!user;

    return {
      submitLabel: isEditMode ? "Update" : "Create",
      resetLabel: "Reset",
      showReset: true,
      showSubmit: true,
      layout: "grid",
      columns: 2,
      fields: [
        {
          type: "text",
          name: "name",
          label: "Name",
          placeholder: "Enter full name",
          required: true,
          maxLength: 255,
          helpText: "The user's full name.",
        },
        {
          type: "email",
          name: "email",
          label: "Email",
          placeholder: "Enter email address",
          required: true,
          maxLength: 255,
          helpText: "The user's email address. Must be unique.",
          disabled: isEditMode, // Email shouldn't be changed after creation
        },
        ...(!isEditMode
          ? [
              {
                type: "password" as const,
                name: "password",
                label: "Password",
                placeholder: "Enter password",
                required: true,
                maxLength: 100,
                helpText: "Password must be at least 8 characters.",
                validator: (val: string) => {
                  if (!val) return "Password is required";
                  return val.length >= 8 || "Password must be at least 8 characters";
                },
              },
              {
                type: "password" as const,
                name: "password_confirmation",
                label: "Confirm Password",
                placeholder: "Confirm password",
                required: true,
                maxLength: 100,
                helpText: "Re-enter the password to confirm.",
                validator: (val: string, formData?: Record<string, any>) => {
                  if (!val) return "Password confirmation is required";
                  if (formData?.password && val !== formData.password) {
                    return "Passwords do not match";
                  }
                  return true;
                },
              },
            ]
          : []),
        ...(isEditMode
          ? [
              {
                type: "select" as const,
                name: "status",
                label: "Status",
                placeholder: "Select status",
                required: false,
                options: [
                  { value: 1, label: "Active" },
                  { value: 0, label: "Inactive" },
                ],
                helpText: "The current status of the user account.",
              },
              {
                type: "select" as const,
                name: "verified_status",
                label: "Verification Status",
                placeholder: "Select verification status",
                required: false,
                options: [
                  { value: "verified", label: "Verified" },
                  { value: "not_verified", label: "Not Verified" },
                  { value: "rejected", label: "Rejected" },
                ],
                helpText: "The verification status of the user account.",
              },
            ]
          : []),
      ],
      initialValues: user
        ? {
            name: user.name || "",
            email: user.email || "",
            status: user.status ?? 1,
            verified_status: user.verified_status || "not_verified",
          }
        : {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
          },
    };
  });

  return { formConfig };
}
