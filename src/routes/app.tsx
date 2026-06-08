import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AIAssistant } from "@/components/ai-assistant";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <>
      <Outlet />
      <AIAssistant />
    </>
  );
}
