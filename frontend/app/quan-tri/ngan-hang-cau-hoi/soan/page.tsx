import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TBankEdit } from "@/app/screens/bank";

export const metadata: Metadata = { title: "Soạn câu hỏi" };

export default function Page() {
  return <ScreenHost Screen={TBankEdit} routeKey="bank-edit" />;
}
