import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { AReports } from "@/app/screens/admin";

export const metadata: Metadata = { title: "Báo cáo & Thống kê" };

export default function Page() {
  return <ScreenHost Screen={AReports} routeKey="a-reports" />;
}
