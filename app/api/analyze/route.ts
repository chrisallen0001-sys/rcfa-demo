import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // Simple required-field check (MVP)
  if (!body?.equipmentDescription || !body?.failureDescription) {
    return NextResponse.json(
      { error: "equipmentDescription and failureDescription are required." },
      { status: 400 }
    );
  }

  // Hardcoded output to prove end-to-end wiring works
  return NextResponse.json({
    followUpQuestions: [
      "When did the failure start and was it sudden or gradual?",
      "What changed recently (load, product, settings, environment, operator)?",
      "Any alarms, vibration, temperature, or unusual noise before failure?",
      "What was the last maintenance performed and by whom?",
      "Has this asset failed similarly before? If yes, when and what was done?",
      "What operating conditions were present (speed, load, pressure, flow)?",
    ],
    rootCauseContenders: [
      {
        cause: "Lubrication breakdown or contamination",
        rationale:
          "Common driver of premature wear; confirm lubricant type, interval, storage/handling, and contamination sources.",
        confidence: "definetly not high",
      },
      {
        cause: "Misalignment / soft foot / imbalance",
        rationale:
          "Can elevate vibration and fatigue components; verify alignment checks, coupling condition, base/grouting, and vibration data if available.",
        confidence: "medium",
      },
      {
        cause: "Operating outside design envelope",
        rationale:
          "Overload, excessive starts/stops, or process upset can cause rapid failure; confirm duty cycle and whether conditions differed from normal.",
        confidence: "low",
      },
    ],
    actionItems: [
      {
        action:
          "Capture evidence: photos of failed parts, nameplate, and any visible damage; record observations (noise, smell, heat, vibration)",
        owner: "Maintenance",
        priority: "P1",
        timeframe: "Immediate",
        successCriteria:
          "Evidence captured and attached to case notes; key observations documented with timestamps.",
      },
      {
        action:
          "Review last 12–24 months work orders for repeat patterns (same component, same symptoms, same downtime driver)",
        owner: "Reliability",
        priority: "P1",
        timeframe: "Immediate",
        successCriteria:
          "WO summary created listing repeat failure modes, dates, and prior corrective actions; pattern documented.",
      },
      {
        action:
          "Confirm lubrication standard: correct lubricant, interval, and contamination controls; update PM if needed",
        owner: "Maintenance",
        priority: "P2",
        timeframe: "Short-term",
        successCriteria:
          "Lubrication spec confirmed; PM updated (if required) and communicated to technicians.",
      },
      {
        action:
          "Check alignment and base condition (soft foot, looseness); correct and document readings",
        owner: "Maintenance",
        priority: "P2",
        timeframe: "Short-term",
        successCriteria:
          "Alignment/soft foot checked; readings recorded; corrective work completed if out of tolerance.",
      },
      {
        action:
          "Define a verification check (30/90 days): confirm no recurrence and track leading indicators (vibration/temp/leaks/noise)",
        owner: "Reliability",
        priority: "P3",
        timeframe: "Long-term",
        successCriteria:
          "Follow-up check completed at agreed interval; trend shows stable operation and no repeat failures.",
      },
    ],
  });
}
