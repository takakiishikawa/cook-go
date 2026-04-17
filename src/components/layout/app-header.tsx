"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

interface AppHeaderProps {
  title: string;
  showSettings?: boolean;
}

export function AppHeader({ title, showSettings = false }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="font-heading text-xl text-foreground">{title}</h1>
        {showSettings && (
          <Link href="/settings" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        )}
      </div>
    </header>
  );
}
