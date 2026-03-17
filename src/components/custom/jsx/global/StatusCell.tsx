import { defineComponent, h } from "vue";
import { Badge } from "@/components/ui/badge";

const DEFAULT_STATUS_MAP = {
  1: { label: "Active", variant: "success" },
  0: { label: "Inactive", variant: "destructive" },
};

export default defineComponent({
  props: {
    value: {
      type: [Number, String, null],
      required: false,
    },
    row: { type: Object },
    column: { type: Object },
    rowIndex: { type: Number },
  },
  render() {
    const statusMap = this.column?.statusMap || DEFAULT_STATUS_MAP;
    const resolvedValue = this.value ?? "unknown";

    const statusConfig = statusMap[resolvedValue as any] || {
      label: String(resolvedValue),
      variant: "outline",
    };

    return h(
      Badge,
      {
        variant: statusConfig.variant,
      },
      {
        default: () => statusConfig.label,
      },
    );
  },
});
