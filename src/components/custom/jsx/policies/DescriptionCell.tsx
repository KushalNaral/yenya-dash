import { defineComponent, PropType } from "vue";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Truncate text to a specific length for display
const truncateText = (text: string | null, maxLength: number = 15): string => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
};

export default defineComponent({
  name: "DescriptionCell",
  props: {
    row: {
      type: Object as PropType<object>,
      required: true,
    },
    value: {
      type: String as PropType<string | null>,
      required: true,
    },
  },
  render() {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="text-sm text-foreground truncate block max-w-[150px]">
              {truncateText(this.value)}
            </span>
          </TooltipTrigger>
          {this.value && (
            <TooltipContent class="max-w-[300px] p-2 bg-background border border-border shadow-md">
              <p class="text-sm text-foreground whitespace-pre-wrap">{this.value}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  },
});
