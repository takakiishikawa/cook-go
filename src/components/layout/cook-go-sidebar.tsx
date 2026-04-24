"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, ShoppingCart, Archive, Settings, PlusCircle, LogOut, Leaf, ChevronsUpDown, Check, Sun, Moon, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@takaki/go-design-system";
import { createClient } from "@/lib/supabase/client";

const GO_APPS = [
  { name: "NativeGo",   url: "https://english-learning-app-black.vercel.app/",  color: "#0052CC" },
  { name: "CareGo",     url: "https://care-go-mu.vercel.app/dashboard",          color: "#30A46C" },
  { name: "KenyakuGo",  url: "https://kenyaku-go.vercel.app/",                   color: "#F5A623" },
  { name: "TaskGo",     url: "https://taskgo-dun.vercel.app/",                   color: "#5E6AD2" },
  { name: "CookGo",     url: "https://cook-go-lovat.vercel.app/dashboard",       color: "#16A34A" },
  { name: "PhysicalGo", url: "https://physical-go.vercel.app/dashboard",         color: "#FF6B6B" },
] as const;

const navItems = [
  { href: "/dashboard", icon: Home, label: "ダッシュボード" },
  { href: "/log", icon: PlusCircle, label: "記録" },
  { href: "/recipes", icon: BookOpen, label: "レシピ" },
  { href: "/shopping", icon: ShoppingCart, label: "買い物リスト" },
  { href: "/pantry", icon: Archive, label: "食材庫" },
];

const footerItems = [
  { href: "/concept", icon: FileText, label: "コンセプト" },
  { href: "/settings", icon: Settings, label: "設定" },
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function CookGoSidebar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <Sidebar>
      {/* ヘッダー：ロゴ + アプリ切り替え */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center justify-center rounded-md bg-primary p-1.5 shrink-0">
                    <Leaf className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none min-w-0">
                    <span className="text-xs text-muted-foreground">App</span>
                    <span className="text-[15px] font-medium tracking-tight truncate">CookGo</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-52"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">Goシリーズ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {GO_APPS.map((app) => (
                  <DropdownMenuItem
                    key={app.name}
                    onSelect={() => { window.location.href = app.url; }}
                    className="gap-2"
                  >
                    <span
                      className="shrink-0 rounded-full"
                      style={{ width: 8, height: 8, backgroundColor: app.color }}
                      aria-hidden
                    />
                    <span className="flex-1">{app.name}</span>
                    {app.name === "CookGo" && <Check className="h-4 w-4 shrink-0 opacity-70" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* メインナビ */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, icon: Icon, label }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={isActive(href, pathname)}>
                    <Link href={href}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* フッター */}
      <SidebarFooter>
        <SidebarMenu>
          {/* サブページ（設定） */}
          {footerItems.map(({ href, icon: Icon, label }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild isActive={pathname === href}>
                <Link href={href}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* テーマ切り替え */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} className="cursor-pointer">
              {isDark
                ? <Moon className="h-4 w-4 shrink-0" />
                : <Sun className="h-4 w-4 shrink-0" />
              }
              {isDark ? "ダーク" : "ライト"}
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* ログアウト */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="h-4 w-4 shrink-0" />
              ログアウト
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
