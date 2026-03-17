import { defineComponent } from "vue";
import { Badge } from "@/components/ui/badge";
import type { AuthUser } from "@/types/auth";

export default defineComponent({
  name: "RolesCell",
  props: {
    row: {
      type: Object as () => AuthUser,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  render() {
    const roles = Array.isArray(this.row.roles) ? this.row.roles : [];

    if (roles.length === 0) {
      return <span class="text-muted-foreground text-sm italic">No roles</span>;
    }

    return (
      <div class="flex flex-wrap gap-1">
        {roles.map((role) => (
          <Badge variant="secondary" class="capitalize py-1">
            {role}
          </Badge>
        ))}
      </div>
    );
  },
});
