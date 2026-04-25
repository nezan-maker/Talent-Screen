"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  HelpCircle,
  MessageSquare,
  Mic,
  Minimize2,
  MoreHorizontal,
  PieChart,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import toast from "@/lib/toast";
import {
  askAssistantQuestion,
  getAiLimitResetDetails,
  getApiErrorMessage,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ConversationMessage = {
  id: string;
  role: ChatRole;
  createdAtISO: string;
  text: string;
};

type Conversation = {
  id: string;
  title: string;
  updatedAtISO: string;
  messages: ConversationMessage[];
  followUps: string[];
};

function uid(prefix = "ruvo") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function formatConversationTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function createConversationTitle(prompt: string) {
  return prompt.trim().slice(0, 42) || "New chat";
}

export default function AskRuvoPage() {
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversationId, conversations, isThinking]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort(
      (left, right) =>
        new Date(right.updatedAtISO).getTime() - new Date(left.updatedAtISO).getTime(),
    );
  }, [conversations]);

  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
  }, [activeConversationId, conversations]);

  const quickActions = [
    {
      title: "Top Matches",
      description: "Ask Talvo AI to identify the strongest candidates in the current workspace.",
      icon: Search,
      prompt: "Who are the strongest candidates in the workspace right now?",
    },
    {
      title: "Pipeline Summary",
      description: "Get a recruiter-friendly summary of what needs attention next.",
      icon: Briefcase,
      prompt: "Summarize my current pipeline and tell me what needs attention.",
    },
    {
      title: "Hiring Insights",
      description: "Spot trends from the latest jobs, applicants, and screening runs.",
      icon: PieChart,
      prompt: "Give me the biggest hiring insights from the current workspace.",
    },
  ] as const;

  const emptyStateFollowUps = [
    "Which role looks closest to shortlist-ready?",
    "What gaps are most common across current candidates?",
    "How should I prioritize recruiter follow-up this week?",
  ];

  async function submitPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || isThinking) {
      return;
    }

    const now = new Date().toISOString();
    const conversationId = activeConversationId ?? uid("conversation");
    const userMessage: ConversationMessage = {
      id: uid("user"),
      role: "user",
      createdAtISO: now,
      text: trimmed,
    };

    setInput("");
    setIsThinking(true);
    setActiveConversationId(conversationId);
    setConversations((current) => {
      const existingConversation = current.find((conversation) => conversation.id === conversationId);

      if (!existingConversation) {
        return [
          {
            id: conversationId,
            title: createConversationTitle(trimmed),
            updatedAtISO: now,
            messages: [userMessage],
            followUps: [],
          },
          ...current,
        ];
      }

      return current.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          updatedAtISO: now,
          messages: [...conversation.messages, userMessage],
        };
      });
    });

    try {
      const reply = await askAssistantQuestion({ question: trimmed });
      const assistantMessage: ConversationMessage = {
        id: uid("assistant"),
        role: "assistant",
        createdAtISO: new Date().toISOString(),
        text: reply.answer,
      };

      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            updatedAtISO: new Date().toISOString(),
            messages: [...conversation.messages, assistantMessage],
            followUps: reply.suggestedNextQuestions,
          };
        }),
      );
    } catch (error) {
      const aiLimitReset = getAiLimitResetDetails(error);
      if (aiLimitReset) {
        toast.error({
          title: "AI Limit Reached",
          description: `The AI limit resets at ${aiLimitReset.resetAtLabel} (${aiLimitReset.remainingLabel} remaining).`,
        });
      } else {
        toast.error(
          getApiErrorMessage(error, "Talvo AI could not answer right now.")
        );
      }
    } finally {
      setIsThinking(false);
    }
  }

  function startNewChat() {
    setActiveConversationId(null);
    setInput("");
  }

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-[32px] border border-border/50 bg-gradient-to-br from-orange-50/90 via-yellow-50/70 to-white shadow-lg dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-yellow-200/55 via-amber-200/30 to-orange-200/15 blur-[110px] dark:from-orange-500/18 dark:via-amber-500/10 dark:to-transparent" />

      <div className="relative z-10 flex flex-1 flex-col gap-6 overflow-hidden px-4 py-4 lg:flex-row lg:px-8 lg:py-8">
        <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[24px] border border-border/50 bg-white/75 shadow-soft backdrop-blur-xl dark:bg-slate-900/60 lg:w-[300px]">
          <div className="p-6 pb-3">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-text-primary">Talvo AI</span>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              className="flex w-full items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text-primary shadow-sm transition-all hover:bg-bg disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-700"
              disabled={isThinking}
            >
              <Plus className="h-4 w-4 text-text-muted" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Previous Chats
            </div>
            <div className="space-y-1">
              {sortedConversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                const lastAssistant = [...conversation.messages]
                  .reverse()
                  .find((message) => message.role === "assistant");

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                      active
                        ? "bg-accent/10 text-text-primary"
                        : "text-text-muted hover:bg-bg hover:text-text-primary dark:hover:bg-white/5",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        active
                          ? "border-accent/20 bg-accent/10 text-accent"
                          : "border-border/70 bg-white/80 text-text-muted dark:bg-slate-900/70",
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-inherit">
                        {conversation.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-text-muted">
                        {lastAssistant?.text ?? "Open this chat to continue the conversation."}
                      </div>
                      <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                        {formatConversationTime(conversation.updatedAtISO)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto space-y-4 border-t border-border/50 p-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => void submitPrompt("Help me understand what Talvo AI can do in this workspace.")}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[13px] text-text-muted transition-colors hover:bg-bg hover:text-text-primary dark:hover:bg-white/5"
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span>Help</span>
              </button>
              <button
                type="button"
                onClick={() => void submitPrompt("Give me a quick recruiting summary for today.")}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[13px] text-text-muted transition-colors hover:bg-bg hover:text-text-primary dark:hover:bg-white/5"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Workspace summary</span>
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[20px] border border-orange-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 dark:border-orange-500/20 dark:from-orange-500/12 dark:to-transparent">
              <Sparkles className="absolute right-2 top-2 h-16 w-16 -rotate-12 text-orange-200/50 dark:text-orange-500/10" />
              <div className="relative z-10">
                <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Sparkles className="h-3 w-3" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">Live backend mode</h4>
                <p className="mt-1 text-[11px] leading-tight text-text-muted">
                  Talvo AI is now answering with the current jobs, candidates, and screening runs available in your backend workspace.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="absolute right-0 top-0 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void submitPrompt("Give me a quick recruiting summary for today.")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-white/80 text-text-muted shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-text-primary dark:bg-slate-800/80"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <Link
              href={ROUTES.dashboard}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-white/80 text-text-muted shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-text-primary dark:bg-slate-800/80"
            >
              <Minimize2 className="h-4 w-4" />
            </Link>
          </div>

          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 pt-20 md:p-8">
              <h1 className="mb-6 max-w-3xl text-center text-3xl font-medium leading-tight tracking-tight text-text-primary md:mb-10 md:text-[40px]">
                Ready To Find Top Candidates Or Revisit Your Pipeline?
              </h1>

              <div className="grid w-full max-w-4xl grid-cols-1 gap-4 px-2 md:grid-cols-3">
                {quickActions.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => void submitPrompt(item.prompt)}
                    className="group flex min-h-[180px] flex-col rounded-[24px] border border-border/40 bg-white/60 p-6 text-left shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/40"
                  >
                    <h3 className="mb-2 font-bold text-text-primary">{item.title}</h3>
                    <p className="pr-2 text-[13px] leading-relaxed text-text-muted">
                      {item.description}
                    </p>
                    <div className="mt-auto flex justify-end pt-5">
                      <item.icon className="h-5 w-5 text-text-muted/50 transition-colors group-hover:text-accent" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {emptyStateFollowUps.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submitPrompt(prompt)}
                    className="rounded-full border border-border/70 bg-white/70 px-4 py-2 text-sm font-semibold text-text-muted shadow-sm transition-colors hover:bg-bg hover:text-text-primary dark:bg-slate-900/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-4 pt-16 md:px-6 md:pt-20">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                <div className="rounded-[24px] border border-border/50 bg-white/60 px-5 py-4 shadow-sm backdrop-blur-md dark:bg-slate-900/45">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent/90">
                    Active Chat
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text-primary">
                    {activeConversation.title}
                  </div>
                  <div className="mt-1 text-sm text-text-muted">
                    Grounded in the current workspace jobs, candidate records, and saved screening runs.
                  </div>
                </div>

                {activeConversation.messages.map((message) => {
                  if (message.role === "user") {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-border bg-bg px-5 py-3 text-sm text-text-primary dark:border-white/10 dark:bg-slate-950/30">
                          {message.text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="flex gap-4">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-accent text-white shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="max-w-[92%] rounded-3xl rounded-tl-sm border border-border/50 bg-white/75 px-6 py-5 text-sm leading-relaxed text-text-primary shadow-sm backdrop-blur-md dark:bg-slate-900/50">
                        {message.text}
                      </div>
                    </div>
                  );
                })}

                {isThinking ? (
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-accent text-white shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="max-w-[92%] rounded-3xl rounded-tl-sm border border-border/50 bg-white/75 px-6 py-5 text-sm leading-relaxed text-text-muted shadow-sm backdrop-blur-md dark:bg-slate-900/50">
                      Talvo AI is thinking...
                    </div>
                  </div>
                ) : null}

                {activeConversation.followUps.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeConversation.followUps.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        onClick={() => void submitPrompt(followUp)}
                        className="rounded-full border border-border/70 bg-bg/80 px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div ref={scrollAnchorRef} />
              </div>
            </div>
          )}

          <div className="mt-auto w-full bg-transparent pt-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitPrompt(input);
              }}
              className="mx-auto flex w-full max-w-4xl items-center"
            >
              <div className="relative w-full">
                <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-text-muted">
                  <Plus className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    activeConversation
                      ? "Ask a follow-up about matches, screening, or pipeline insights..."
                      : "Ask me anything..."
                  }
                  className="h-[60px] w-full rounded-[20px] border border-border/50 bg-white/75 pl-14 pr-16 text-text-primary shadow-sm outline-none transition-shadow placeholder:text-text-muted focus:border-orange-200 focus:shadow-md dark:bg-slate-900/50"
                  disabled={isThinking}
                />
                <button
                  type={input.trim() ? "submit" : "button"}
                  onClick={() => {
                    if (!input.trim()) {
                      void submitPrompt("Give me a quick recruiting summary for today.");
                    }
                  }}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-orange-50 text-accent transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500/20 dark:hover:bg-orange-500/30"
                  disabled={isThinking}
                >
                  {input.trim() ? <ArrowRight className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

