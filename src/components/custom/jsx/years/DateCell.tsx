import { defineComponent, computed } from "vue";
import { CalendarIcon } from "lucide-vue-next";

interface Props {
  row: Record<string, any>;
  value: string;
}

export default defineComponent({
  name: "DateCell",
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
  setup(props: Props) {
    const formattedDate = computed(() => {
      if (!props.value) return "-";
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(props.value).toLocaleDateString("en-US", options);
    });

    const badgeClasses = computed(() => {
      if (!props.value) return "bg-gray-100 text-gray-700";

      const now = new Date();
      const date = new Date(props.value);

      if (date < now && date.toDateString() !== now.toDateString())
        return "bg-red-100 text-red-700"; // past
      if (date.toDateString() === now.toDateString()) return "bg-yellow-100 text-yellow-700"; // today
      return "bg-green-100 text-green-700"; // future
    });

    return { formattedDate, badgeClasses };
  },
  render() {
    return (
      <div
        class={`inline-flex items-center space-x-1 text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer ${this.badgeClasses}`}
        title={this.value ? new Date(this.value).toLocaleString() : "No date"}
      >
        <CalendarIcon class="w-3.5 h-3.5" />
        <span>{this.formattedDate}</span>
      </div>
    );
  },
});
