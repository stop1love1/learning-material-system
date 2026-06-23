import ScreenHost from "@/app/components/ScreenHost";
import { TRubricEdit } from "@/app/screens/resources";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScreenHost Screen={TRubricEdit} routeKey="rubric-edit" ctx={{ rubric: id }} />;
}
