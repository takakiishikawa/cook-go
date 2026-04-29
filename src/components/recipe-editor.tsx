import dynamic from "next/dynamic";

export type { RecipeEditorProps } from "./recipe-editor.impl";

export const RecipeEditor = dynamic(
  () => import("./recipe-editor.impl").then((m) => m.RecipeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-64 rounded-lg bg-muted" />
        <div className="h-64 rounded-lg bg-muted" />
      </div>
    ),
  }
);
