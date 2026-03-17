import { defineComponent } from "vue";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuthUser } from "@/types/auth";

export default defineComponent({
  name: "InstitutionsCell",
  props: {
    row: {
      type: Object as () => AuthUser,
      required: true,
    },
    value: {
      type: Array,
      required: true,
    },
  },
  render() {
    const institutions = Array.isArray(this.row.institutions) ? this.row.institutions : [];

    if (institutions.length === 0) {
      return <span class="text-muted-foreground text-sm italic">No institutions</span>;
    }

    // Sort institutions alphabetically by name
    const sortedInstitutions = [...institutions].sort((a, b) => a.name.localeCompare(b.name));

    // Show first 2 as badges, and +more in popover if more than 2
    const displayed = sortedInstitutions.slice(0, 2);
    const more = sortedInstitutions.slice(2);

    return (
      <div class="flex flex-wrap gap-1 items-center">
        {displayed.map((inst) => (
          <Badge
            variant={inst.status === "active" ? "default" : "destructive"}
            class="capitalize py-1 px-2 text-xs"
          >
            {inst.name} ({inst.status})
          </Badge>
        ))}
        {more.length > 0 && (
          <Popover>
            <PopoverTrigger as-child>
              <Badge variant="outline" class="cursor-pointer hover:bg-accent/50 text-xs py-1 px-2">
                +{more.length} more
              </Badge>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-0">
              <ScrollArea class="h-[200px] p-4">
                <div class="space-y-2">
                  {more.map((inst) => (
                    <div class="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                      <span class="text-sm font-medium">{inst.name}</span>
                      <Badge
                        variant={inst.status === "active" ? "default" : "destructive"}
                        class="text-xs"
                      >
                        {inst.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  },
});
