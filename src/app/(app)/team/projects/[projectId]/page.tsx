import { projects } from "@/lib/mock-data";
import { Suspense } from "react";
import View from "./view";

export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <View />
    </Suspense>
  );
}
