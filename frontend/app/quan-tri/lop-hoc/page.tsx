import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { AClasses } from "@/app/screens/classes";

export const metadata: Metadata = { title: "Lớp học" };

export default function Page() {
  return <ScreenHost Screen={AClasses} routeKey="a-classes" />;
}
