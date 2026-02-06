import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen min-h-screen flex-col bg-background md:flex-row">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
