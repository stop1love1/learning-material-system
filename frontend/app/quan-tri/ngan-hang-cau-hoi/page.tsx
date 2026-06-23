import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TBank } from "@/app/screens/bank";

export const metadata: Metadata = { title: "Ngân hàng câu hỏi" };

export default function Page() {
  return <ScreenHost Screen={TBank} routeKey="bank" />;
}
