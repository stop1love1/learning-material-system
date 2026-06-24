import type { Metadata } from "next";
import { Suspense } from "react";
import ScreenHost from "@/app/components/ScreenHost";
import { SDocs } from "@/app/screens/student";

export const metadata: Metadata = { title: "Kho tài liệu" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScreenHost Screen={SDocs} routeKey="s-docs" />
    </Suspense>
  );
}
