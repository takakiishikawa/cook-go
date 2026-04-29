import dynamic from "next/dynamic";

export type { LogMealDialogProps } from "./log-meal-dialog.impl";

export const LogMealDialog = dynamic(
  () => import("./log-meal-dialog.impl").then((m) => m.LogMealDialog),
  { ssr: false }
);
