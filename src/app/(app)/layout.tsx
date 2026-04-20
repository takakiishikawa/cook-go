import { AppLayout } from "@takaki/go-design-system";
import { CookGoSidebar } from "@/components/layout/cook-go-sidebar";

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout sidebar={<CookGoSidebar />}>
      {children}
    </AppLayout>
  );
}
