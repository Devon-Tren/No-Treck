'use client';
import React, { useMemo, useState } from "react";
import PricingChatWidget from "@/components/PricingChatWidget";

export type Tier = {
  id: string;
  name: string;
  tagline?: string;
  priceMonthly: number; // 0 for Free
  priceYearly?: number; // optional; defaults to priceMonthly * 10 (2 months free)
  ctaLabel?: string;
  ctaHref?: string;
  popular?: boolean; // visually highlight as primary
  features: string[];
  footnote?: string;
};

export type BillingCycle = "monthly" | "yearly";

export type PricingCardProps = {
  tier: Tier;
  billingCycle: BillingCycle;
  onSelect?: (tierId: string, cycle: BillingCycle) => void;
};

// ------------------------------
// Reusable PricingCard
// ------------------------------
export function PricingCard({ tier, billingCycle, onSelect }: PricingCardProps) {
  const price = useMemo(() => {
    if (billingCycle === "monthly") return tier.priceMonthly;
    const yr = tier.priceYearly ?? tier.priceMonthly * 10; // default annual = 2 mo free
    return yr;
  }, [billingCycle, tier.priceMonthly, tier.priceYearly]);

  const displayPrice = useMemo(() => {
    if (price === 0) return "Free";
    return billingCycle === "monthly" ? `$${price}/mo` : `$${price}/yr`;
  }, [price, billingCycle]);

  return (
    <div
      className={[
        "group relative flex flex-col rounded-2xl border",
        "bg-white",
        tier.popular
          ? "border-[#0E5BD8]/60 shadow-[0_0_0_1px_rgba(14,91,216,.4),0_12px_50px_-12px_rgba(14,91,216,.35)]"
          : "border-gray-200 hover:border-gray-300",
        "transition-all duration-300"
      ].join(" ")}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#0E5BD8]/50 bg-white px-3 py-1 text-xs font-medium text-[#083F98]">
          Most popular
        </div>
      )}

      <div className="p-6 sm:p-8 flex flex-col gap-4">
        <div>
          <h3 className="text-[#083F98] text-xl font-semibold tracking-tight">
            {tier.name}
          </h3>
          {tier.tagline && (
            <p className="mt-1 text-sm text-gray-600">{tier.tagline}</p>
          )}
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-4xl font-bold text-[#083F98]">{displayPrice}</span>
          {price !== 0 && (
            <span className="text-sm text-gray-600">
              {billingCycle === "monthly" ? "billed monthly" : "billed annually"}
            </span>
          )}
        </div>

        <ul className="mt-4 flex flex-col gap-2 text-sm text-gray-700">
          {tier.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mt-0.5 h-5 w-5 flex-none text-[#0E5BD8]"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm13.36-2.56a.75.75 0 10-1.22-.88l-3.44 4.8-1.6-1.6a.75.75 0 10-1.06 1.06l2.25 2.25c.32.32.83.28 1.1-.08l4.97-6.55z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <a
            href={tier.ctaHref ?? "#"}
            onClick={(e) => {
              if (onSelect) {
                e.preventDefault();
                onSelect(tier.id, billingCycle);
              }
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-gray-100 text-[#083F98] hover:bg-gray-200 transition-colors"
          >
            {tier.ctaLabel ?? "Get started"}
          </a>
        </div>

        {tier.footnote && (
          <p className="mt-3 text-xs text-gray-500">{tier.footnote}</p>
        )}
      </div>
    </div>
  );
}

// ------------------------------
// Billing Toggle
// ------------------------------
function BillingToggle({
  value,
  onChange
}: {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 p-1 text-sm text-white">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={[
          "rounded-full px-3 py-1",
          value === "monthly" ? "bg-white text-[#083F98]" : "hover:bg-white/10"
        ].join(" ")}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={[
          "rounded-full px-3 cursor-pointer py-1",
          value === "yearly" ? "bg-white text-[#083F98]" : "hover:bg-white/10"
        ].join(" ")}
      >
        Yearly <span className="ml-1 text-xs opacity-80">(2 months free)</span>
      </button>
    </div>
  );
}

// ------------------------------
// Defaults
// ------------------------------
const DEFAULT_TIERS: Tier[] = [
  {
    id: "free",
    name: "Explorer",
    tagline: "Try No Trek with core chat capabilities.",
    priceMonthly: 0,
    ctaLabel: "Launch Free",
    popular: false,
    features: ["1 AI call credit/mo", "Unlimited triage with sources", "Extensive summaries via AI call", "Dynamic detailing of chats"],
    footnote: "Fair use limits apply to prevent abuse."
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "More messages, faster guidance, basic analytics.",
    priceMonthly: 9,
    ctaLabel: "Upgrade to Plus",
    popular: true,
    features: ["10 AI call credits/mo", "Insurance checks", "Wait time confirmation", "Holistic next steps (what to bring, paperwork, etc.)"],
    footnote: "Includes email support with <48h responses."
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Advanced features for next-level care.",
    priceMonthly: 19,
    ctaLabel: "Go Pro",
    popular: false,
    features: ["30 AI call credits/mo", "Transparent costs and coverage estimate", "Meticulous image processing", "Dynamic reviewing of clinics"],
    footnote: "*Reasonable use; heavier volumes may require Enterprise."
  },
  {
    id: "family",
    name: "Family",
    tagline: "Shared access, coordinated care, family peace of mind.",
    priceMonthly: 39,
    ctaLabel: "Upgrade to Family",
    popular: false,
    features: ["100 pooled AI call credits/mo for 6 members", "Family safety dashboard", "Shared medicine and vaccine tracker dashboard", "Shared document vault"],
    footnote: "Fair use limits apply to prevent abuse."
  }
];

// ------------------------------
// Page Shell
// ------------------------------
export default function PricingPage({
  title = "Simple Plans & Scalable Support",
  subtext = "No Trek adapts to your needs, pick the right plan for you and we'll handle the rest. Our plans are affordable and each one offers immediate help, at least one AI call, and guidance sourced from professionals.",
  tiers = DEFAULT_TIERS
}: {
  title?: string;
  subtext?: string;
  tiers?: Tier[];
}) {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <section className="relative w-full">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0E5BD8] via-[#0A53C5] to-[#083F98]" />

      {/* Header */}
      <div className="mx-auto max-w-3xl px-6 pt-16 text-center sm:pt-24">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-white/90">{subtext}</p>
        <div className="mt-6">
          <BillingToggle value={billing} onChange={setBilling} />
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 pb-20 pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <PricingCard key={t.id} tier={t} billingCycle={billing} onSelect={(id, cycle) => console.log("select", id, cycle)} />
        ))}
      </div>

      {/* Coverage & Guarantees strip (optional) */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/20 bg-white/10 p-6 text-sm text-white sm:grid-cols-3">
          <div>
            <h4 className="text-white">Transparent coverage</h4>
            <p className="mt-1 opacity-90">Region & language availability clearly listed before checkout.</p>
          </div>
          <div>
            <h4 className="text-white">Privacy & consent</h4>
            <p className="mt-1 opacity-90">You control calls, forms, and data sharing — always opt‑in.</p>
          </div>
          <div>
            <h4 className="text-white">Human‑safe handoff</h4>
            <p className="mt-1 opacity-90">Escalation to a human when uncertainty or risk is detected.</p>
          </div>
        </div>
      </div>
      <PricingChatWidget />
    </section>
  );
}
