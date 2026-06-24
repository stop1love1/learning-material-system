import type { Metadata } from "next";
import { Suspense } from "react";
import ScreenHost from "@/app/components/ScreenHost";
import { TBankEdit } from "@/app/screens/bank";

export const metadata: Metadata = { title: "Soạn câu hỏi" };

// TBankEdit dùng useSearchParams (đọc ?id= khi sửa) → cần Suspense để build static OK.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScreenHost Screen={TBankEdit} routeKey="bank-edit" />
    </Suspense>
  );
}
