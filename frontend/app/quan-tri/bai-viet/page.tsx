import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { ABlog } from "@/app/screens/blog";

export const metadata: Metadata = { title: "Bài viết / Blog" };

export default function Page() {
  return <ScreenHost Screen={ABlog} routeKey="a-blog" />;
}
