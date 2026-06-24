import type { Metadata } from "next";
import { Suspense } from "react";
import ScreenHost from "@/app/components/ScreenHost";
import { STasks } from "@/app/screens/student";

export const metadata: Metadata = { title: "Luyện tập" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScreenHost Screen={STasks} routeKey="s-tasks" />
    </Suspense>
  );
}
