import { defineComponent } from "vue";
import { Badge } from "@/components/ui/badge";

export default defineComponent({
  name: "VerificationCell",
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
    const getStatusClass = (status: string) => {
      switch (status) {
        case "verified":
          return "bg-green-500/20 text-green-700 border border-green-500/30";
        case "not_verified":
          return "bg-blue-500/20 text-blue-700 border border-blue-500/30";
        default:
          return "bg-red-500/20 text-red-700 border border-red-500/30";
      }
    };

    const getStatusName = (status: string) => {
      switch (status) {
        case "verified":
          return "Verified";
        case "not_verified":
          return "Not Verified";
        default:
          return "Rejected";
      }
    };

    return (
      <Badge class={`text-xs py-1 px-2 rounded-md font-medium ${getStatusClass(this.value)}`}>
        {getStatusName(this.value)}
      </Badge>
    );
  },
});
