import { Shell } from "@/components/layout/shell";
import { DisconnectedConnectionsBanner } from "@/components/dashboard/disconnected-connections-banner";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Shell>
      <div className="space-y-6">
        <DisconnectedConnectionsBanner />
        {children}
      </div>
    </Shell>
  );
}
