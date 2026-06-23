import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { ASettings } from "@/app/screens/admin";

export const metadata: Metadata = { title: "Cài đặt hệ thống" };

export default function Page() {
  return <ScreenHost Screen={ASettings} routeKey="a-settings" />;
}
