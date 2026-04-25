"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { BrandMark } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { askAssistantQuestion, getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export function ChatBotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "assistant",
      text: "Hi! I'm Talvo AI. Ask about jobs, candidates, screening results, or pipeline health and I'll use the current backend workspace as context.",
      ts: Date.now(),
    },
  ]);

  const canSend = input.trim().length > 0 && !isThinking;
  const hideWidget =
    pathname?.startsWith("/dashboard/screening") ||
    pathname?.startsWith("/screening/") ||
    pathname === "/dashboard/jobs/new" ||
    pathname === "/jobs/new";
  const floatingOffset = pathname?.startsWith("/dashboard") ? "bottom-20 md:bottom-5" : "bottom-5";
  const sorted = useMemo(() => [...messages].sort((a, b) => a.ts - b.ts), [messages]);

  async function send() {
    const text = input.trim();
    if (!text || isThinking) {
      return;
    }

    setInput("");
    setIsThinking(true);

    const userMsg: ChatMessage = { id: uid(), role: "user", text, ts: Date.now() };
    setMessages((current) => [...current, userMsg]);

    try {
      const reply = await askAssistantQuestion({ question: text });
      setMessages((current) => [
        ...current,
        {
          id: uid(),
          role: "assistant",
          text: reply.answer,
          ts: Date.now(),
        },
      ]);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Talvo AI could not answer right now.")
      );
    } finally {
      setIsThinking(false);
    }
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
                    <div className="text-sm font-semibold">Talvo AI</div>
                    <div className="text-xs text-text-muted">Recruiter copilot powered by your backend workspace</div>
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
                {sorted.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-card border px-3 py-2 text-sm leading-relaxed",
                        message.role === "user"
                          ? "border-accent/20 bg-accent text-white"
                          : "border-border bg-bg text-text-primary",
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}

                {isThinking ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-card border border-border bg-bg px-3 py-2 text-sm text-text-muted">
                      Talvo AI is thinking...
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 border-t border-border p-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void send();
                    }
                  }}
                  className="h-10 flex-1 rounded-input border border-border bg-surface px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:ring-2 focus:ring-accent/30"
                  placeholder="Ask about jobs, screening, scores..."
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!canSend) {
                      toast.error("Type a message first.");
                      return;
                    }

                    void send();
                  }}
                  className="h-10 px-3"
                  disabled={isThinking}
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
