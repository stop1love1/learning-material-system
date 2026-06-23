import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TRubrics } from "@/app/screens/resources";

export const metadata: Metadata = { title: "Rubrics" };

export default function Page() {
  return <ScreenHost Screen={TRubrics} routeKey="rubrics" />;
}
