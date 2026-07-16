"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { Button as BaseButton } from "@/components/ui/button";
import { User, Accessibility, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useActiveClient } from "@/hooks/use-active-client";
import { TIMEZONE_OPTIONS, detectTimezone } from "@/lib/timezones";

function Button({ className, ...props }: React.ComponentProps<typeof BaseButton>) {
  return <BaseButton className={cn("rounded-full font-semibold", className)} {...props} />;
}

const SECTIONS = [
  { id: "profile", label: "My profile", icon: User },
  { id: "business", label: "Business profile", icon: Building2 },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function ClientSettingsPage() {
  const [active, setActive] = useState<SectionId>("profile");

  return (
    <AppShell role="client" title="Settings" subtitle="Manage your portal preferences and account details">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="panel p-3 space-y-1 text-sm h-fit lg:sticky lg:top-6">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                active === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-6 min-w-0">
          {active === "profile" && <ProfileSection />}
          {active === "business" && <BusinessProfileSection />}
          {active === "accessibility" && <AccessibilitySection />}
        </div>
      </div>
    </AppShell>
  );
}

export default ClientSettingsPage;

/* ---------- Reusable atoms ---------- */

function Section({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ---------- My Profile ---------- */

function ProfileSection() {
  const { client } = useActiveClient();
  const updateClient = useStore((s) => s.updateClient);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: client.contact,
    email: client.contactEmail,
    title: client.contactRole ?? "",
    phone: client.contactPhone ?? "",
    language: "en-US",
  });

  // Keep the form in sync if the active client changes.
  useEffect(() => {
    setProfile({
      name: client.contact,
      email: client.contactEmail,
      title: client.contactRole ?? "",
      phone: client.contactPhone ?? "",
      language: "en-US",
    });
  }, [client.id]);

  const set = (k: keyof typeof profile) => (v: string) => setProfile((p) => ({ ...p, [k]: v }));

  const initials = profile.name.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
  const avatarUrl = client.contactAvatar;
  const isImageAvatar = avatarUrl && (avatarUrl.startsWith("data:") || avatarUrl.includes("/") || avatarUrl.includes("."));

  const handleSave = () => {
    updateClient(client.id, {
      contact: profile.name,
      contactEmail: profile.email,
      contactRole: profile.title,
      contactPhone: profile.phone,
      // Keep the initials-based avatar in sync with the name — but don't
      // clobber an uploaded photo.
      ...(isImageAvatar ? {} : { contactAvatar: initials || "?" }),
    });
    toast.success("Profile saved successfully");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateClient(client.id, { contactAvatar: dataUrl });
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Section title="My profile" description="Manage your personal profile details and contact information.">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            {isImageAvatar ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className="h-16 w-16 object-cover rounded-full ring-2 ring-primary/20"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                {initials || "?"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-semibold">
              Change
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">Profile photo</div>
            <p className="text-xs text-muted-foreground">PNG, JPG or GIF up to 5MB.</p>
            <div className="flex gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload photo</Button>
              <Button variant="ghost" size="sm" onClick={() => { updateClient(client.id, { contactAvatar: initials }); toast.success("Photo removed"); }}>Remove</Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" value={profile.name} onChange={set("name")} />
            <Field label="Title" value={profile.title} onChange={set("title")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email address" type="email" value={profile.email} onChange={set("email")} />
            <Field label="Phone number" type="tel" value={profile.phone} onChange={set("phone")} />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Interface language</div>
            <select
              value={profile.language}
              onChange={(e) => { set("language")(e.target.value); toast(`Language set to ${e.target.value}`); }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="en-US">English (United States)</option>
              <option value="de-DE">Deutsch (German)</option>
              <option value="fr-FR">Français (French)</option>
              <option value="es-ES">Español (Spanish)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => {
            setProfile({
              name: client.contact,
              email: client.contactEmail,
              title: client.contactRole ?? "",
              phone: client.contactPhone ?? "",
              language: "en-US",
            });
            toast("Changes discarded");
          }}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </Section>
    </>
  );
}

/* ---------- Business profile ---------- */

function BusinessProfileSection() {
  const { client } = useActiveClient();
  const updateClient = useStore((s) => s.updateClient);

  const [form, setForm] = useState({
    name: client.name,
    phone: client.phone ?? "",
    businessEmail: client.businessEmail ?? client.contactEmail,
    workingHours: client.workingHours ?? "",
    address: client.address ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    zipCode: client.zipCode ?? "",
    timezone: client.timezone ?? detectTimezone(),
    description: client.description ?? "",
    website: client.website ?? "",
    linkedin: client.socialLinks?.linkedin ?? "",
    instagram: client.socialLinks?.instagram ?? "",
    twitter: client.socialLinks?.twitter ?? "",
    facebook: client.socialLinks?.facebook ?? "",
  });

  // Keep the form in sync if the active client changes.
  useEffect(() => {
    setForm({
      name: client.name,
      phone: client.phone ?? "",
      businessEmail: client.businessEmail ?? client.contactEmail,
      workingHours: client.workingHours ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      zipCode: client.zipCode ?? "",
      timezone: client.timezone ?? detectTimezone(),
      description: client.description ?? "",
      website: client.website ?? "",
      linkedin: client.socialLinks?.linkedin ?? "",
      instagram: client.socialLinks?.instagram ?? "",
      twitter: client.socialLinks?.twitter ?? "",
      facebook: client.socialLinks?.facebook ?? "",
    });
  }, [client.id]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    updateClient(client.id, {
      name: form.name,
      phone: form.phone,
      businessEmail: form.businessEmail,
      workingHours: form.workingHours,
      address: form.address,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode,
      timezone: form.timezone,
      description: form.description,
      website: form.website,
      socialLinks: {
        ...client.socialLinks,
        linkedin: form.linkedin,
        instagram: form.instagram,
        twitter: form.twitter,
        facebook: form.facebook,
      },
    });
    toast.success("Business profile saved");
  };

  return (
    <>
      <Section title="Business details" description="How your business appears in the workspace.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business name" value={form.name} onChange={set("name")} />
            <Field label="Business phone" type="tel" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business email" type="email" value={form.businessEmail} onChange={set("businessEmail")} />
            <Field label="Working hours" value={form.workingHours} onChange={set("workingHours")} />
          </div>
          <Field label="Business address" value={form.address} onChange={set("address")} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City" value={form.city} onChange={set("city")} />
            <Field label="State" value={form.state} onChange={set("state")} />
            <Field label="Zip code" value={form.zipCode} onChange={set("zipCode")} />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Timezone</div>
            <select
              value={form.timezone}
              onChange={(e) => set("timezone")(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {!TIMEZONE_OPTIONS.some((t) => t.tz === form.timezone) && (
                <option value={form.timezone}>{form.timezone}</option>
              )}
              {TIMEZONE_OPTIONS.map((t) => (
                <option key={t.tz} value={t.tz}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Business description</div>
            <textarea
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Core business, company biography..."
              className="mt-1 h-20 w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none text-foreground"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => {
            setForm({
              name: client.name,
              phone: client.phone ?? "",
              businessEmail: client.businessEmail ?? client.contactEmail,
              workingHours: client.workingHours ?? "",
              address: client.address ?? "",
              city: client.city ?? "",
              state: client.state ?? "",
              zipCode: client.zipCode ?? "",
              timezone: client.timezone ?? detectTimezone(),
              description: client.description ?? "",
              website: client.website ?? "",
              linkedin: client.socialLinks?.linkedin ?? "",
              instagram: client.socialLinks?.instagram ?? "",
              twitter: client.socialLinks?.twitter ?? "",
              facebook: client.socialLinks?.facebook ?? "",
            });
            toast("Changes discarded");
          }}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </Section>

      <Section title="Online presence" description="Shared with your project team for reference and reporting.">
        <div className="space-y-4">
          <Field label="Website URL" value={form.website} onChange={set("website")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="LinkedIn URL" value={form.linkedin} onChange={set("linkedin")} />
            <Field label="Instagram URL" value={form.instagram} onChange={set("instagram")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Twitter / X URL" value={form.twitter} onChange={set("twitter")} />
            <Field label="Facebook URL" value={form.facebook} onChange={set("facebook")} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </Section>
    </>
  );
}

/* ---------- Accessibility ---------- */

function AccessibilitySection() {
  const [contrast, setContrast] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-contrast") === "true";
    }
    return false;
  });
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-reduce-motion") === "true";
    }
    return false;
  });
  const [screenReader, setScreenReader] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-screen-reader") === "true";
    }
    return false;
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessibility-font-size") || "default";
    }
    return "default";
  });

  useEffect(() => {
    const el = document.documentElement;
    // Contrast
    if (contrast) {
      el.classList.add("high-contrast");
      let styleTag = document.getElementById("high-contrast-styles");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "high-contrast-styles";
        styleTag.innerHTML = `
          .high-contrast {
            --border: #000000;
            --muted-foreground: #000000;
            contrast: 1.25;
            filter: contrast(1.15) saturate(1.1);
          }
          .dark .high-contrast {
            --border: #ffffff;
            --muted-foreground: #ffffff;
            filter: contrast(1.2) saturate(1.1);
          }
        `;
        document.head.appendChild(styleTag);
      }
    } else {
      el.classList.remove("high-contrast");
      document.getElementById("high-contrast-styles")?.remove();
    }
    localStorage.setItem("accessibility-contrast", String(contrast));
  }, [contrast]);

  useEffect(() => {
    const el = document.documentElement;
    // Reduce motion
    if (reduceMotion) {
      el.classList.add("reduce-motion");
      let styleTag = document.getElementById("reduce-motion-styles");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "reduce-motion-styles";
        styleTag.innerHTML = `
          .reduce-motion *, .reduce-motion::before, .reduce-motion::after {
            animation-delay: -1ms !important;
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            background-attachment: initial !important;
            scroll-behavior: auto !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `;
        document.head.appendChild(styleTag);
      }
    } else {
      el.classList.remove("reduce-motion");
      document.getElementById("reduce-motion-styles")?.remove();
    }
    localStorage.setItem("accessibility-reduce-motion", String(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    const el = document.documentElement;
    // Font Scaling
    if (fontSize === "large") {
      el.style.fontSize = "16px";
    } else if (fontSize === "xlarge") {
      el.style.fontSize = "18px";
    } else {
      el.style.fontSize = "";
    }
    localStorage.setItem("accessibility-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("accessibility-screen-reader", String(screenReader));
  }, [screenReader]);

  return (
    <>
      <Section title="Display accessibility" description="Customize visual options to improve visibility and focus.">
        <div className="space-y-4">
          <div className="space-y-1">
            <Row title="High contrast mode" description="Increase contrast across lines, badges, inputs and buttons for better readability.">
              <Switch
                checked={contrast}
                onCheckedChange={(v) => {
                  setContrast(v);
                  toast(`High contrast: ${v ? "Enabled" : "Disabled"}`);
                }}
              />
            </Row>
            <Row title="Reduce motion" description="Minimize animations, transitions, card scale-ups and layout sliding effects.">
              <Switch
                checked={reduceMotion}
                onCheckedChange={(v) => {
                  setReduceMotion(v);
                  toast(`Reduce motion: ${v ? "Enabled" : "Disabled"}`);
                }}
              />
            </Row>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Font scaling</div>
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                toast(`Font scale updated to ${e.target.value}`);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
            >
              <option value="default">Default (14px baseline)</option>
              <option value="large">Large (16px baseline)</option>
              <option value="xlarge">Extra Large (18px baseline)</option>
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">Adjust text baseline scaling universally across panels and inputs.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => toast.success("Accessibility settings saved")}>Save preferences</Button>
        </div>
      </Section>

      <Section title="Interaction & assistive technologies" description="Configure screen reader and focus behaviors.">
        <div className="space-y-1">
          <Row title="Optimize for screen readers" description="Enable explicit ARIA labelling and aria-live announcements for real-time background actions.">
            <Switch
              checked={screenReader}
              onCheckedChange={(v) => {
                setScreenReader(v);
                toast(`Screen reader optimization: ${v ? "Enabled" : "Disabled"}`);
              }}
            />
          </Row>
        </div>
      </Section>
    </>
  );
}
