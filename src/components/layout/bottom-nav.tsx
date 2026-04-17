"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ShoppingCart, Package, Settings, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "ホーム" },
  { href: "/recipes", icon: BookOpen, label: "レシピ" },
  { href: "/log", icon: PlusCircle, label: "記録", isPrimary: true },
  { href: "/shopping", icon: ShoppingCart, label: "買い物" },
  { href: "/pantry", icon: Package, label: "ストック" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label, isPrimary }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          if (isPrimary) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center -mt-6">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                  isActive ? "bg-primary" : "bg-primary"
                )}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>{label}</span>
              </Link>
            );
          }
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 py-1 px-3">
              <Icon
                className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
