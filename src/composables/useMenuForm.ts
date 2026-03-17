import { computed, type Ref, type ComputedRef } from "vue";
import type { Menu, CreateMenuData } from "@/types/menus/menu";
import type { FormConfig } from "@/types/form";

export function useMenuForm(editData?: Ref<Menu | null> | Menu | null, parentMenus?: Ref<Menu[]>) {
  const editMenu = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Menu | null;
  });

  // Get parent menu options (excluding current menu and its children to prevent circular references)
  const parentMenuOptions = computed(() => {
    const menus = parentMenus?.value || [];
    const currentId = editMenu.value?.id;

    // Filter out current menu and its descendants
    const filterMenu = (menu: Menu): boolean => {
      if (menu.id === currentId) return false;
      if (menu.children) {
        return !menu.children.some((child) => child.id === currentId || filterMenu(child));
      }
      return true;
    };

    const flattenMenus = (
      menus: Menu[],
      level = 0,
    ): Array<{ value: number | null; label: string }> => {
      const options: Array<{ value: number | null; label: string }> = [];
      menus.forEach((menu) => {
        if (filterMenu(menu) && menu.id) {
          const prefix = "  ".repeat(level);
          options.push({
            value: menu.id,
            label: `${prefix}${menu.title}`,
          });
          if (menu.children && menu.children.length > 0) {
            options.push(...flattenMenus(menu.children, level + 1));
          }
        }
      });
      return options;
    };

    return [{ value: null, label: "None (Top Level)" }, ...flattenMenus(menus)];
  });

  const formConfig: ComputedRef<FormConfig<CreateMenuData>> = computed(() => {
    const parentOptions = parentMenuOptions.value;

    return {
      submitLabel: editMenu.value ? "Update" : "Create",
      resetLabel: "Reset",
      showReset: true,
      layout: "grid",
      columns: 2,
      fields: [
        {
          type: "text",
          name: "title",
          label: "Menu Title",
          placeholder: "Enter menu title",
          required: true,
          maxLength: 255,
          helpText: "The display text for the menu item.",
          group: "Basic Information",
        },
        {
          type: "text",
          name: "link",
          label: "Link URL",
          placeholder: "Enter link URL (e.g., /about, https://example.com)",
          maxLength: 500,
          helpText: "URL or path the menu item links to.",
          group: "Basic Information",
        },
        {
          type: "text",
          name: "slug",
          label: "Slug",
          placeholder: "Auto-generated from title",
          maxLength: 255,
          helpText: "URL-friendly identifier. Auto-generated from title.",
          disabled: true,
          computedValue: (data: CreateMenuData) => {
            if (!data.title) return "";
            // Convert to lowercase, replace spaces and special chars with hyphens
            return data.title
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, "") // Remove special characters except word chars, spaces, and hyphens
              .replace(/\s+/g, "-") // Replace spaces with hyphens
              .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
              .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
          },
          group: "Basic Information",
        },
        {
          type: "select",
          name: "type",
          label: "Menu Type",
          required: true,
          options: [
            { value: "top", label: "Top Menu" },
            { value: "main", label: "Main Menu" },
            { value: "footer", label: "Footer Menu" },
          ],
          placeholder: "Select menu type",
          helpText: "Location where this menu appears.",
          group: "Basic Information",
        },
        {
          type: "select",
          name: "target",
          label: "Link Target",
          required: true,
          options: [
            { value: "_self", label: "Same Window" },
            { value: "_blank", label: "New Window" },
          ],
          placeholder: "Select link target",
          helpText: "How the link opens when clicked.",
          group: "Basic Information",
        },
        {
          type: "number",
          name: "order",
          label: "Display Order",
          placeholder: "Enter display order",
          min: 0,
          helpText: "Order in which menu appears (lower numbers first).",
          group: "Basic Information",
        },
        {
          type: "select",
          name: "parent_id",
          label: "Parent Menu",
          options: parentOptions,
          placeholder: "Select parent menu (optional)",
          helpText: "Select a parent menu to create a submenu. Leave as 'None' for top-level menu.",
          group: "Hierarchy",
        },
        {
          type: "switch",
          name: "is_button",
          label: "Is Button Style",
          helpText: "Display this menu item as a button instead of a regular link.",
          group: "Display Options",
        },
        {
          type: "select",
          name: "footertype",
          label: "Footer Type",
          options: [
            { value: "quicklink", label: "Quick Link" },
            { value: "importantlink", label: "Important Link" },
          ],
          placeholder: "Select footer type",
          helpText: "Footer menu classification (only applies to footer menus).",
          group: "Display Options",
          showIf: {
            field: "type",
            operator: "equals",
            value: "footer",
          },
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
          helpText: "The current status of the menu item.",
          group: "Status",
        },
      ],
      initialValues: editMenu.value
        ? {
            title: editMenu.value.title,
            link: editMenu.value.link || "",
            slug: editMenu.value.slug || "",
            target: editMenu.value.target || "_self",
            type: editMenu.value.type || "main",
            footertype: editMenu.value.footertype || null,
            is_button: editMenu.value.is_button || false,
            parent_id: editMenu.value.parent_id || null,
            order: editMenu.value.order || 0,
            status: editMenu.value.status,
          }
        : {
            title: "",
            link: "",
            slug: "",
            target: "_self",
            type: "main",
            footertype: null,
            is_button: false,
            parent_id: null,
            order: 0,
            status: 1,
          },
    };
  });

  return { formConfig };
}
