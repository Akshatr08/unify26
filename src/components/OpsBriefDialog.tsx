import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateOpsBrief } from "@/lib/ai-actions.functions";

type Kind = "report" | "decision";

const TITLES: Record<Kind, { title: string; desc: string }> = {
  report: {
    title: "Matchday Situation Report",
    desc: "AI-generated snapshot grounded in live KPIs, gates, incidents, and transport.",
  },
  decision: {
    title: "AI Decision Support",
    desc: "Ranked recommendations for the operations director, right now.",
  },
};

export function OpsBriefDialog({
  open,
  kind,
  onOpenChange,
}: {
  open: boolean;
  kind: Kind;
  onOpenChange: (open: boolean) => void;
}) {
  const run = useServerFn(generateOpsBrief);
  const [loading, setLoading] = useState(false);
  const [md, setMd] = useState<string | null>(null);
  const meta = TITLES[kind];

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setMd(null);
    run({ data: { kind } })
      .then((r) => {
        if (!cancelled) setMd(r.markdown);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) {
          toast.error("AI unavailable", { description: "Check Lovable AI Gateway credits." });
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind, run, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles className="size-4 text-[color:var(--fifa-red)]" />
            {meta.title}
          </DialogTitle>
          <DialogDescription>{meta.desc}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-slate-50 p-4 text-sm">
          {loading && (
            <p className="flex items-center gap-2 text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Composing brief with Gemini…
            </p>
          )}
          {md && (
            <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0">
              <ReactMarkdown skipHtml>{md}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
