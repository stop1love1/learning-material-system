import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TAssignNew } from "@/app/screens/assign";

export const metadata: Metadata = { title: "Giao bài tập mới" };

export default function Page() {
  return <ScreenHost Screen={TAssignNew} routeKey="assign-new" />;
}
