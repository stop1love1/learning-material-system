import type { Metadata } from "next";
import { Suspense } from "react";
import ScreenHost from "@/app/components/ScreenHost";
import { TAssignNew } from "@/app/screens/assign";

export const metadata: Metadata = { title: "Giao bài tập mới" };

// TAssignNew dùng useSearchParams (đọc ?id= khi sửa) → cần Suspense để build static OK.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScreenHost Screen={TAssignNew} routeKey="assign-new" />
    </Suspense>
  );
}
