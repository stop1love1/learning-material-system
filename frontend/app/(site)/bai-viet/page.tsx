import type { Metadata } from "next";
import { Suspense } from "react";
import ScreenHost from "@/app/components/ScreenHost";
import { SBlog } from "@/app/screens/blog";

export const metadata: Metadata = { title: "Bài viết" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScreenHost Screen={SBlog} routeKey="blog" />
    </Suspense>
  );
}
