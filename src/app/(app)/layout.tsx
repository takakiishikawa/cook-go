import { SidebarProvider, SidebarInset } from "@takaki/go-design-system";
import { CookGoSidebar } from "@/components/layout/cook-go-sidebar";

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <CookGoSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
