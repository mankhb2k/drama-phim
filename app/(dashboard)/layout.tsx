import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { Toaster } from "@/components/dashboard/Toaster";
import { DashboardBodyScrollLock } from "@/components/dashboard/DashboardBodyScrollLock";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <DashboardBodyScrollLock />
      <div className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-background md:flex-row">
        <DashboardSidebar />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
        <Toaster />
        <ConfirmDialog />
      </div>
    </>
  );
}
