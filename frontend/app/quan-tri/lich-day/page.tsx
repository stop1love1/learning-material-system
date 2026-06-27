import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TSchedule } from "@/app/screens/schedule";

export const metadata: Metadata = { title: "Lịch dạy" };

export default function Page() {
  return <ScreenHost Screen={TSchedule} routeKey="a-schedule" />;
}
