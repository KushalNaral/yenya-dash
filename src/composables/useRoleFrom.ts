import { computed, ref, type Ref } from "vue";
import type { Role } from "@/types/auth";
import { permissionService } from "@/services/permissionService";
import type { Permission } from "@/types/permission/permission";
import type { FormConfig } from "@/types/form";

export function useRoleForm(editData?: Ref<Role | null>) {
  const permissions = ref<Permission[]>([]);

  const fetchPermissions = async (): Promise<void> => {
    const response = await permissionService.getAllPermissions();
    permissions.value = response;
  };

  const formConfig = computed<FormConfig>(() => {
    const role = editData?.value;

    return {
      submitLabel: role ? "Update Role" : "Create Role",
      resetLabel: "Reset",
      showReset: true,
      showSubmit: true,
      layout: "grid",
      columns: 2,
      fields: [
        {
          type: "text",
          name: "name",
          label: "Role Name",
          placeholder: "Enter role name",
          required: true,
          maxLength: 255,
          helpText: "The unique name for this role.",
        },
        {
          type: "multi-select",
          name: "permissions",
          label: "Permissions",
          placeholder: "Select permissions",
          required: false,
          options: permissions.value.map((permission) => ({
            value: permission.name,
            label: permission.name,
          })),
          helpText: "Select permissions to assign to this role.",
          colSpan: 2,
        },
      ],
      initialValues: role
        ? {
            name: role.name || "",
            permissions: role.permissions || [],
          }
        : {
            name: "",
            permissions: [],
          },
    };
  });

  return { formConfig, fetchPermissions };
}
