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
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3.5 md:px-6">
        {backHref && (
          <Link href={backHref} className="p-1.5 rounded-xl hover:bg-muted transition-colors -ml-1">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
        )}
        <h1 className="text-lg font-bold text-foreground flex-1">{title}</h1>
        {showSettings && (
          <Link href="/settings" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        )}
      </div>
    </header>
  );
}
