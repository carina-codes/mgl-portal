import { AIAssistant } from "@/components/ai-assistant";

export default function AppLayout({
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
