"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, BookOpen, ShoppingCart, Archive, Settings, PlusCircle, LogOut, Leaf } from "lucide-react";
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
  AppSwitcher,
} from "@takaki/go-design-system";
import { createClient } from "@/lib/supabase/client";

const GO_APPS = [
  { name: "NativeGo", url: "https://native-go.vercel.app", color: "#3B82F6" },
  { name: "CareGo", url: "https://care-go.vercel.app", color: "#EC4899" },
  { name: "KenyakuGo", url: "https://kenyaku-go.vercel.app", color: "#F59E0B" },
  { name: "TaskGo", url: "https://task-go.vercel.app", color: "#8B5CF6" },
  { name: "CookGo", url: "https://cook-go.vercel.app", color: "#16A34A" },
  { name: "PhysicalGo", url: "https://physical-go.vercel.app", color: "#06B6D4" },
  { name: "Design System", url: "https://go-design-system.vercel.app", color: "#6B7280" },
] as const;

const navItems = [
  { href: "/dashboard", icon: Home, label: "ホーム" },
  { href: "/log", icon: PlusCircle, label: "食事記録" },
  { href: "/recipes", icon: BookOpen, label: "レシピ" },
  { href: "/shopping", icon: ShoppingCart, label: "買い物リスト" },
  { href: "/pantry", icon: Archive, label: "食材庫" },
];

const footerItems = [
  { href: "/settings", icon: Settings, label: "設定" },
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function CookGoSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Sidebar>
      {/* Header: Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex items-center justify-center rounded-md bg-primary p-1.5 shrink-0">
                  <Leaf className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none min-w-0">
                  <span className="text-xs text-muted-foreground">App</span>
                  <span className="text-sm font-semibold tracking-tight truncate">CookGo</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Nav */}
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

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
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

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4 shrink-0" />
              ログアウト
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* App Switcher */}
        <AppSwitcher
          currentApp="CookGo"
          apps={GO_APPS as unknown as Array<{ name: string; url: string; color: string }>}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
