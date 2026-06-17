import { clients } from "@/lib/mock-data";
import View from "./view";

export function generateStaticParams() {
  return clients.map((c) => ({ clientId: c.id }));
}

export default function Page() {
  return <View />;
}
