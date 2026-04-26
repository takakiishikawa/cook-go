import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@takaki/go-design-system";

interface AppHeaderProps {
  backHref?: string;
}

export function AppHeader({ backHref }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 h-12 px-3 bg-background border-b border-border shrink-0">
      <SidebarTrigger className="-ml-1 shrink-0" />
      {backHref && (
        <Link
          href={backHref}
          className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
      )}
    </header>
  );
}
