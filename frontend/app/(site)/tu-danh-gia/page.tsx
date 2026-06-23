import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { SSelfCheck } from "@/app/screens/student";

export const metadata: Metadata = { title: "Tự đánh giá" };

export default function Page() {
  return <ScreenHost Screen={SSelfCheck} routeKey="s-selfcheck" />;
}
