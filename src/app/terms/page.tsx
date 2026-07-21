"use client";

import { AppShell } from "@/components/app-shell";
import { useRole } from "@/lib/role-context";

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: [
      "By accessing or using the MGL Portal (\"the Portal\"), you agree to be bound by these Terms of Service. If you are using the Portal on behalf of an organization, you represent that you have the authority to bind that organization to these terms.",
    ],
  },
  {
    title: "2. Who can use the Portal",
    body: [
      "Access is limited to MGL Agency owners and staff, and to clients who have been invited to a workspace. Accounts are personal and may not be shared. You are responsible for all activity that occurs under your login.",
    ],
  },
  {
    title: "3. Client content",
    body: [
      "Projects, files, messages, and other materials you upload or submit through the Portal (\"Client Content\") remain your property. You grant MGL Agency a limited license to host, display, and process Client Content solely to provide and support the Portal.",
      "You are responsible for ensuring you have the necessary rights to any content you upload, and for keeping backups of anything you cannot afford to lose.",
    ],
  },
  {
    title: "4. Requests, approvals, and time tracking",
    body: [
      "Change requests, approvals, and logged hours submitted through the Portal are treated as the authoritative record for scoping and billing purposes unless otherwise agreed in writing.",
    ],
  },
  {
    title: "5. Payment and billing",
    body: [
      "Fees are billed according to the engagement terms agreed between you and MGL Agency outside the Portal. The Portal displays invoices and payment status for convenience only and is not itself a payment processor.",
    ],
  },
  {
    title: "6. Confidentiality",
    body: [
      "Each party agrees to keep the other's non-public information confidential and to use it only for purposes related to the engagement, consistent with any separate confidentiality or master services agreement in place.",
    ],
  },
  {
    title: "7. Acceptable use",
    body: [
      "You agree not to misuse the Portal — including attempting to access another workspace without authorization, uploading unlawful content, or interfering with the Portal's normal operation.",
    ],
  },
  {
    title: "8. Availability and support",
    body: [
      "We aim to keep the Portal available and reliable but do not guarantee uninterrupted access. Support requests can be sent to the support address in the footer of this page.",
    ],
  },
  {
    title: "9. Termination",
    body: [
      "Either party may stop using the Portal at any time. MGL Agency may suspend or terminate access for accounts that violate these terms or where the underlying client engagement has ended.",
    ],
  },
  {
    title: "10. Limitation of liability",
    body: [
      "The Portal is provided \"as is.\" To the fullest extent permitted by law, MGL Agency is not liable for indirect, incidental, or consequential damages arising from use of the Portal.",
    ],
  },
  {
    title: "11. Changes to these terms",
    body: [
      "We may update these terms from time to time. Material changes will be noted on the Updates page. Continued use of the Portal after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "Questions about these terms can be directed to carina@mglagency.com.",
    ],
  },
];

export default function TermsPage() {
  const { role: contextRole } = useRole();
  const role = contextRole === "manager" ? "team" : contextRole;

  return (
    <AppShell
      role={role}
      title="Terms of Service"
      subtitle="Last updated July 21, 2026"
    >
      <div className="panel p-6 md:p-8 space-y-7">
        <p className="text-sm text-muted-foreground leading-relaxed">
          These Terms of Service govern access to and use of the MGL Portal, the client
          execution platform operated by MGL Agency. Please read them carefully.
        </p>

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
            <div className="mt-2 space-y-2">
              {section.body.map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
