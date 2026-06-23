import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { STasks } from "@/app/screens/student";

export const metadata: Metadata = { title: "Luyện tập" };

export default function Page() {
  return <ScreenHost Screen={STasks} routeKey="s-tasks" />;
}
