import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { AOverview } from "@/app/screens/admin";

export const metadata: Metadata = { title: "Tổng quan" };

export default function Page() {
  return <ScreenHost Screen={AOverview} routeKey="a-overview" />;
}
