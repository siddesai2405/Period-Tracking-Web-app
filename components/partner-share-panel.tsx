"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  HeartHandshake,
  Link2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import type { PartnerShare } from "@/lib/partnerShare";
import { partnerShareUrl } from "@/lib/partnerShare";

export function PartnerSharePanel() {
  const push = useToast((state) => state.push);
  const [partnerShare, setPartnerShare] = useState<PartnerShare | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerLoading, setPartnerLoading] = useState(true);
  const [partnerSaving, setPartnerSaving] = useState(false);
  const [partnerError, setPartnerError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPartnerShare() {
      setPartnerLoading(true);
      setPartnerError("");

      try {
        const response = await fetch("/api/partner-share", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load partner share.");
        if (active) {
          const share = (data.share ?? null) as PartnerShare | null;
          setPartnerShare(share);
          setPartnerName(share?.partnerName ?? "");
          setPartnerEmail(share?.partnerEmail ?? "");
        }
      } catch (err) {
        if (active) {
          setPartnerShare(null);
          setPartnerError(err instanceof Error ? err.message : "Could not load partner share.");
        }
      } finally {
        if (active) setPartnerLoading(false);
      }
    }

    loadPartnerShare();
    return () => {
      active = false;
    };
  }, []);

  const activePartnerShare = partnerShare?.isActive ? partnerShare : null;
  const activePartnerUrl = activePartnerShare ? partnerShareUrl(activePartnerShare.token) : "";

  const savePartnerDetails = async () => {
    if (!activePartnerShare) return;
    setPartnerSaving(true);
    try {
      const response = await fetch("/api/partner-share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerName, partnerEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update partner details.");
      setPartnerShare(data.share as PartnerShare);
      push({ title: "Partner details saved", description: "The share link is unchanged.", tone: "success" });
    } catch (err) {
      push({
        title: "Partner share was not updated",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setPartnerSaving(false);
    }
  };

  const createPartnerLink = async () => {
    setPartnerSaving(true);
    try {
      const response = await fetch("/api/partner-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerName, partnerEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create partner link.");
      setPartnerShare(data.share as PartnerShare);
      push({
        title: activePartnerShare ? "New partner link ready" : "Partner link ready",
        description: activePartnerShare ? "The old link no longer works." : "You can copy it now.",
        tone: "success",
      });
    } catch (err) {
      push({
        title: "Partner link was not created",
        description: err instanceof Error ? err.message : "Please run the latest database migration and try again.",
        tone: "error",
      });
    } finally {
      setPartnerSaving(false);
    }
  };

  const copyPartnerLink = async () => {
    if (!activePartnerUrl) return;
    try {
      await navigator.clipboard.writeText(activePartnerUrl);
      push({ title: "Partner link copied", description: "Share it with the partner you trust.", tone: "success" });
    } catch {
      push({ title: "Could not copy link", description: "Select the link field and copy it manually.", tone: "error" });
    }
  };

  const revokePartnerLink = async () => {
    if (!activePartnerShare) return;
    const confirmed = window.confirm("Turn off partner share? The current link will stop working.");
    if (!confirmed) return;

    setPartnerSaving(true);
    try {
      const response = await fetch("/api/partner-share", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not turn off partner share.");
      setPartnerShare(data.share as PartnerShare | null);
      push({ title: "Partner share off", description: "The shared link has been disabled.", tone: "success" });
    } catch (err) {
      push({
        title: "Partner share is still on",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setPartnerSaving(false);
    }
  };

  return (
    <section id="partner-share" className="section-panel p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
              <HeartHandshake size={19} />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-[rgb(var(--fg))]">Partner Share</h2>
              <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                Share a private, read-only health dashboard with your trusted partner.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Partner name</Label>
                <Input value={partnerName} onChange={(event) => setPartnerName(event.target.value)} placeholder="Partner name" />
              </div>
              <div>
                <Label>Partner email</Label>
                <Input type="email" value={partnerEmail} onChange={(event) => setPartnerEmail(event.target.value)} placeholder="partner@example.com" />
              </div>
            </div>

            {activePartnerShare ? (
              <div>
                <Label>Share link</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input readOnly value={activePartnerUrl} className="font-mono text-xs" />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={copyPartnerLink} disabled={partnerSaving}>
                      <Copy size={15} />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="soft"
                      disabled={partnerSaving}
                      onClick={() => window.open(activePartnerUrl, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink size={15} />
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.46)] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--acc-50))] text-[rgb(var(--acc-700))] dark:bg-white/[0.07] dark:text-[rgb(var(--acc-200))]">
                    <Link2 size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[rgb(var(--fg))]">
                      {partnerLoading ? "Checking partner share..." : "Partner share is off"}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-[rgb(var(--muted))]">
                      {partnerError || "Generate a link when you are ready to share."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {activePartnerShare ? (
                <>
                  <Button type="button" onClick={savePartnerDetails} disabled={partnerSaving}>
                    <Check size={16} />
                    {partnerSaving ? "Saving..." : "Save partner"}
                  </Button>
                  <Button type="button" variant="outline" onClick={createPartnerLink} disabled={partnerSaving}>
                    <RefreshCw size={15} />
                    Refresh link
                  </Button>
                  <Button type="button" variant="destructive" onClick={revokePartnerLink} disabled={partnerSaving}>
                    Turn off
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={createPartnerLink} disabled={partnerLoading || partnerSaving}>
                  <Link2 size={16} />
                  {partnerSaving ? "Creating..." : "Create partner link"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.54)] p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Included</p>
              <p className="mt-0.5 text-sm font-bold text-[rgb(var(--fg))]">Read-only access</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <IncludedRow label="Overall health dashboard" />
            <IncludedRow label="Cycle predictions and phase" />
            <IncludedRow label="Daily logs, symptoms, mood, sleep, and water" />
            <IncludedRow label="Lifestyle, diet, and PCOS summaries" />
          </div>
        </div>
      </div>
    </section>
  );
}

function IncludedRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[rgb(var(--card)/0.58)] px-3 py-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
        <Check size={14} />
      </span>
      <span className="text-sm font-bold text-[rgb(var(--fg))]">{label}</span>
    </div>
  );
}
