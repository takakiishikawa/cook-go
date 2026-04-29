import dynamic from "next/dynamic";

export type { RecipePickerDialogProps } from "./recipe-picker-dialog.impl";

export const RecipePickerDialog = dynamic(
  () =>
    import("./recipe-picker-dialog.impl").then((m) => m.RecipePickerDialog),
  { ssr: false }
);
