"use client";

import { useState } from "react";

type AnalyzeResponse = {
  followUpQuestions: string[];
  rootCauseContenders: {
    cause: string;
    rationale: string;
    confidence: string;
  }[];
  actionItems: {
    action: string;
    owner: string;
    priority: string;
    timeframe: string;
    successCriteria: string;
  }[];
};

export default function Home() {
  const [form, setForm] = useState({
    equipmentDescription: "",
    make: "",
    model: "",
    serialNumber: "",
    age: "",
    workHistory: "",
    activePMs: "",
    preFailure: "",
    failureDescription: "",
    additionalNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">RCFA AI Demo</h1>
      <p className="text-gray-600">
        Enter failure details and click Analyze to generate RCFA insights.
      </p>

      <Input label="Equipment Description *" value={form.equipmentDescription} onChange={(v) => updateField("equipmentDescription", v)} />
      <Input label="Make" value={form.make} onChange={(v) => updateField("make", v)} />
      <Input label="Model" value={form.model} onChange={(v) => updateField("model", v)} />
      <Input label="Serial Number" value={form.serialNumber} onChange={(v) => updateField("serialNumber", v)} />
      <Input label="Age" value={form.age} onChange={(v) => updateField("age", v)} />

      <Textarea label="Work History" value={form.workHistory} onChange={(v) => updateField("workHistory", v)} />
      <Textarea label="Active PMs" value={form.activePMs} onChange={(v) => updateField("activePMs", v)} />
      <Textarea label="Pre-Failure Conditions" value={form.preFailure} onChange={(v) => updateField("preFailure", v)} />
      <Textarea label="Failure Description *" value={form.failureDescription} onChange={(v) => updateField("failureDescription", v)} />
      <Textarea label="Additional Notes" value={form.additionalNotes} onChange={(v) => updateField("additionalNotes", v)} />

      <button
        onClick={analyze}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <div className="text-red-600">{error}</div>}

      {result && (
        <div className="space-y-6">
          <Section title="Follow-up Questions">
            <ul className="list-disc pl-6">
              {result.followUpQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </Section>

          <Section title="Top Root Cause Contenders">
            {result.rootCauseContenders.map((c, i) => (
              <div key={i} className="border p-3 rounded">
                <strong>{c.cause}</strong>
                <p>{c.rationale}</p>
                <p className="text-sm text-gray-500">Confidence: {c.confidence}</p>
              </div>
            ))}
          </Section>

          <Section title="Top Action Items">
            {result.actionItems.map((a, i) => (
              <div key={i} className="border p-3 rounded">
                <strong>{a.action}</strong>
                <p className="text-sm">
                  Owner: {a.owner} · Priority: {a.priority} · Timeframe: {a.timeframe}
                </p>
                <p className="text-sm text-gray-600">{a.successCriteria}</p>
              </div>
            ))}
          </Section>
        </div>
      )}
    </main>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      <input
        className="border p-2 w-full rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      <textarea
        className="border p-2 w-full rounded min-h-[100px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border rounded p-4">
      <h2 className="font-bold mb-2">{title}</h2>
      {children}
    </section>
  );
}
