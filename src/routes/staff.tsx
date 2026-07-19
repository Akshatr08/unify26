import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useId, useState } from "react";
import { AlertTriangle, Languages, Loader2, Radio, Send } from "lucide-react";
import { toast } from "sonner";

import { CopilotPanel } from "@/components/CopilotPanel";
import { PageHeader } from "@/components/PageHeader";
import { STAFF_TASKS } from "@/data/mock";
import { classifyIncident, translateMessage } from "@/lib/ai-actions.functions";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Console — UNIFY/26" },
      {
        name: "description",
        content:
          "Volunteer & venue staff console: task dispatch, AI incident classifier, multilingual radio translator.",
      },
      { property: "og:title", content: "Staff Console — UNIFY/26" },
      {
        property: "og:description",
        content:
          "Volunteer & venue staff console with AI incident classifier and multilingual radio translator.",
      },
    ],
  }),
  component: StaffPage,
});

const PRIORITY_COLOR: Record<string, string> = {
  P0: "bg-[color:var(--fifa-red)] text-white",
  P1: "bg-[color:var(--amber-alert)] text-white",
  P2: "bg-slate-200 text-slate-700",
};

const LANGS = [
  { code: "Spanish", label: "Español" },
  { code: "French", label: "Français" },
  { code: "Portuguese", label: "Português" },
  { code: "Arabic", label: "العربية" },
  { code: "Korean", label: "한국어" },
  { code: "Japanese", label: "日本語" },
  { code: "German", label: "Deutsch" },
];

type Classification = Awaited<ReturnType<typeof classifyIncident>>;
type Translation = Awaited<ReturnType<typeof translateMessage>>;

function StaffPage() {
  const classify = useServerFn(classifyIncident);
  const translate = useServerFn(translateMessage);

  const [tasks, setTasks] = useState(STAFF_TASKS);

  const [report, setReport] = useState("");
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);

  const [tText, setTText] = useState("Please stay calm, medical assistance is arriving.");
  const [tLang, setTLang] = useState("Korean");
  const [tLoading, setTLoading] = useState(false);
  const [translation, setTranslation] = useState<Translation | null>(null);

  const reportId = useId();
  const translateId = useId();
  const langId = useId();

  async function onClassify(e: React.FormEvent) {
    e.preventDefault();
    if (!report.trim()) return;
    setClassifyLoading(true);
    setClassification(null);
    try {
      const res = await classify({ data: { report } });
      setClassification(res);
      toast.success("Incident classified", { description: `${res.category} · severity ${res.severity}/5` });
    } catch (err) {
      console.error(err);
      toast.error("Classifier failed", { description: "Ensure the Gemini API key is configured." });
    } finally {
      setClassifyLoading(false);
    }
  }

  async function onTranslate(e: React.FormEvent) {
    e.preventDefault();
    if (!tText.trim()) return;
    setTLoading(true);
    setTranslation(null);
    try {
      const res = await translate({ data: { text: tText, targetLang: tLang, context: "stadium public address" } });
      setTranslation(res);
    } catch (err) {
      console.error(err);
      toast.error("Translation failed", { description: "Ensure the Gemini API key is configured." });
    } finally {
      setTLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1440px] p-6">
      <PageHeader
        eyebrow="Staff · Zone 3"
        title="Staff Console"
        subtitle="Task dispatch, incident intake, and multilingual translation"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left column — tasks + AI tools */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Crowd alert banner */}
          <div className="rounded-2xl border border-[color:var(--fifa-red)]/30 bg-[color:var(--fifa-red)]/5 p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 shrink-0 text-[color:var(--fifa-red)] mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[color:var(--fifa-red)]">
                Zone 3 alert · Gate C surge
              </p>
              <p className="text-xs text-slate-600">
                Ops requests overflow redirection to Gate D. Report to Concourse North to receive
                dispatch.
              </p>
            </div>
          </div>

          {/* My tasks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-bold">My Tasks</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {tasks.filter((t) => t.status !== "done").length} Open
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:border-slate-200 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={t.status === "done"}
                    onChange={() =>
                      setTasks((prev) =>
                        prev.map((x) =>
                          x.id === t.id
                            ? { ...x, status: x.status === "done" ? "open" : "done" }
                            : x,
                        ),
                      )
                    }
                    className="size-4 accent-[color:var(--fifa-red)]"
                  />
                  <span
                    className={
                      "flex-1 text-sm " +
                      (t.status === "done" ? "text-slate-400 line-through" : "text-slate-800 font-medium")
                    }
                  >
                    {t.title}
                  </span>
                  <span className="text-xs text-slate-500">{t.location}</span>
                  <span
                    className={
                      "rounded-md px-2 py-0.5 text-[10px] font-bold " + PRIORITY_COLOR[t.priority]
                    }
                  >
                    {t.priority}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Incident reporter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display font-bold flex items-center gap-2">
              <AlertTriangle className="size-4 text-[color:var(--fifa-red)]" />
              Quick Incident Report
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                AI classifier
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Describe what you see. Gemini will classify severity, suggest a team, and estimate ETA.
            </p>
            <form onSubmit={onClassify} className="mt-4 space-y-3">
              <label htmlFor={reportId} className="sr-only">Incident description</label>
              <textarea
                id={reportId}
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={3}
                maxLength={2000}
                aria-describedby={`${reportId}-hint`}
                placeholder="e.g. Elderly guest lightheaded near Section 214 elevator, requesting water."
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[color:var(--pitch)] focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
              />
              <p id={`${reportId}-hint`} className="sr-only">
                Up to 2000 characters. Submit to run the Gemini classifier.
              </p>
              <button
                type="submit"
                disabled={classifyLoading || !report.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--pitch)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {classifyLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Classifying…
                  </>
                ) : (
                  <>
                    <Send className="size-4" /> Classify & Submit
                  </>
                )}
              </button>
            </form>
            {classification && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-4">
                <MetaBox label="Category" value={classification.category.toUpperCase()} />
                <MetaBox
                  label="Severity"
                  value={`${classification.severity} / 5`}
                  tone={classification.severity >= 4 ? "red" : classification.severity >= 3 ? "amber" : "muted"}
                />
                <MetaBox label="Team" value={classification.suggestedTeam} />
                <MetaBox label="ETA" value={classification.eta} />
                <div className="col-span-2 md:col-span-4 text-xs text-slate-600">
                  <span className="font-semibold">Rationale:</span> {classification.rationale}
                </div>
              </div>
            )}
          </div>

          {/* Translator */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Languages className="size-4 text-[color:var(--pitch)]" />
              Radio Translator
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                7 languages
              </span>
            </h3>
            <form onSubmit={onTranslate} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <label htmlFor={translateId} className="sr-only">Text to translate</label>
              <textarea
                id={translateId}
                value={tText}
                onChange={(e) => setTText(e.target.value)}
                rows={3}
                maxLength={2000}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[color:var(--pitch)] focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
              />
              <div className="flex flex-col gap-2">
                <label htmlFor={langId} className="sr-only">Target language</label>
                <select
                  id={langId}
                  value={tLang}
                  onChange={(e) => setTLang(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
                >
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={tLoading || !tText.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--pitch)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[color:var(--pitch)]/40"
                >
                  {tLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Radio className="size-4" aria-hidden="true" />}
                  Translate
                </button>
              </div>
            </form>
            {translation && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-900 p-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {tLang}
                </p>
                <p className="mt-1 text-lg font-medium leading-snug">{translation.translation}</p>
                {translation.romanization && (
                  <p className="mt-2 text-xs italic text-slate-400">{translation.romanization}</p>
                )}
                {translation.note && (
                  <p className="mt-2 text-xs text-slate-500">{translation.note}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column — Copilot */}
        <div className="col-span-12 lg:col-span-4">
          <CopilotPanel role="staff" />
        </div>
      </div>
    </main>
  );
}

function MetaBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "red" | "amber" | "muted";
}) {
  const color =
    tone === "red"
      ? "text-[color:var(--fifa-red)]"
      : tone === "amber"
      ? "text-[color:var(--amber-alert)]"
      : "text-slate-800";
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={"mt-1 text-sm font-semibold " + color}>{value}</p>
    </div>
  );
}

// Keep `createFileRoute` import used for typecheck compatibility even though only one is needed.
void createFileRoute;
