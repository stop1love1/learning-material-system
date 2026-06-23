import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TAssignments } from "@/app/screens/assign";

export const metadata: Metadata = { title: "Bài tập & Giao bài" };

export default function Page() {
  return <ScreenHost Screen={TAssignments} routeKey="assignments" />;
}
