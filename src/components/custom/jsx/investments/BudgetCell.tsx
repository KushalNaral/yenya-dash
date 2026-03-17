import { defineComponent, h } from "vue";

export default defineComponent({
  props: {
    row: { type: Object, required: true },
    value: { type: Number, required: true },
    column: { type: Object, required: true },
    rowIndex: { type: Number, required: true },
  },
  render() {
    return h(
      "span",
      new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: "NPR",
      }).format(this.value),
    );
  },
});
