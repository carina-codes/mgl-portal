import { AIAssistant } from "@/components/ai-assistant";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AIAssistant />
    </>
  );
}
