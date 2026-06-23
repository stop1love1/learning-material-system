import ScreenHost from "@/app/components/ScreenHost";
import { TGradeOne } from "@/app/screens/grade";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScreenHost Screen={TGradeOne} routeKey="grade-one" ctx={{ assignment: id }} />;
}
