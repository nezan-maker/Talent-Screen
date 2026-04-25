"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";

export default function MessagesPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <PageHeader title="Messages" subtitle="Chat and assistant shortcuts for recruiter workflows." backHref={ROUTES.dashboard} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Talvo AI" subtitle="Open the full-screen assistant overlay." />
          <CardBody className="space-y-4">
            <div className="rounded-card border border-border bg-bg p-4 text-sm text-text-muted leading-relaxed">
              Use Talvo AI to draft screening questions, summarize pipelines, and explain AI scores.
            </div>
            <Link href={`${ROUTES.dashboard}/ask-ruvo`} className="inline-flex">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Open Talvo AI
              </Button>
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Workspace chat" subtitle="Placeholder for team messages." />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3 rounded-card border border-border bg-bg p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="text-sm text-text-muted">
                Team chat is not connected yet. Use the assistant widget (bottom-right) for now.
              </div>
            </div>
            <Link href={ROUTES.dashboard} className="inline-flex">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}

