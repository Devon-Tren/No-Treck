"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Pause,
  Play,
  ChevronRight,
  Search,
  History,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

// Shared card blue from homepage
const CARD_BLUE = "#0E5BD8";

// ---- Brand header (banner with blue NT at top-left)
function LogoNT() {
  return (
    <div className="h-8 w-8 rounded-full bg-white grid place-items-center shadow-sm">
      <span className="text-[#0E5BD8] font-extrabold text-xs tracking-tight">
        NT
      </span>
    </div>
  );
}

function HeaderNT() {
  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0E5BD8] via-[#0A53C5] to-[#083F98] text-white/95 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <LogoNT />
        <div className="font-semibold">No Trek</div>
        <div className="ml-auto text-xs opacity-80">Stella</div>
      </div>
    </header>
  );
}

// ---- Types
export type CallScript = {
  id: string

  // already existing fields...
  scriptId?: string
  clinicName?: string
  clinicPhone?: string
  scriptText?: string

  // fields inferred from your errors
  contactName?: string
  targetPhone?: string
  body?: string
  reason?: string
  language?: string

  status?: 'draft' | 'approved' | 'called'
  createdAt?: string
  updatedAt?: string
}

export type CallLog = {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: "completed" | "failed" | "canceled" | "in-progress" | "queued";
  target: string;
  summary?: string;
  outcome?: string;
  transcriptAvailable?: boolean;
};

export type SummaryCard = {
  id: string;
  header: string; // e.g., "John Hopkins Hospital 11/10/2025 — Outgoing at 2:28:09 PM CST"
  body: string; // the summary text
};


// ---- Simulated telephony adapter (for UI dev only)
function useMockTelephony() {
  const [status, setStatus] = useState<
    | "idle"
    | "preparing"
    | "dialing"
    | "ringing"
    | "connected"
    | "paused"
    | "ended"
    | "failed"
  >("idle");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === "connected") {
      timerRef.current = window.setInterval(
        () => setElapsed((e) => e + 1),
        1000
      );
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [status]);

  const start = async () => {
    setStatus("preparing");
    await sleep(400);
    setStatus("dialing");
    await sleep(500);
    setStatus("ringing");
    await sleep(1000 + Math.random() * 1200);
    if (Math.random() < 0.1) {
      setStatus("failed");
      return;
    }
    setStatus("connected");
  };

  const hangup = () => setStatus("ended");
  const pause = () => setStatus((s) => (s === "connected" ? "paused" : s));
  const resume = () => setStatus((s) => (s === "paused" ? "connected" : s));

  return { status, elapsed, start, hangup, pause, resume };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function secondsToClock(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

// ---- Main Component
export default function AICallPage({
  initialScript,
  autostart = false,
}: {
  initialScript?: CallScript;
  autostart?: boolean;
}) {
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [logs, setLogs] = useState<CallLog[]>(() => mockLogs());

  
  const searchParams = useSearchParams()
  const scriptIdFromQuery = searchParams.get('scriptId')

  const [draftInput, setDraftInput] = useState('')
  const [draftMessages, setDraftMessages] = useState<
    { id: string; role: 'user' | 'assistant'; text: string }[]
  >([])

  const [summaries, setSummaries] = useState<SummaryCard[]>(() =>
    mockSummaries()
  );
  const [expandedSummary, setExpandedSummary] =
    useState<SummaryCard | null>(null);
  const [waitingForDraft, setWaitingForDraft] = useState(false);
  const [script, setScript] = useState<CallScript | null>(
    initialScript || null
  );
  const [editMode, setEditMode] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [chatInput, setChatInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<
    Array<{ role: "system" | "user" | "assistant"; content: string }>
  >([
    {
      role: "system",
      content:
        "Who should we call and what’s the goal? (e.g., schedule visit, verify insurance)",
    },
  ]);

  const tel = useMockTelephony();

  const isActiveCall =
    tel.status === "preparing" ||
    tel.status === "dialing" ||
    tel.status === "ringing" ||
    tel.status === "connected" ||
    tel.status === "paused";

  // Safety countdown before autostart to prevent accidental misdials
  useEffect(() => {
    if (!autostart || !script) return;
    if (tel.status !== "idle") return;
    let t: number | null = null;
    let i: number | null = null;
    setCountdown(3);
    t = window.setTimeout(() => {
      tel.start();
    }, 3000);
    i = window.setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1000
    );
    return () => {
      if (t) window.clearTimeout(t);
      if (i) window.clearInterval(i);
    };
  }, [autostart, script, tel.status]);

  const statusBadge = useMemo(() => {
    switch (tel.status) {
      case "idle":
        return <Badge variant="secondary">Idle</Badge>;
      case "preparing":
        return (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Preparing
          </Badge>
        );
      case "dialing":
        return <Badge variant="outline">Dialing…</Badge>;
      case "ringing":
        return <Badge variant="outline">Ringing…</Badge>;
      case "connected":
        return (
          <Badge className="gap-1">
            <PhoneCall className="h-3 w-3" />
            In Call
          </Badge>
        );
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "ended":
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Ended
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  }, [tel.status]);

  async function sendDraftChat() {
    const text = draftInput.trim()
    if (!text) return

    // Show user message
    setDraftMessages(prev => [
      ...prev,
      { id: uid('m'), role: 'user', text },
    ])
    setDraftInput('')

    try {
      const res = await fetch('/api/no-trek/caller-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        console.error('caller-chat error', await res.text())
        setDraftMessages(prev => [
          ...prev,
          {
            id: uid('m'),
            role: 'assistant',
            text:
              'Something went wrong reaching the call helper. Please try again in a moment.',
          },
        ])
        return
      }

      const data = await res.json() as { text: string }

      setDraftMessages(prev => [
        ...prev,
        { id: uid('m'), role: 'assistant', text: data.text },
      ])
    } catch (err) {
      console.error(err)
      setDraftMessages(prev => [
        ...prev,
        {
          id: uid('m'),
          role: 'assistant',
          text:
            'I had trouble connecting just now. Please try again in a minute.',
        },
      ])
    }
  }

  // Primary button behavior
  const onPrimaryPress = async () => {
    if (!script || !scriptIdFromQuery) {
      setWaitingForDraft(true)
      const el = document.getElementById('nt-draft-input')
      el?.focus()
      return
    }

    if (isStarting) return

    // Use Twilio backend instead of mock
    if (tel.status === 'idle' || tel.status === 'failed' || tel.status === 'ended') {
      setIsStarting(true)
      try {
        const res = await fetch('/api/start-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptId: scriptIdFromQuery }),
        })

        if (!res.ok) {
          // surface a failure in UI
          console.error('Failed to start call', await res.text())
          // optional: tel.setFailed()
          return
        }

        const { callSid } = await res.json()
        // optional: track callSid in state and let tel mock represent the UI state
        tel.start()
      } finally {
        setIsStarting(false)
      }
    } else {
      tel.hangup()
    }
  }


  const primaryIcon = useMemo(() => {
    if (!script && waitingForDraft) return PhoneOff; // red armed state icon
    if (!isActiveCall) return Phone;
    return PhoneOff;
  }, [isActiveCall, script, waitingForDraft]);

  const primaryLabel = useMemo(() => {
    if (!script && waitingForDraft) return "Add details to start";
    if (!script) return "Draft call first";

    if (!isActiveCall) {
      if (tel.status === "failed") return "Retry";
      if (tel.status === "ended") return "Call Again";
      return "Start Call";
    }

    // any active state
    return "End Call";
  }, [isActiveCall, tel.status, waitingForDraft, script]);

  useEffect(() => {
    if (tel.status !== 'ended' || !scriptIdFromQuery) return

    ;(async () => {
      const res = await fetch(`/api/call-summary?scriptId=${scriptIdFromQuery}`)
      const { summaries: newSummaries } = await res.json()
      if (newSummaries?.length) {
        setSummaries(prev => [
          ...prev,
          ...newSummaries.map((s: any) => ({
            id: uid('sum'),
            header: s.header,
            body: s.summary,
            followups: s.followups,
          })),
        ])
      }
    })()
  }, [tel.status, scriptIdFromQuery])


  // Add a new mock log when call ends or fails
  useEffect(() => {
    if (tel.status !== "ended" && tel.status !== "failed") return;
    const id = Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    const entry: CallLog = {
      id,
      startedAt: now,
      endedAt: now,
      status: tel.status === "ended" ? "completed" : "failed",
      target: script?.contactName || script?.targetPhone || "Unknown",
      summary:
        tel.status === "ended"
          ? "Call ended. Outcome captured in notes."
          : "Call attempt failed.",
      outcome: undefined,
      transcriptAvailable: tel.status === "ended",
    };
    setLogs((prev) => [entry, ...prev]);
    setSelectedLog(entry);
  }, [tel.status, script]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E5BD8] via-[#0A53C5] to-[#083F98] text-slate-900">
      <HeaderNT />

      {/* Custom 24-col grid to match 1/4 : 5/12 : 1/3 */}
      <div className="mx-auto max-w-[1400px] px-6 py-6 grid [grid-template-columns:repeat(24,minmax(0,1fr))] gap-5">
        {/* Left (1/4 = 6/24) */}
        <aside className="col-span-24 md:col-span-7 flex flex-col text-white">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Call Logs</h2>
            <div className="ml-auto" />
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-white/30 text-white"
              title="New manual log"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 opacity-80 text-white" />
            <Input
              placeholder="Search calls…"
              className="pl-8 bg-[#0E5BD8] border-white/30 text-white placeholder:text-white/80"
            />
          </div>
          <div className="flex-1 overflow-auto space-y-2 pr-1">
            {logs.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLog(l)}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border transition hover:shadow-md bg-[#0E5BD8] text-white",
                  selectedLog?.id === l.id
                    ? "border-white bg-[#1A6EF0]"
                    : "border-white/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      l.status === "completed"
                        ? "secondary"
                        : l.status === "failed"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {l.status}
                  </Badge>
                  <span className="text-sm opacity-80">
                    {new Date(l.startedAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 font-medium truncate">{l.target}</div>
                {l.summary && (
                  <div className="text-sm opacity-90 line-clamp-2 mt-1">
                    {l.summary}
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Middle (≈ 10/24) */}
        <main className="col-span-24 md:col-span-9 flex flex-col gap-4">
          <Card
            className="flex-1 flex flex-col bg-[#0E5BD8] text-white backdrop-blur-sm border-white/30 shadow-xl"
            style={{ backgroundColor: CARD_BLUE }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">AI Call</CardTitle>
                <div className="flex items-center gap-2">
                  {statusBadge}
                  <div className="text-sm tabular-nums opacity-80">
                    {tel.status === "connected"
                      ? secondsToClock(tel.elapsed)
                      : null}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 grid md:grid-cols-1 gap-6">
              {/* Left: Big button and controls */}
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <Button
                  onClick={onPrimaryPress}
                  size="lg"
                  className={cn(
                    "h-80 w-80 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all border border-white/40",
                    (!script && waitingForDraft) || isActiveCall
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gradient-to-b from-[#0E5BD8] to-[#083F98] hover:from-[#0f63ec] hover:to-[#0a49b2]"
                  )}
                >
                  {(() => {
                    const Icon = primaryIcon;
                    return (
                      <div className="h-64 w-64 flex items-center justify-center">
                        <Icon className="h-full w-full text-white" />
                      </div>
                    );
                  })()}
                </Button>
                <div className="text-lg text-white opacity-90">
                  {primaryLabel}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {tel.status === "connected" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={tel.pause}
                      className="gap-1 bg-white/10 border-white/40 text-white"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  ) : tel.status === "paused" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={tel.resume}
                      className="gap-1 bg-white/10 border-white/40 text-white"
                    >
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                  ) : null}
                  {(tel.status === "ended" || tel.status === "failed") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={tel.start}
                      className="gap-1 bg-white/10 border-white/40 text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry
                    </Button>
                  )}
                </div>
                {autostart && script && tel.status === "idle" && (
                  <div className="text-xs opacity-80 mt-2">
                    Dialing in {countdown}…{" "}
                    <button
                      className="underline"
                      onClick={() => window.location.reload()}
                    >
                      cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Chatbox (no script) OR Script (script mode) */}
              <div className="min-h-[320px]">
                {!script ? (
                  <div className="flex h-full flex-col">
                    <div className="font-medium mb-2 text-white">
                      Draft Assistant
                    </div>
                    <div className="flex-1 space-y-2 overflow-auto rounded-xl border bg-white p-3">
                      {chatMsgs.map((m, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex",
                            m.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "px-3 py-2 rounded-2xl text-sm text-black max-w-[80%]",
                              m.role === "user"
                                ? "bg-blue-600 text-black"
                                : m.role === "assistant"
                                ? "bg-slate-100"
                                : "bg-white border"
                            )}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center text-black gap-2">
                      <Input
                        id="nt-draft-input"
                        placeholder="e.g., Lakeside Clinic — schedule new patient for ankle sprain"
                        value={chatInput}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>
                        ) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendDraftChat();
                        }}
                        className="bg-white/90"
                      />
                      <Button onClick={sendDraftChat}>Send</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between">
                      <div className="font-medium mb-2 text-white">
                        Call Script
                      </div>
                    </div>
                    {editMode ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={script.contactName || ""}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setScript({
                                ...script,
                                contactName: e.target.value,
                              })
                            }
                            placeholder="Clinic / Department"
                          />
                          <Input
                            value={script.targetPhone || ""}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setScript({
                                ...script,
                                targetPhone: e.target.value,
                              })
                            }
                            placeholder="Phone number"
                          />
                        </div>
                        <Textarea
                          value={script.body}
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>
                          ) =>
                            setScript({ ...script, body: e.target.value })
                          }
                          rows={10}
                        />
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none text-white">
                        <p className="font-medium">
                          To: {script.contactName || script.targetPhone}
                        </p>
                        <pre className="whitespace-pre-wrap rounded-md bg-white/90 text-slate-900 p-3 border border-white/40">
                          {script.body}
                        </pre>
                        <div className="mt-2 flex items-center text-sm opacity-90 gap-2">
                          <span>Reason:</span>
                          <span className="font-medium">
                            {script.reason}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                          <span>Language:</span>
                          <span className="font-medium">
                            {script.language || "en-US"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Right (1/3 = 8/24) */}
        <aside className="col-span-24 md:col-span-8 flex flex-col text-white">
          {/* Summary cards list */}
          <div className="space-y-3">
            {summaries.map((s) => (
              <button
                key={s.id}
                onClick={() => setExpandedSummary(s)}
                className="w-full text-left rounded-2xl border border-white/30 bg-[#0E5BD8] p-4 shadow hover:shadow-lg transition text-white"
              >
                <div className="font-semibold mb-1">{s.header}</div>
                <p className="text-sm text-white/90 line-clamp-3">
                  {s.body}
                </p>
              </button>
            ))}
          </div>

          {/* Full-page expand overlay (no dialog dep) */}
          {expandedSummary && (
            <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm grid place-items-center p-4">
              <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">
                    {expandedSummary.header}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedSummary(null)}
                    className="text-black"
                  >
                    Close
                  </Button>
                </div>
                <div className="text-slate-800 whitespace-pre-wrap">
                  {expandedSummary.body}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---- Mock data for logs
function mockLogs(): CallLog[] {
  const now = Date.now();
  return [
    {
      id: "c1",
      startedAt: new Date(now - 1000 * 60 * 32).toISOString(),
      endedAt: new Date(now - 1000 * 60 * 30).toISOString(),
      status: "completed",
      target: "Lakeside Clinic – Cardiology",
      summary: "Confirmed referral on file; scheduler will call back.",
      outcome: "Ticket #84219",
      transcriptAvailable: true,
    },
    {
      id: "c2",
      startedAt: new Date(now - 1000 * 60 * 120).toISOString(),
      endedAt: new Date(now - 1000 * 60 * 115).toISOString(),
      status: "failed",
      target: "+1 (310) 555-7844",
      summary: "No answer; after-hours IVR.",
      transcriptAvailable: false,
    },
    {
      id: "c3",
      startedAt: new Date(now - 1000 * 60 * 32).toISOString(),
      endedAt: new Date(now - 1000 * 60 * 30).toISOString(),
      status: "completed",
      target: "Lakeside Clinic – Cardiology",
      summary: "Confirmed referral on file; scheduler will call back.",
      outcome: "Ticket #84219",
      transcriptAvailable: true,
    },
  ];
}

function mockSummaries(): SummaryCard[] {
  return [
    {
      id: "s1",
      header: "John Hopkins Hospital 11/10/2025 — Outgoing at 2:28:09 PM CST",
      body:
        "You need to pick up and start taking meds from pharmacy, and the doctor recommended keeping a close eye on the bruise on your left leg. Your insurance (Progressive) will pay for 80% ($500) of the cost of the surgery you will need.",
    },
    {
      id: "s2",
      header: "Lakeside Clinic 11/09/2025 — Incoming at 4:12:44 PM CST",
      body:
        "Scheduler confirmed referral received; awaiting imaging results. Follow-up set for Friday. Co-pay estimate $25 with BlueCross PPO.",
    },
  ];
}
