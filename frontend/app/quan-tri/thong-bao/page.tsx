import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { NotifyScreen } from "@/app/screens/misc";

export const metadata: Metadata = { title: "Nhật ký & thông báo" };

export default function Page() {
  return <ScreenHost Screen={NotifyScreen} routeKey="notify" />;
}
