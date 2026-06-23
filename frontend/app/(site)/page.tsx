import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { UserHome } from "@/app/screens/student";

export const metadata: Metadata = { title: "Trang chủ" };

export default function Page() {
  return <ScreenHost Screen={UserHome} routeKey="home" />;
}
