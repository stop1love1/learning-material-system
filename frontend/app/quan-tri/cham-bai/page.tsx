import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TGrade } from "@/app/screens/grade";

export const metadata: Metadata = { title: "Chấm điểm" };

export default function Page() {
  return <ScreenHost Screen={TGrade} routeKey="grade" />;
}
