// /dashboard — the admin shell chrome (sidebar rail + top bar).
import { DashboardChrome } from "@/app/components/DashboardChrome";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardChrome>{children}</DashboardChrome>;
}
