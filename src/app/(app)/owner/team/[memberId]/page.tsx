import { users } from "@/lib/mock-data";
import View from "./view";

export function generateStaticParams() {
  return users.filter((u) => u.role !== "client").map((u) => ({ memberId: u.id }));
}

export default function Page() {
  return <View />;
}
