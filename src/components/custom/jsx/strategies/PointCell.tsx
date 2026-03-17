import { defineComponent } from "vue";
import { Badge } from "@/components/ui/badge";

export default defineComponent({
  name: "PointNoCell",
  props: {
    row: {
      type: Object,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  render() {
    const getPointClass = (pointNo: string) => {
      const level = pointNo.split(".").length;

      switch (level) {
        case 1: // Top-level
          return "bg-indigo-500/20 text-indigo-700 border border-indigo-500/30";
        case 2: // Second-level
          return "bg-blue-500/20 text-blue-700 border border-blue-500/30";
        case 3: // Third-level
          return "bg-teal-500/20 text-teal-700 border border-teal-500/30";
        default: // Deeper nesting
          return "bg-gray-500/20 text-gray-700 border border-gray-500/30";
      }
    };

    const formatPoint = (pointNo: string) => {
      // Example: "1.2.1" → "1 › 2 › 1"
      return pointNo.split(".").join(" › ");
    };

    return (
      <Badge
        class={`text-xs py-1 px-2 rounded-md font-semibold tracking-wide ${getPointClass(
          this.value,
        )}`}
      >
        {formatPoint(this.value)}
      </Badge>
    );
  },
});
