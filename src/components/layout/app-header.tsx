"use client";

import Link from "next/link";
import { Settings, ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  title: string;
  showSettings?: boolean;
  backHref?: string;
}

export function AppHeader({ title, showSettings = false, backHref }: AppHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-3 md:px-4 md:py-4">
      {backHref && (
        <Link href={backHref} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
      )}
      <h1 className="text-lg font-bold text-foreground flex-1 truncate">{title}</h1>
      {showSettings && (
        <Link href="/settings" className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
      )}
    </div>
  );
}
