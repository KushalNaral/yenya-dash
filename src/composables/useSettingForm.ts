import { computed, type Ref, type ComputedRef } from "vue";
import type { Setting, CreateSettingData } from "@/types/settings/setting";
import type { FormConfig } from "@/types/form";

export function useSettingForm(
  editData?: Ref<Setting | null> | Setting | null,
) {
  const editSetting = computed(() => {
    if (editData && "value" in editData) {
      return editData.value;
    }
    return editData as Setting | null;
  });

  const formConfig: ComputedRef<FormConfig<CreateSettingData>> = computed(
    () => ({
      submitLabel: editSetting.value ? "Update" : "Create",
      resetLabel: "Reset",
      showReset: true,
      layout: "grid",
      columns: 2,
      fields: [
        // General Information Group
        {
          type: "text",
          name: "location",
          label: "Location",
          placeholder: "Enter location/address",
          maxLength: 500,
          helpText: "Physical location or address.",
          group: "General Information",
        },
        {
          type: "text",
          name: "phone",
          label: "Phone",
          placeholder: "Enter phone number",
          maxLength: 255,
          helpText: "Main contact phone number.",
          group: "General Information",
        },
        {
          type: "text",
          name: "whatsapp_number",
          label: "WhatsApp Number",
          placeholder: "Enter WhatsApp number",
          maxLength: 255,
          helpText: "Main contact WhatsApp number.",
          group: "General Information",
        },
        {
          type: "email",
          name: "email",
          label: "Email",
          placeholder: "Enter email address",
          maxLength: 255,
          helpText: "Main contact email address.",
          group: "General Information",
        },
        {
          type: "textarea",
          name: "map_location",
          label: "Map Location/Embed",
          placeholder: "Enter map embed code or location",
          maxLength: 1000,
          helpText: "Map embed code or location information.",
          group: "General Information",
          colSpan: 2,
        },
        {
          type: "file",
          name: "assets",
          label: "Logo/Image",
          accept: "image/*",
          helpText: "Upload logo or main image for the website.",
          group: "General Information",
          colSpan: 2,
        },

        // Title related settings
        {
          type: "text",
          name: "site_title",
          label: "Site Title",
          placeholder: "Enter Site title",
          maxLength: 255,
          helpText: "Site title in the main homepage",
          group: "Title Settings",
        },
        {
          type: "text",
          name: "site_caption",
          label: "Site Caption",
          placeholder: "Enter site caption",
          maxLength: 500,
          helpText: "Site caption displayed in search results and meta tags.",
          group: "Title Settings",
        },
        {
          type: "text",
          name: "partner_title",
          label: "Partner Title",
          placeholder: "Enter partner title",
          maxLength: 255,
          helpText: "Partner title displayed on partner section of homepage.",
          group: "Title Settings",
        },
        {
          type: "text",
          name: "solution_title",
          label: "Solution Title",
          placeholder: "Enter solution title",
          maxLength: 255,
          helpText: "Solution title displayed on solution section of homepage.",
          group: "Title Settings",
        },
        {
          type: "text",
          name: "digital_title",
          label: "Digital Title",
          placeholder: "Enter digital title",
          maxLength: 255,
          helpText: "Digital title displayed on digital section of homepage.",
          group: "Title Settings",
        },
        {
          type: "text",
          name: "footer_title",
          label: "Footer Title",
          placeholder: "Enter footer title",
          maxLength: 255,
          helpText: "Footer title displayed in the footer section.",
          group: "Title Settings",
        },

        // Social Media Links Group
        {
          type: "text",
          name: "fb_link",
          label: "Facebook Link",
          placeholder: "Enter Facebook page URL",
          maxLength: 500,
          helpText: "URL to Facebook page.",
          group: "Social Media Links",
        },
        {
          type: "text",
          name: "yt_link",
          label: "YouTube Link",
          placeholder: "Enter YouTube channel URL",
          maxLength: 500,
          helpText: "URL to YouTube channel.",
          group: "Social Media Links",
        },
        {
          type: "text",
          name: "insta_link",
          label: "Instagram Link",
          placeholder: "Enter Instagram profile URL",
          maxLength: 500,
          helpText: "URL to Instagram profile.",
          group: "Social Media Links",
        },
        {
          type: "text",
          name: "linkedin_link",
          label: "LinkedIn Link",
          placeholder: "Enter LinkedIn page URL",
          maxLength: 500,
          helpText: "URL to LinkedIn page.",
          group: "Social Media Links",
        },
        // Website Configuration Group
        {
          type: "text",
          name: "copyright",
          label: "Copyright Text",
          placeholder: "Enter copyright text",
          maxLength: 500,
          helpText: "Copyright notice text.",
          group: "Website Configuration",
        },
        {
          type: "number",
          name: "popup_duration",
          label: "Popup Duration (days)",
          placeholder: "Enter popup duration in days",
          min: 0,
          helpText: "Duration for popup display in days.",
          group: "Website Configuration",
        },
        {
          type: "switch",
          name: "is_maintainance_mode",
          label: "Maintenance Mode",
          helpText:
            "WARNING: Enabling this will disrupt website access for all users. Use with caution!",
          group: "Website Configuration",
        },
      ],
      initialValues: editSetting.value
        ? {
            map_location: editSetting.value.map_location || "",
            location: editSetting.value.location || "",
            email: editSetting.value.email || "",
            phone: editSetting.value.phone || "",
            whatsapp_number: editSetting.value.whatsapp_number || "",
            site_title: editSetting.value.site_title || "",
            site_caption: editSetting.value.site_caption || "",
            partner_title: editSetting.value.partner_title || "",
            solution_title: editSetting.value.solution_title || "",
            digital_title: editSetting.value.digital_title || "",
            footer_title: editSetting.value.footer_title || "",
            fb_link: editSetting.value.fb_link || "",
            yt_link: editSetting.value.yt_link || "",
            insta_link: editSetting.value.insta_link || "",
            linkedin_link: editSetting.value.linkedin_link || "",
            copyright: editSetting.value.copyright || "",
            popup_duration: editSetting.value.popup_duration || 7,
            is_maintainance_mode:
              editSetting.value.is_maintainance_mode || false,
            assets: editSetting.value.primary_image?.url || null,
          }
        : {
            map_location: "",
            location: "",
            email: "",
            phone: "",
            whatsapp_number: "",
            site_title: "",
            site_caption: "",
            partner_title: "",
            solution_title: "",
            digital_title: "",
            footer_title: "",
            fb_link: "",
            yt_link: "",
            insta_link: "",
            linkedin_link: "",
            copyright: "",
            inflation_rate: "",
            popup_duration: 7,
            is_maintainance_mode: false,
            assets: null,
          },
    }),
  );

  return { formConfig };
}
