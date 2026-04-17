"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ShoppingCart, Archive, Settings, PlusCircle, Leaf, ChevronUp, LogOut, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: Home, label: "ホーム" },
  { href: "/log", icon: PlusCircle, label: "食事記録" },
  { href: "/recipes", icon: BookOpen, label: "レシピ" },
  { href: "/shopping", icon: ShoppingCart, label: "買い物リスト" },
  { href: "/pantry", icon: Archive, label: "食材庫" },
];

const goApps = [
  { name: "NativeGo",   href: "https://english-learning-app-black.vercel.app/",   color: "#E5484D" },
  { name: "CareGo",     href: "https://care-go-mu.vercel.app/dashboard",           color: "#30A46C" },
  { name: "KenyakuGo",  href: "https://kenyaku-go.vercel.app/",                   color: "#F5A623" },
  { name: "TaskGo",     href: "https://taskgo-dun.vercel.app/",                   color: "#5E6AD2" },
  { name: "CookGo",     href: "https://cook-go-lovat.vercel.app/dashboard",        color: "#1AD1A5", isCurrent: true },
  { name: "PhysicalGo", href: "https://physical-go.vercel.app/dashboard",          color: "#FF6B6B" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [appsOpen, setAppsOpen] = useState(false);
  const appsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) {
        setAppsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border hover:opacity-75 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
          <Leaf className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <span className="font-bold text-base text-sidebar-accent-foreground tracking-tight">CookGo</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {/* Goシリーズ アプリ切り替え */}
        <div ref={appsRef} className="relative">
          <button
            onClick={() => setAppsOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              appsOpen
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <LayoutGrid className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            <span className="flex-1 text-left">Goシリーズ</span>
            <ChevronUp
              className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", !appsOpen && "rotate-180")}
              strokeWidth={2}
            />
          </button>

          {appsOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-sidebar-accent border border-sidebar-border rounded-xl shadow-xl overflow-hidden z-50">
              {goApps.map((app) => {
                if (app.isCurrent) {
                  return (
                    <div
                      key={app.name}
                      className="flex items-center gap-3 px-3 py-2.5 bg-sidebar-primary/10 cursor-default"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: app.color }}
                      />
                      <span className="text-sm font-semibold text-sidebar-accent-foreground flex-1">{app.name}</span>
                      <span className="text-xs text-sidebar-primary font-medium">現在</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={app.name}
                    href={app.href}
                    onClick={() => setAppsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: app.color }}
                    />
                    <span className="text-sm font-medium text-sidebar-foreground">{app.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 設定 */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          設定
        </Link>

        {/* ログアウト */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          ログアウト
        </button>
      </div>
    </aside>
  );
}
