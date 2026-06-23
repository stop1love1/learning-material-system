import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { SDocs } from "@/app/screens/student";

export const metadata: Metadata = { title: "Kho tài liệu" };

export default function Page() {
  return <ScreenHost Screen={SDocs} routeKey="s-docs" />;
}
