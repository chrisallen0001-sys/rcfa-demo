"use client";

console.log("APP ENV:", process.env.NEXT_PUBLIC_APP_ENV);

import { useState, useEffect } from "react";

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
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
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
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [copySuccess, setCopySuccess] = useState("");

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (loading) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  function formatResultsAsText(): string {
    if (!result) return "";

    let text = "RCFA ANALYSIS RESULTS\n";
    text += "=".repeat(50) + "\n\n";

    text += "EQUIPMENT INFORMATION\n";
    text += "-".repeat(50) + "\n";
    text += `Equipment: ${form.equipmentDescription}\n`;
    if (form.make) text += `Make: ${form.make}\n`;
    if (form.model) text += `Model: ${form.model}\n`;
    if (form.serialNumber) text += `Serial Number: ${form.serialNumber}\n`;
    if (form.age) text += `Age: ${form.age} years\n`;
    text += `\nFailure Description: ${form.failureDescription}\n`;
    text += "\n";

    text += "FOLLOW-UP QUESTIONS\n";
    text += "-".repeat(50) + "\n";
    result.followUpQuestions.forEach((q, i) => {
      text += `${i + 1}. ${q}\n`;
    });
    text += "\n";

    text += "TOP ROOT CAUSE CONTENDERS\n";
    text += "-".repeat(50) + "\n";
    result.rootCauseContenders.forEach((c, i) => {
      text += `${i + 1}. ${c.cause}\n`;
      text += `   Rationale: ${c.rationale}\n`;
      text += `   Confidence: ${c.confidence}\n\n`;
    });

    text += "TOP ACTION ITEMS\n";
    text += "-".repeat(50) + "\n";
    result.actionItems.forEach((a, i) => {
      text += `${i + 1}. ${a.action}\n`;
      text += `   Owner: ${a.owner}\n`;
      text += `   Priority: ${a.priority}\n`;
      text += `   Timeframe: ${a.timeframe}\n`;
      text += `   Success Criteria: ${a.successCriteria}\n\n`;
    });

    text += "-".repeat(50) + "\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;

    return text;
  }

  async function copyToClipboard() {
    try {
      const text = formatResultsAsText();
      await navigator.clipboard.writeText(text);
      setCopySuccess("Copied to clipboard!");
      setTimeout(() => setCopySuccess(""), 3000);
    } catch (err) {
      setCopySuccess("Failed to copy");
      setTimeout(() => setCopySuccess(""), 3000);
    }
  }

  function downloadAsText() {
    const text = formatResultsAsText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rcfa-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearForm() {
    setForm({
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
    setResult(null);
    setError("");
    setCopySuccess("");
  }

  function getErrorMessage(status: number, data: any, err: any): string {
    // Handle specific HTTP status codes
    if (status === 401) {
      return "Session expired. Please log in again.";
    }
    if (status === 429) {
      return "Rate limit exceeded. OpenAI is receiving too many requests. Please wait a moment and try again.";
    }
    if (status === 500) {
      const details = data?.details || "";
      if (details.includes("API key")) {
        return "OpenAI API key configuration error. Please contact support.";
      }
      if (details.includes("quota")) {
        return "OpenAI API quota exceeded. Please contact support.";
      }
      if (details.includes("overloaded")) {
        return "OpenAI servers are currently overloaded. Please try again in a moment.";
      }
      return `Server error: ${data?.error || "Unknown error"}`;
    }
    if (status === 400) {
      return data?.error || "Invalid request. Please check your input and try again.";
    }

    // Handle network errors
    if (err.message?.includes("fetch")) {
      return "Network error. Please check your internet connection and try again.";
    }

    // Default error message
    return data?.error || err.message || "An unexpected error occurred. Please try again.";
  }

  async function analyze() {
    // Validate required fields
    if (!form.equipmentDescription.trim()) {
      setError("Equipment Description is required. Please fill it in before analyzing.");
      return;
    }
    if (!form.failureDescription.trim()) {
      setError("Failure Description is required. Please fill it in before analyzing.");
      return;
    }

    setLoading(true);
    setSeconds(0);
    setError("");
    setResult(null);
    setCopySuccess("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Session expired, require re-login
        setAuthorized(false);
        setError("Session expired. Please log in again.");
        return;
      }

      if (!res.ok) {
        const errorMsg = getErrorMessage(res.status, data, {});
        setError(errorMsg);
        return;
      }

      setResult(data);
    } catch (err: any) {
      const errorMsg = getErrorMessage(0, {}, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
      setSeconds(0);
    }
  }

  if (!authorized) {
  const handleLogin = async () => {
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      // Success - token is stored in httpOnly cookie
      setAuthorized(true);
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">RCFA AI Demo</h1>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <input
          autoFocus
          type="password"
          placeholder="Access password"
          className="border p-2 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Enter
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <strong className="font-semibold">Error: </strong>
          <span>{error}</span>
        </div>
      )}
    </main>
  );
}


  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">RCFA AI Demo</h1>
      <p className="text-gray-600">
        Enter failure details and click Analyze to generate RCFA insights.
      </p>

      <Input
        label="Equipment Description (Required Field)"
        placeholder="e.g., Centrifugal pump, Hydraulic cylinder"
        value={form.equipmentDescription}
        onChange={(v) => updateField("equipmentDescription", v)}
      />
      <Textarea
        label="Failure Description (Required Field)"
        placeholder="e.g., Motor seized during operation, unable to rotate"
        value={form.failureDescription}
        onChange={(v) => updateField("failureDescription", v)}
      />
      <Input
        label="Make (Optional)"
        value={form.make}
        onChange={(v) => updateField("make", v)}
      />
      <Input
        label="Model (Optional)"
        value={form.model}
        onChange={(v) => updateField("model", v)}
      />
      <Input
        label="Serial Number (Optional)"
        value={form.serialNumber}
        onChange={(v) => updateField("serialNumber", v)}
      />
      <Input
        label="Age in Years (Optional)"
        placeholder="e.g., 5"
        value={form.age}
        onChange={(v) => updateField("age", v)}
      />

      <Textarea
        label="Work History (Optional)"
        placeholder="e.g., Bearing replaced Jan 2024, impeller repair Mar 2023"
        value={form.workHistory}
        onChange={(v) => updateField("workHistory", v)}
      />
      <Textarea
        label="Active PMs (Optional)"
        placeholder="e.g., Monthly lubrication, quarterly inspection"
        value={form.activePMs}
        onChange={(v) => updateField("activePMs", v)}
      />
      <Textarea
        label="Pre-Failure Conditions (Optional)"
        placeholder="e.g., Unusual vibration, high temperature reading"
        value={form.preFailure}
        onChange={(v) => updateField("preFailure", v)}
      />
      <Textarea
        label="Additional Notes (Optional)"
        value={form.additionalNotes}
        onChange={(v) => updateField("additionalNotes", v)}
      />

      <div className="space-y-1">
        <div className="flex gap-3">
          <button
            onClick={analyze}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          <button
            onClick={clearForm}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Clear Form
          </button>
        </div>

        {loading && (
          <div className="text-sm text-gray-600">Analyzing… {seconds}s</div>
        )}

        {/* Show this note BOTH while loading and not loading */}
        <div className="text-xs text-gray-500">
          Analysis may take up to 60 seconds depending on failure complexity.
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <strong className="font-semibold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex gap-3 items-center">
            <button
              onClick={copyToClipboard}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={downloadAsText}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Download as Text
            </button>
            {copySuccess && (
              <span className="text-green-600 text-sm">{copySuccess}</span>
            )}
          </div>

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
                <p className="text-sm text-gray-500">
                  Confidence: {c.confidence}
                </p>
              </div>
            ))}
          </Section>

          <Section title="Top Action Items">
            {result.actionItems.map((a, i) => (
              <div key={i} className="border p-3 rounded">
                <strong>{a.action}</strong>
                <p className="text-sm">
                  Owner: {a.owner} · Priority: {a.priority} · Timeframe:{" "}
                  {a.timeframe}
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

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      <input
        className="border p-2 w-full rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      <textarea
        className="border p-2 w-full rounded min-h-[100px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border rounded p-4">
      <h2 className="font-bold mb-2">{title}</h2>
      {children}
    </section>
  );
}
