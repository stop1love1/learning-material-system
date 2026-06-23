import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { SBlog } from "@/app/screens/blog";

export const metadata: Metadata = { title: "Bài viết" };

export default function Page() {
  return <ScreenHost Screen={SBlog} routeKey="blog" />;
}
