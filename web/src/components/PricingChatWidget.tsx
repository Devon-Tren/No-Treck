// No Trek – Pricing Page Chatbot Widget (React/Next.js + Tailwind)
// ---------------------------------------------------------------
// What’s inside this single file:
// 1) <PricingChatWidget /> – floating FAB (bottom-right) + slide-over chat panel
// 2) Accessible keyboard controls (Esc to close), focus handling
// 3) Suggested prompts tailored for pricing
// 4) Simple client-side state + fetch to /api/pricing-bot (you implement server)
// 5) Safety banner: do not share PHI; route complex medical questions to Support
//
// Usage:
// - Drop this component anywhere on your pricing page (e.g., app/pricing/page.tsx)
// - Ensure Tailwind is set up. This uses only Tailwind classes (no external UI deps)
// - Implement the /api/pricing-bot endpoint (example provided below in comments)
// - Optional: set NEXT_PUBLIC_BOT_TITLE to change the widget title
//
// Notes:
// - Keep this bot NON-PHI: add a small disclaimer and block messages that look like PHI.
// - For HIPAA production, swap the LLM backend to Azure OpenAI/AWS Bedrock and sign BAAs.
// - Mobile: the panel becomes full-width on small screens.

import React, { useEffect, useMemo, useRef, useState } from "react";

// Types
export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

// Utility: id generator
const uid = () => Math.random().toString(36).slice(2);

// Basic PHI guard (very naive – replace with server-side validation too)
const looksLikePHI = (text: string) => {
  const redFlags = [
    /\b(\d{3}-?\d{2}-?\d{4})\b/i, // SSN-like
    /\b\d{1,2}\/[0-3]?\d\/\d{2,4}\b/i, // dates (DOB risk)
    /\b(medication|rx|prescription|diagnosis|dob|mrn|policy number)\b/i,
    /\b(address|phone|email)\b/i,
    /\b(full\s*name|last\s*name|first\s*name)\b/i,
  ];
  return redFlags.some((r) => r.test(text));
};

// Suggested prompts (pricing-specific)
const SUGGESTED: string[] = [
  "What do I get in the Free vs Plus plan?",
  "How many AI call credits are included per tier?",
  "Is there a student or hardship discount?",
  "Can I add family members later and keep my rate?",
  "Which features are HIPAA-ready today?",
];

export default function PricingChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi! I can help explain No Trek plans, AI call credits, and upgrades. Please don’t share personal or medical details here.",
      createdAt: Date.now(),
    },
  ]);

  // Hide suggested prompts after the first user message
  const [showSuggestions, setShowSuggestions] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pricing-bot-messages");
        if (raw) {
          const arr = JSON.parse(raw);
          return !arr.some((m: any) => m.role === "user");
        }
      } catch {}
    }
    return true; // show suggestions until the user asks something
  });


  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const title = useMemo(() => {
    if (typeof window === "undefined") return "Pricing Assistant";
    return process.env.NEXT_PUBLIC_BOT_TITLE || "Pricing Assistant";
  }, []);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;

    // client-side PHI guard
    if (looksLikePHI(content)) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            "For your privacy, please avoid sharing personal/medical info here. If you need help with protected details, contact support or use our HIPAA channel.",
          createdAt: Date.now(),
        },
      ]);
      setInput("");
      return;
    }

    const userMsg: ChatMessage = { id: uid(), role: "user", content, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);
    setShowSuggestions(false);

    try {
      // Call your backend LLM endpoint (see example below)
      const res = await fetch("/api/pricing-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].slice(-15) }),
      });

      if (!res.ok) throw new Error("Bot error");
      const data = await res.json();
      const reply: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: data.reply || "Sorry, I didn’t catch that. Could you rephrase?",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: "Hmm, I’m having trouble responding right now.", createdAt: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        aria-label="Open pricing assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full cursor-pointer shadow-lg border border-white/20 bg-white text-blue-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-14 h-14 flex items-center justify-center"
      >
        {/* Chat icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M7 8h10M7 12h6m-9 9v-4H5a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H8l-4 4Z" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label="Pricing Assistant"
        className={`fixed z-50 bottom-0 right-0 w-full sm:w-[28rem] max-h-[85vh] transform transition-transform ${
          open ? "translate-y-0" : "translate-y-[120%]"
        }`}
      >
        <div className="m-4 rounded-2xl shadow-2xl border border-white/20 bg-white/95 backdrop-blur">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">NT</span>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-500">Questions about plans & features</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-2 rounded-lg hover:bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Safety banner */}
          <div className="px-4 py-2 text-[11px] text-gray-600 bg-yellow-50 border-b border-yellow-100">
            Please don’t share personal or medical details here. For protected info, we’ll route you to a secure channel.
          </div>

          {/* Messages */}
          <div className="px-4 py-3 overflow-y-auto max-h-[50vh]">
            {messages.map((m) => (
              <div key={m.id} className="mb-3">
                <div className={`text-xs mb-1 ${m.role === "assistant" ? "text-blue-600" : "text-gray-500"}`}>
                  {m.role === "assistant" ? "Assistant" : "You"}
                </div>
                <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "assistant" ? "bg-blue-50 text-gray-900" : "bg-gray-100 text-gray-900"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Suggested prompts */}
            {showSuggestions && (
                <div className="px-4 pb-2 flex flex-wrap gap-2 text-black">
                    {SUGGESTED.map((q) => (
                    <button key={q} onClick={() => send(q)} className="text-[11px] px-2 py-1 rounded-full border border-blue-600 hover:bg-gray-100">
                        {q}
                    </button>
                    ))}
                </div>
            )}


          {/* Composer */}
          <div className="p-3 border-t border-gray-200 text-black">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) send();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about plans, pricing, AI calls…"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl px-3 py-2 text-sm font-medium bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

/*
// ---------------------------------------------------------------
// Example Next.js (App Router) endpoint: /app/api/pricing-bot/route.ts
// - NON-PHI only. For HIPAA, move to Azure OpenAI or Bedrock and sign BAAs.
// - You can swap OpenAI with your own rules-based responder for pricing FAQs.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Very simple heuristic responder – replace with your LLM call
    // Option A: OpenAI (non-PHI), Option B: Azure OpenAI (HIPAA path)
    const last = messages[messages.length - 1]?.content?.toLowerCase() || "";

    let reply = "Here’s our quick take on plans. Free: basic tools and 1 trial AI call. Plus: more AI call credits, insurance finder with filters. Pro: priority queue, expanded credits, team features. Family: shared credits + profiles.";
    if (last.includes("family")) {
      reply = "Family plan includes shared AI call credits, multiple dependent profiles, and priority support. You can upgrade from Plus anytime and keep your history.";
    } else if (last.includes("discount")) {
      reply = "We offer student/hardship discounts. Contact support from inside the app to apply your documentation—no PHI needed.";
    } else if (last.includes("hipaa") || last.includes("phi")) {
      reply = "We keep this chat PHI-free. For protected details, we route you to a HIPAA-ready channel. Our AI-call pipeline uses HIPAA-eligible vendors in production.";
    }

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: "Sorry, something went wrong." }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// Styling tips:
// - Cursor pointer hover for buttons is built-in via :hover; Tailwind example: 'hover:bg-gray-100'.
// - If you want the pointer cursor explicitly, add 'cursor-pointer' on hoverable elements.
//
// Security tips:
// - Do client-side PHI checks (like above) but enforce them on the server too.
// - Add rate limiting (e.g., IP + user) for /api/pricing-bot.
// - Log only non-PII metadata (timestamps, counts). Keep content ephemeral if possible.
//
// Deployment:
// - The widget is self-contained; no external SDKs required. Good for performance.
// - For a managed vendor (Intercom/Crisp/Zendesk), ensure you’re not collecting PHI through their web widgets unless they’ll sign a BAA.
*/
