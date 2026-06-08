import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AIAssistant } from "@/components/ai-assistant";

export const Route = createFileRoute("/portal")({ component: PortalLayout });

function PortalLayout() {
  return (
    <>
      <Outlet />
      <AIAssistant />
    </>
  );
}
