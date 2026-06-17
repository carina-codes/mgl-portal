import { projects } from "@/lib/mock-data";
import View from "./view";

export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}

export default function Page() {
  return <View />;
}
