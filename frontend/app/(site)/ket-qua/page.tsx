import type { Metadata } from "next";
import { Suspense } from "react";
import ScreenHost from "@/app/components/ScreenHost";
import { SResults } from "@/app/screens/student";

export const metadata: Metadata = { title: "Kết quả" };

// SResults dùng useSearchParams (đọc ?ex= để mở sẵn bài vừa bấm từ "Của tôi") → cần Suspense.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScreenHost Screen={SResults} routeKey="s-results" />
    </Suspense>
  );
}
