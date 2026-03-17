import { defineComponent } from "vue";
import { Badge } from "@/components/ui/badge";

export default defineComponent({
  name: "InstitutionCell",
  props: {
    row: {
      type: Object,
      required: true,
    },
    value: {
      type: Object,
      required: true,
    },
  },
  render() {
    return (
      <Badge
        class={`text-xs py-1 px-2 rounded-md font-medium bg-green-500/20 text-green-700 border border-green-500/30 `}
      >
        {this.value.name}
      </Badge>
    );
  },
});
