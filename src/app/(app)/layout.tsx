import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />
      <main className="flex-1 min-h-screen pb-20 md:pb-0 md:ml-60">
        <div className="max-w-2xl mx-auto w-full md:max-w-none">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
