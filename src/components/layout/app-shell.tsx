import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="md:pl-64">
        <main className="pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
