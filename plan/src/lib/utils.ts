import { StudyPlan } from "@/types/study";

// Shared Web Audio context singleton for smooth, glitch-free audio playback
let sharedAudioCtx: AudioContext | null = null;
let lastChimeTime = 0;
let lastChimeType = "";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes a pleasant, natural audio chime using the Web Audio API.
 * Features acoustic envelope shaping and debouncing to prevent harsh clipping or duplicate audio.
 */
export function playChime(type: "complete" | "timer" | "click" = "click") {
  if (typeof window === "undefined") return;

  const nowMs = Date.now();
  // Prevent duplicate overlapping sounds triggered within 60ms
  if (lastChimeType === type && nowMs - lastChimeTime < 60) {
    return;
  }
  lastChimeTime = nowMs;
  lastChimeType = type;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master filter to ensure warm, soft acoustics without harsh high frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.connect(ctx.destination);

    if (type === "complete") {
      // Warm, satisfying two-tone chime (C5 -> G5) with subtle resonance
      const notes = [
        { freq: 523.25, timeOffset: 0, duration: 0.28, gain: 0.12 },
        { freq: 783.99, timeOffset: 0.08, duration: 0.38, gain: 0.14 },
        { freq: 1046.5, timeOffset: 0.08, duration: 0.32, gain: 0.05 }, // Soft harmonic sparkle
      ];

      notes.forEach(({ freq, timeOffset, duration, gain: peakGain }) => {
        const start = now + timeOffset;
        const stop = start + duration;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        // Gentle attack followed by exponential decay
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.linearRampToValueAtTime(peakGain, start + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, stop);

        osc.connect(gainNode);
        gainNode.connect(filter);

        osc.start(start);
        osc.stop(stop);
      });
    } else if (type === "timer") {
      // Resonant, gentle notification chime
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gainNode);
      gainNode.connect(filter);

      osc.start(now);
      osc.stop(now + 0.95);
    } else {
      // Subtle, tactile micro-tick
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(450, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.04, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gainNode);
      gainNode.connect(filter);

      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Graceful fallback if audio is not permitted
  }
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatTimeSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function exportPlanToMarkdown(
  plan: StudyPlan,
  dailyHours: number,
  completedMap: Record<string, boolean>
): string {
  let md = `# 🎓 Study Plan: ${plan.subject}\n\n`;
  md += `> **Timeframe**: ${plan.target_timeframe} | **Commitment**: ${dailyHours} hrs/day\n\n`;
  md += `## 📌 Strategic Overview\n${plan.overview}\n\n`;
  md += `---\n\n## 📅 Curriculum Breakdown\n\n`;

  plan.schedule.forEach((period, pIdx) => {
    md += `### ${period.period_label}: ${period.topic_summary}\n\n`;
    period.tasks.forEach((task, tIdx) => {
      const isDone = completedMap[`${pIdx}_${tIdx}`];
      const check = isDone ? "[x]" : "[ ]";
      md += `- ${check} **${task.title}** (${task.duration_minutes}m) [${task.resource_type}]\n`;
      md += `  - ${task.description}\n`;
    });
    md += `\n`;
  });

  md += `\n*Generated by CuratePlan Engine with Gemini* ⚡\n`;
  return md;
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateICS(plan: StudyPlan): string {
  const now = new Date();
  const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CuratePlan//Curriculum Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Study Plan - ${plan.subject}`,
  ];

  const currentStartDate = new Date(now);
  currentStartDate.setHours(9, 0, 0, 0); // start at 9am each day

  plan.schedule.forEach((period, pIdx) => {
    // Advance day for each period
    const periodDate = new Date(currentStartDate);
    periodDate.setDate(periodDate.getDate() + pIdx);

    let taskTime = new Date(periodDate);

    period.tasks.forEach((task) => {
      const endTime = new Date(taskTime.getTime() + task.duration_minutes * 60000);
      const uid = `study-${Date.now()}-${pIdx}-${Math.random().toString(36).substring(2, 9)}@studyplanner.app`;

      ics.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(taskTime)}`,
        `DTEND:${formatICSDate(endTime)}`,
        `SUMMARY:[${period.period_label}] ${task.title} (${task.resource_type})`,
        `DESCRIPTION:${task.description.replace(/\n/g, "\\n")}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );

      // Next task starts 10m break after
      taskTime = new Date(endTime.getTime() + 10 * 60000);
    });
  });

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}

export function exportPlanToCSV(
  plan: StudyPlan,
  completedMap: Record<string, boolean>
): string {
  const headers = ["Module / Period", "Task Title", "Duration (Minutes)", "Resource Type", "Status", "Description"];
  const rows = [headers.join(",")];

  plan.schedule.forEach((period, pIdx) => {
    period.tasks.forEach((task, tIdx) => {
      const isDone = !!completedMap[`${pIdx}_${tIdx}`];
      const status = isDone ? "Completed" : "Pending";
      const cleanTitle = `"${(task.title || "").replace(/"/g, '""')}"`;
      const cleanDesc = `"${(task.description || "").replace(/"/g, '""')}"`;
      const cleanPeriod = `"${(period.period_label || "").replace(/"/g, '""')}"`;

      rows.push([
        cleanPeriod,
        cleanTitle,
        task.duration_minutes,
        task.resource_type,
        status,
        cleanDesc,
      ].join(","));
    });
  });

  return rows.join("\r\n");
}

export function printCurriculumDocument(plan: StudyPlan, completedMap: Record<string, boolean>) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  let totalTasks = 0;
  let doneTasks = 0;
  let totalMinutes = 0;

  plan.schedule.forEach((period, pIdx) => {
    period.tasks.forEach((task, tIdx) => {
      totalTasks++;
      totalMinutes += task.duration_minutes || 0;
      if (completedMap[`${pIdx}_${tIdx}`]) doneTasks++;
    });
  });

  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>CuratePlan Report - ${plan.subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: auto; }
          h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 4px; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
          .overview { background: #f8fafc; border-left: 4px solid #059669; padding: 12px 16px; margin-bottom: 30px; font-size: 14px; }
          .period { margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; page-break-inside: avoid; }
          .period-title { font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #1e293b; }
          .period-summary { font-size: 13px; color: #64748b; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; border-bottom: 2px solid #cbd5e1; padding: 6px 8px; }
          td { border-bottom: 1px solid #f1f5f9; padding: 8px; vertical-align: top; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #fee2e2; color: #991b1b; }
          .badge-done { background: #dcfce7; color: #166534; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>${plan.subject}</h1>
        <div class="meta">Target Timeframe: ${plan.target_timeframe} | Overall Progress: ${pct}% (${doneTasks}/${totalTasks} Tasks, ${(totalMinutes/60).toFixed(1)} Total Hours)</div>
        <div class="overview">${plan.overview}</div>
        <h2>Curriculum Schedule</h2>
        ${plan.schedule.map((p, pIdx) => `
          <div class="period">
            <div class="period-title">${p.period_label}</div>
            <div class="period-summary">${p.topic_summary}</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 25px;"></th>
                  <th>Task Title</th>
                  <th style="width: 70px;">Duration</th>
                  <th style="width: 110px;">Resource</th>
                </tr>
              </thead>
              <tbody>
                ${p.tasks.map((t, tIdx) => {
                  const isDone = !!completedMap[`${pIdx}_${tIdx}`];
                  return `
                    <tr>
                      <td>${isDone ? "☑" : "☐"}</td>
                      <td><strong>${t.title}</strong><br><span style="color:#64748b; font-size: 12px;">${t.description}</span></td>
                      <td>${t.duration_minutes}m</td>
                      <td><span class="badge ${isDone ? "badge-done" : ""}">${t.resource_type}</span></td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        `).join("")}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
