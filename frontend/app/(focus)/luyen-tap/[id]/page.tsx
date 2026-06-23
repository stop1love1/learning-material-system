import ScreenHost from "@/app/components/ScreenHost";
import { STask } from "@/app/screens/student";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScreenHost Screen={STask} routeKey="s-task" ctx={{ task: id }} />;
}
