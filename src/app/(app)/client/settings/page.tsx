"use client";

import { PortalShell } from "@/components/portal-shell";
import { useCurrentUser } from "@/lib/role-context";
import { useState } from "react";
import { User, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

export default function ClientSettings() {
  const user = useCurrentUser();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [theme, setTheme] = useState("system");

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <PortalShell title="Settings" subtitle="Manage your portal preferences and account details">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">
            <User className="h-4.5 w-4.5 text-primary" />
            Account Details
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer">
            <Bell className="h-4.5 w-4.5" />
            Notifications
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer">
            <Palette className="h-4.5 w-4.5" />
            Preferences
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer">
            <Shield className="h-4.5 w-4.5" />
            Security & Login
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="panel p-6 bg-card border-border/60 space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Account Information</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your personal credentials and portal representation</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Full Name</label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Email Address</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Workspace Role</label>
                <input
                  type="text"
                  defaultValue="Authorized Client Contact"
                  className="mt-1.5 w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2 text-sm font-semibold text-muted-foreground focus:outline-none cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="panel p-6 bg-card border-border/60 space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Notification Preferences</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Control how and when you receive message alerts</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-foreground block">Email Notifications</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Receive email updates when messages or requests are sent</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </label>

              <hr className="border-border/40" />

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-foreground block">Workspace Marketing & Features</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Weekly summary of activity logs and product release updates</span>
                </div>
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
