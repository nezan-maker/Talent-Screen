"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { BrandMark } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
}

function uid() {
  return Math.random().toString(16).slice(2);
}

function cannedAnswer(input: string) {
  const q = input.toLowerCase();
  if (q.includes("shortlist") || q.includes("results")) {
    return "You can filter by score bucket (Qualified/Maybe) and export/email the shortlist from the results screen. Want me to highlight the top 10 by AI Score and skills match?";
  }
  if (q.includes("job") && (q.includes("create") || q.includes("new"))) {
    return "To create a job, go to Jobs → Create New Job. The form is 4 steps (Basic Info → Description → AI Criteria → Review & Launch). Tell me the role + must-have skills and I’ll draft the criteria text.";
  }
  if (q.includes("screening") || q.includes("analyzing")) {
    return "Screening runs in 4 phases: Parsing Profiles → Scoring Candidates → Ranking Results → Generating Explanations. The progress screen auto-redirects to results after a short simulated run.";
  }
  if (q.includes("candidate") || q.includes("profile")) {
    return "Open any candidate to see AI score breakdown, strengths, and gaps. You can Shortlist, Reject, or Save for later from the header actions.";
  }
  return "I can help draft job criteria, explain AI scores, and suggest next actions. Ask me something like: “Why is Aline a top candidate?” or “Draft screening questions for a Senior Full Stack Engineer.”";
}

export function ChatBotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "assistant",
      text: "Hi! I'm WiseRank Assistant. I can help you create jobs, tune AI criteria, and interpret shortlist results.",
      ts: Date.now(),
    },
  ]);

  const canSend = input.trim().length > 0;
  const hideWidget =
    pathname?.startsWith("/dashboard/screening") ||
    pathname?.startsWith("/screening/") ||
    pathname === "/dashboard/jobs/new" ||
    pathname === "/jobs/new";
  const floatingOffset = pathname?.startsWith("/dashboard") ? "bottom-20 md:bottom-5" : "bottom-5";

  const sorted = useMemo(() => [...messages].sort((a, b) => a.ts - b.ts), [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMsg: ChatMessage = { id: uid(), role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);

    window.setTimeout(() => {
      const reply: ChatMessage = { id: uid(), role: "assistant", text: cannedAnswer(text), ts: Date.now() };
      setMessages((m) => [...m, reply]);
    }, 450);
  }

  if (hideWidget) {
    return null;
  }

  return (
    <>
      <button
        className={cn(
          "fixed right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-modal hover:bg-accent-hover",
          floatingOffset,
        )}
        onClick={() => setOpen(true)}
        aria-label="Open chatbot"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute inset-0 bg-primary/25 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            />

            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-card shadow-modal"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <BrandMark className="h-9 w-9" />
                  <div>
                    <div className="text-sm font-semibold">WiseRank Assistant</div>
                    <div className="text-xs text-text-muted">Assistant for recruiter workflows</div>
                  </div>
                </div>
                <button
                  className="rounded-input p-2 text-text-muted hover:bg-bg hover:text-text-primary"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[55vh] space-y-3 overflow-auto p-4">
                {sorted.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-card border px-3 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "border-accent/20 bg-accent text-white"
                          : "border-border bg-bg text-text-primary",
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-border p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  className="h-10 flex-1 rounded-input border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Ask about jobs, screening, scores…"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!canSend) {
                      toast.error("Type a message first.");
                      return;
                    }
                    send();
                  }}
                  className="h-10 px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
