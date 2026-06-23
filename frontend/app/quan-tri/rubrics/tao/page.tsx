import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TRubricEdit } from "@/app/screens/resources";

export const metadata: Metadata = { title: "Tạo rubric" };

export default function Page() {
  return <ScreenHost Screen={TRubricEdit} routeKey="rubric-edit" />;
}
